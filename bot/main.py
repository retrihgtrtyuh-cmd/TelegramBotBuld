import os
import sys
import hmac
import logging
from datetime import datetime, timezone
from pathlib import Path

import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher, Router, F
from aiogram.types import (
    Message,
    BufferedInputFile,
    InlineKeyboardMarkup,
    InlineKeyboardButton,
    ReplyKeyboardMarkup,
    KeyboardButton,
    CallbackQuery
)
from aiogram.filters import Command, CommandObject
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from dotenv import load_dotenv

# Загружаем переменные окружения из .env (в корне проекта и в папке bot/)
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")
load_dotenv()

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("apk-ci-bot")

# Конфигурация: строго целевой репозиторий игры
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_PAT")
GITHUB_OWNER = os.getenv("GITHUB_OWNER", "retrihgtrtyuh-cmd")
GITHUB_REPO = os.getenv("GITHUB_REPO", "xianxia-sect-maneger")
GITHUB_WORKFLOW = os.getenv("GITHUB_WORKFLOW", "build-apk.yml")
GITHUB_DEFAULT_BRANCH = os.getenv("GITHUB_BRANCH", "main")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
PORT = int(os.getenv("PORT", "8080"))
DEV_LOG_PATH = Path(os.getenv("DEV_LOG_PATH", str(ROOT_DIR / "dev_log.md")))

# Разрешенные ID чатов и приватного канала (-1003962969725)
raw_chat_ids = os.getenv("TELEGRAM_CHAT_IDS", "-1003962969725")
AUTHORIZED_CHAT_IDS = {
    int(x.strip()) for x in raw_chat_ids.split(",")
    if x.strip().lstrip("-").isdigit()
}
# Всегда гарантируем присутствие ID вашего канала
AUTHORIZED_CHAT_IDS.add(-1003962969725)

if not TELEGRAM_BOT_TOKEN:
    logger.critical("ОШИБКА: TELEGRAM_BOT_TOKEN не задан в .env!")
    sys.exit(1)

bot = Bot(
    token=TELEGRAM_BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()
router = Router()
dp.include_router(router)


def is_authorized(chat_id: int) -> bool:
    """Проверка доступа: разрешает команды из личных чатов админа и канала."""
    return chat_id in AUTHORIZED_CHAT_IDS


def append_to_dev_log(entry: str) -> None:
    """Фиксирует событие в корневом файле dev_log.md."""
    try:
        timestamp = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        line = f"\n- **[{timestamp}]** {entry}\n"
        if DEV_LOG_PATH.exists():
            with open(DEV_LOG_PATH, "a", encoding="utf-8") as f:
                f.write(line)
        else:
            DEV_LOG_PATH.write_text(f"# Dev Log\n{line}", encoding="utf-8")
    except Exception as exc:
        logger.warning(f"Не удалось обновить dev_log.md: {exc}")


async def trigger_github_workflow(
    branch: str = GITHUB_DEFAULT_BRANCH,
    notes: str = "Запуск сборки из Telegram",
    initiated_by: str = "Telegram"
) -> tuple[bool, str]:
    """
    Запускает сборку APK в целевом репозитории retrihgtrtyuh-cmd/xianxia-sect-maneger
    через вызов workflow_dispatch для файла build-apk.yml.
    """
    if not GITHUB_TOKEN:
        return False, "В .env не задан GITHUB_PAT (Personal Access Token)."

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/1.0"
    }

    # 1. Основной запуск: workflow_dispatch для build-apk.yml
    workflow_url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/actions/workflows/{GITHUB_WORKFLOW}/dispatches"
    payload = {
        "ref": branch,
        "inputs": {
            "notes": f"{notes} (от {initiated_by})"
        }
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(workflow_url, json=payload, headers=headers) as resp:
            if resp.status == 204:
                return True, f"Workflow {GITHUB_WORKFLOW} успешно запущен в {GITHUB_OWNER}/{GITHUB_REPO} (HTTP 204)."

            err_text = await resp.text()
            logger.warning(f"workflow_dispatch вернул HTTP {resp.status}: {err_text}. Пробуем repository_dispatch...")

        # 2. Резервный вызов через repository_dispatch (build_apk)
        dispatch_url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/dispatches"
        dispatch_payload = {
            "event_type": "build_apk",
            "client_payload": {
                "branch": branch,
                "notes": notes,
                "initiated_by": initiated_by,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        async with session.post(dispatch_url, json=dispatch_payload, headers=headers) as resp:
            if resp.status == 204:
                return True, f"Repository dispatch успешно отправлен в {GITHUB_OWNER}/{GITHUB_REPO} (HTTP 204)."
            second_err = await resp.text()
            return False, f"Ошибка запуска на GitHub (HTTP {resp.status}): {second_err}"


# =====================================================================
# КЛАВИАТУРЫ (КРАСИВЫЕ КНОПКИ ДЛЯ КОМАНД)
# =====================================================================

def get_main_reply_keyboard() -> ReplyKeyboardMarkup:
    """Постоянная нижняя клавиатура с красивыми кнопками."""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🚀 Собрать APK (main)"),
                KeyboardButton(text="📊 Статус CI/CD"),
            ],
            [
                KeyboardButton(text="📖 Журнал сборок (log)"),
                KeyboardButton(text="ℹ️ О репозитории"),
            ]
        ],
        resize_keyboard=True,
        is_persistent=True
    )


def get_start_inline_keyboard() -> InlineKeyboardMarkup:
    """Инлайн-кнопки прямо под сообщением."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🚀 Запустить сборку APK", callback_data="cb_build"),
                InlineKeyboardButton(text="📊 Статус Actions", callback_data="cb_status"),
            ],
            [
                InlineKeyboardButton(text="📖 Журнал dev_log.md", callback_data="cb_log"),
                InlineKeyboardButton(
                    text="🌐 GitHub Actions",
                    url=f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/actions"
                ),
            ]
        ]
    )


async def perform_build(chat_id: int, sender_label: str, branch: str, notes: str, reply_to_message: Message = None):
    """Выполняет запуск сборки APK и отправляет статус с кнопкой перехода на GitHub."""
    if not is_authorized(chat_id):
        text = f"⛔ Chat ID <code>{chat_id}</code> не авторизован для запуска сборки."
        if reply_to_message:
            await reply_to_message.answer(text)
        else:
            await bot.send_message(chat_id, text)
        return

    init_text = (
        f"⏳ Запускаю воркфлоу <code>{GITHUB_WORKFLOW}</code> в репозитории "
        f"<code>{GITHUB_OWNER}/{GITHUB_REPO}</code> (ветка: <code>{branch}</code>)..."
    )
    if reply_to_message:
        status_msg = await reply_to_message.answer(init_text)
    else:
        status_msg = await bot.send_message(chat_id, init_text)

    success, details = await trigger_github_workflow(
        branch=branch,
        notes=notes,
        initiated_by=sender_label
    )

    if success:
        append_to_dev_log(f"Сборка APK запущена из {sender_label}, ветка `{branch}`: {notes}")
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="🌐 Открыть GitHub Actions",
                url=f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/actions"
            )
        ]])
        await status_msg.edit_text(
            f"✅ <b>Сборка успешно инициирована в GitHub Actions!</b>\n\n"
            f"• <b>Репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n"
            f"• <b>Файл сборки:</b> <code>{GITHUB_WORKFLOW}</code>\n"
            f"• <b>Ветка:</b> <code>{branch}</code>\n"
            f"• <b>Инициатор:</b> {sender_label}\n"
            f"• <b>Примечание:</b> {notes}\n\n"
            f"Готовый файл <code>.apk</code> будет отправлен в чат сразу после сборки.",
            reply_markup=kb
        )
    else:
        await status_msg.edit_text(f"❌ <b>Ошибка запуска сборки:</b>\n<code>{details}</code>")


async def get_status_text() -> tuple[str, InlineKeyboardMarkup | None]:
    """Запрашивает статус последнего запуска на GitHub Actions."""
    if not GITHUB_TOKEN:
        return "⚠️ В .env не задан GITHUB_PAT.", None

    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/actions/runs?per_page=1"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/1.0"
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                return f"⚠️ Не удалось получить статус (HTTP {resp.status}).", None
            data = await resp.json()

    runs = data.get("workflow_runs", [])
    if not runs:
        return f"Сборок в репозитории <code>{GITHUB_OWNER}/{GITHUB_REPO}</code> пока не найдено.", None

    latest = runs[0]
    kb = InlineKeyboardMarkup(inline_keyboard=[[
        InlineKeyboardButton(
            text="🌐 Открыть на GitHub",
            url=latest.get("html_url", f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/actions")
        ),
        InlineKeyboardButton(text="🔄 Обновить", callback_data="cb_status")
    ]])
    text = (
        f"📊 <b>Статус последнего запуска CI/CD:</b>\n\n"
        f"• <b>Репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n"
        f"• <b>Workflow:</b> {latest.get('name')}\n"
        f"• <b>Статус:</b> <code>{latest.get('status')}</code> ({latest.get('conclusion') or 'в процессе'})\n"
        f"• <b>Ветка:</b> <code>{latest.get('head_branch')}</code>\n"
        f"• <b>Коммит:</b> <code>{latest.get('head_sha', '')[:7]}</code>\n"
        f"• <b>Время:</b> {latest.get('created_at', '')[:19].replace('T', ' ')} UTC"
    )
    return text, kb


def get_log_text() -> str:
    """Возвращает хвост файла dev_log.md."""
    if not DEV_LOG_PATH.exists():
        return "Файл <code>dev_log.md</code> пока не найден."
    content = DEV_LOG_PATH.read_text(encoding="utf-8")
    tail = content[-1500:] if len(content) > 1500 else content
    return f"📖 <b>Последние записи из dev_log.md:</b>\n\n<pre>{tail}</pre>"


# =====================================================================
# ОБРАБОТЧИКИ КОМАНД, ТЕКСТОВЫХ КНОПОК И ИНЛАЙН-КНОПОК
# =====================================================================

@router.message(Command("start"))
@router.channel_post(Command("start"))
async def cmd_start(message: Message):
    chat_id = message.chat.id
    auth_status = "Доступ разрешен" if is_authorized(chat_id) else "Нет в списке разрешенных"
    await message.answer(
        f"<b>CI/CD Панель управления сборкой APK</b>\n\n"
        f"• <b>Целевой репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n"
        f"• <b>Воркфлоу:</b> <code>{GITHUB_WORKFLOW}</code>\n"
        f"• <b>Текущий Chat ID:</b> <code>{chat_id}</code> ({auth_status})\n\n"
        f"Используйте кнопки ниже для быстрого управления:",
        reply_markup=get_start_inline_keyboard()
    )
    # Включаем нижнюю клавиатуру кнопок для удобного клика в 1 касание
    if message.chat.type != "channel":
        await message.answer(
            "Меню быстрых команд активировано 👇",
            reply_markup=get_main_reply_keyboard()
        )


@router.message(Command("build"))
@router.channel_post(Command("build"))
async def cmd_build(message: Message, command: CommandObject):
    args = (command.args or "").split(maxsplit=1)
    branch = args[0] if len(args) >= 1 else GITHUB_DEFAULT_BRANCH
    notes = args[1] if len(args) >= 2 else "Ручной запуск сборки из Telegram"

    sender_label = (
        f"@{message.from_user.username}"
        if message.from_user and message.from_user.username
        else f"Канал ({message.chat.id})" if message.chat.type == "channel"
        else str(message.chat.id)
    )
    await perform_build(message.chat.id, sender_label, branch, notes, reply_to_message=message)


@router.message(F.text == "🚀 Собрать APK (main)")
async def reply_btn_build(message: Message):
    sender_label = f"@{message.from_user.username}" if message.from_user and message.from_user.username else str(message.chat.id)
    await perform_build(message.chat.id, sender_label, GITHUB_DEFAULT_BRANCH, "Запуск через кнопку меню", reply_to_message=message)


@router.message(Command("status"))
@router.channel_post(Command("status"))
@router.message(F.text == "📊 Статус CI/CD")
async def cmd_status(message: Message):
    if not is_authorized(message.chat.id):
        await message.answer("⛔ Доступ запрещен.")
        return
    text, kb = await get_status_text()
    await message.answer(text, reply_markup=kb)


@router.message(Command("log"))
@router.channel_post(Command("log"))
async def cmd_log(message: Message, command: CommandObject):
    if not is_authorized(message.chat.id):
        return

    if command.args:
        append_to_dev_log(command.args.strip())
        await message.answer(f"📝 Запись добавлена в <code>dev_log.md</code>.")
        return

    await message.answer(get_log_text())


@router.message(F.text == "📖 Журнал сборок (log)")
async def reply_btn_log(message: Message):
    if not is_authorized(message.chat.id):
        return
    await message.answer(get_log_text())


@router.message(F.text == "ℹ️ О репозитории")
async def reply_btn_info(message: Message):
    chat_id = message.chat.id
    auth_status = "Доступ разрешен" if is_authorized(chat_id) else "Нет в списке разрешенных"
    await message.answer(
        f"ℹ️ <b>Информация о сборке:</b>\n\n"
        f"• <b>Репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n"
        f"• <b>Файл воркфлоу:</b> <code>{GITHUB_WORKFLOW}</code>\n"
        f"• <b>Ветка:</b> <code>{GITHUB_DEFAULT_BRANCH}</code>\n"
        f"• <b>Ваш Chat ID:</b> <code>{chat_id}</code> ({auth_status})",
        reply_markup=get_start_inline_keyboard()
    )


# ---------------------------------------------------------------------
# ОБРАБОТЧИКИ НАЖАТИЙ НА ИНЛАЙН-КНОПКИ (CALLBACKS)
# ---------------------------------------------------------------------

@router.callback_query(F.data == "cb_build")
async def callback_build(call: CallbackQuery):
    await call.answer()
    sender_label = f"@{call.from_user.username}" if call.from_user and call.from_user.username else str(call.message.chat.id)
    await perform_build(call.message.chat.id, sender_label, GITHUB_DEFAULT_BRANCH, "Запуск через инлайн-кнопку", reply_to_message=call.message)


@router.callback_query(F.data == "cb_status")
async def callback_status(call: CallbackQuery):
    await call.answer("Запрашиваю статус...")
    text, kb = await get_status_text()
    try:
        await call.message.edit_text(text, reply_markup=kb)
    except Exception:
        await call.message.answer(text, reply_markup=kb)


@router.callback_query(F.data == "cb_log")
async def callback_log(call: CallbackQuery):
    await call.answer()
    await call.message.answer(get_log_text())


# =====================================================================
# ВЕБ-СЕРВЕР AIOHTTP (GET /, GET /health, POST /api/upload-apk)
# =====================================================================

async def handle_root(request: web.Request) -> web.Response:
    """Корневой маршрут GET / для Render (отвечает 200 OK 'Bot is alive')."""
    return web.Response(text="Bot is alive", status=200, content_type="text/plain")


async def handle_health(request: web.Request) -> web.Response:
    """Проверка здоровья GET /health."""
    return web.json_response({
        "status": "ok",
        "bot": "alive",
        "target_repo": f"{GITHUB_OWNER}/{GITHUB_REPO}",
        "workflow": GITHUB_WORKFLOW
    })


async def handle_upload_apk(request: web.Request) -> web.Response:
    """Прием собранного APK от GitHub Actions и рассылка в чаты/канал."""
    secret_header = request.headers.get("X-Webhook-Secret", "")
    if WEBHOOK_SECRET and not hmac.compare_digest(secret_header, WEBHOOK_SECRET):
        return web.json_response({"error": "Forbidden"}, status=403)

    reader = await request.multipart()
    apk_bytes = None
    apk_filename = "app-release.apk"
    meta = {
        "commit_sha": "unknown",
        "commit_msg": "Без описания",
        "author": "unknown",
        "branch": GITHUB_DEFAULT_BRANCH,
        "build_number": "1"
    }

    async for field in reader:
        if field.name == "apk_file":
            apk_filename = field.filename or apk_filename
            apk_bytes = await field.read()
        elif field.name in meta:
            meta[field.name] = (await field.read(decode=True)).decode("utf-8", errors="replace")

    if not apk_bytes:
        return web.json_response({"error": "apk_file missing"}, status=400)

    caption = (
        f"📦 <b>Готова новая сборка APK (#{meta['build_number']})</b>\n\n"
        f"• <b>Репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n"
        f"• <b>Ветка:</b> <code>{meta['branch']}</code>\n"
        f"• <b>Автор:</b> {meta['author']}\n"
        f"• <b>Коммит:</b> <code>{meta['commit_sha'][:7]}</code> — {meta['commit_msg']}"
    )

    for chat_id in AUTHORIZED_CHAT_IDS:
        try:
            doc = BufferedInputFile(apk_bytes, filename=apk_filename)
            await bot.send_document(chat_id=chat_id, document=doc, caption=caption)
        except Exception as exc:
            logger.error(f"Ошибка отправки APK в {chat_id}: {exc}")

    return web.json_response({"ok": True})


async def main():
    app = web.Application(client_max_size=200 * 1024 * 1024)
    # Корневой маршрут GET / для Render (200 OK)
    app.router.add_get("/", handle_root)
    app.router.add_get("/health", handle_health)
    app.router.add_post("/api/upload-apk", handle_upload_apk)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host="0.0.0.0", port=PORT)
    await site.start()
    logger.info(f"Веб-сервер запущен на порту {PORT} (эндпоинты: GET /, GET /health, POST /api/upload-apk)")

    try:
        # Сброс вебхука перед стартом опроса для исключения конфликтов
        logger.info("Сброс активного вебхука...")
        await bot.delete_webhook(drop_pending_updates=True)

        logger.info(f"Запуск Long Polling для репозитория {GITHUB_OWNER}/{GITHUB_REPO}...")
        # Явно регистрируем обновления и сообщений, и постов канала
        await dp.start_polling(bot, allowed_updates=["message", "channel_post"])
    finally:
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
