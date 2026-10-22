import os
import sys
import hmac
import logging
from datetime import datetime, timezone
from pathlib import Path

import aiohttp
from aiohttp import web
from aiogram import Bot, Dispatcher, Router
from aiogram.types import Message, BufferedInputFile, InlineKeyboardMarkup, InlineKeyboardButton
from aiogram.filters import Command, CommandObject
from aiogram.enums import ParseMode
from aiogram.client.default import DefaultBotProperties
from dotenv import load_dotenv

# Загружаем переменные окружения из файла .env (ищем в корне проекта и в текущей папке)
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")
load_dotenv()  # Fallback на локальный .env, если бот запущен отдельно

# Настройка логирования
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("apk-ci-bot")

# Строгое чтение токенов и конфигурации из .env без хардкода в коде
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_PAT")
GITHUB_OWNER = os.getenv("GITHUB_OWNER")
GITHUB_REPO = os.getenv("GITHUB_REPO")
GITHUB_DEFAULT_BRANCH = os.getenv("GITHUB_BRANCH", "main")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
PORT = int(os.getenv("PORT", "8080"))
DEV_LOG_PATH = Path(os.getenv("DEV_LOG_PATH", str(ROOT_DIR / "dev_log.md")))

AUTHORIZED_CHAT_IDS = {
    int(x.strip())
    for x in os.getenv("TELEGRAM_CHAT_IDS", "").split(",")
    if x.strip().lstrip("-").isdigit()
}

# Проверка наличия обязательного токена перед инициализацией бота
if not TELEGRAM_BOT_TOKEN:
    logger.critical(
        "ОШИБКА: Переменная TELEGRAM_BOT_TOKEN не задана! "
        "Создайте файл .env и укажите TELEGRAM_BOT_TOKEN=ваш_токен"
    )
    sys.exit(1)

bot = Bot(
    token=TELEGRAM_BOT_TOKEN,
    default=DefaultBotProperties(parse_mode=ParseMode.HTML)
)
dp = Dispatcher()
router = Router()
dp.include_router(router)


def is_authorized(chat_id: int) -> bool:
    """Проверка доступа: только разрешенные chat_id из .env могут управлять сборкой."""
    if not AUTHORIZED_CHAT_IDS:
        return False
    return chat_id in AUTHORIZED_CHAT_IDS


def append_to_dev_log(entry: str) -> None:
    """Записывает событие в корневой файл dev_log.md."""
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


async def trigger_github_dispatch(
    event_type: str = "build_apk",
    branch: str = GITHUB_DEFAULT_BRANCH,
    initiated_by: str = "Telegram Bot",
    notes: str = "Принудительная сборка по команде /build"
) -> tuple[bool, str]:
    """
    Отправляет POST-запрос к GitHub API (Repository Dispatch),
    чтобы инициировать принудительную сборку APK и бэкап в GitHub Actions.
    """
    if not all([GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO]):
        return False, "В файле .env не заданы GITHUB_PAT, GITHUB_OWNER или GITHUB_REPO."

    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/dispatches"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/1.0"
    }
    payload = {
        "event_type": event_type,
        "client_payload": {
            "branch": branch,
            "initiated_by": initiated_by,
            "notes": notes,
            "timestamp": datetime.now(timezone.utc).isoformat()
        }
    }

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status == 204:
                return True, "Сборка успешно поставлена в очередь GitHub Actions (HTTP 204)."
            error_text = await resp.text()
            return False, f"Ошибка GitHub API (HTTP {resp.status}): {error_text}"


# =====================================================================
# 1. КОМАНДЫ TELEGRAM-БОТА (/start, /build, /status, /log)
# =====================================================================

@router.message(Command("start"))
async def cmd_start(message: Message):
    chat_id = message.chat.id
    auth_status = "Доступ разрешен" if is_authorized(chat_id) else "Нет в списке TELEGRAM_CHAT_IDS (.env)"
    await message.answer(
        f"<b>CI/CD Бот управления сборкой мобильной игры</b>\n\n"
        f"Ваш Chat ID: <code>{chat_id}</code> ({auth_status})\n"
        f"Репозиторий: <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n\n"
        f"<b>Доступные команды:</b>\n"
        f"• /build [ветка] [комментарий] — запустить принудительную сборку APK\n"
        f"• /status — проверить статус последнего пайплайна GitHub Actions\n"
        f"• /log [текст] — прочитать или добавить запись в <code>dev_log.md</code>"
    )


@router.message(Command("build"))
async def cmd_build(message: Message, command: CommandObject):
    if not is_authorized(message.chat.id):
        await message.answer("⛔ У вас нет прав для запуска сборки. Добавьте ваш Chat ID в <code>TELEGRAM_CHAT_IDS</code> в файле <code>.env</code>.")
        return

    args = (command.args or "").split(maxsplit=1)
    branch = args[0] if len(args) >= 1 else GITHUB_DEFAULT_BRANCH
    notes = args[1] if len(args) >= 2 else "Ручной запуск через /build"
    user_label = f"@{message.from_user.username}" if message.from_user and message.from_user.username else str(message.chat.id)

    status_msg = await message.answer(
        f"⏳ Отправляю сигнал <code>repository_dispatch (build_apk)</code> в репозиторий "
        f"<code>{GITHUB_OWNER}/{GITHUB_REPO}</code> (ветка: <code>{branch}</code>)..."
    )

    success, details = await trigger_github_dispatch(
        event_type="build_apk",
        branch=branch,
        initiated_by=user_label,
        notes=notes
    )

    if success:
        append_to_dev_log(f"Запущена сборка APK из Telegram ({user_label}), ветка `{branch}`: {notes}")
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [InlineKeyboardButton(
                text="Открыть GitHub Actions",
                url=f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/actions"
            )]
        ])
        await status_msg.edit_text(
            f"✅ <b>Запрос на сборку принят GitHub!</b>\n\n"
            f"• <b>Репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n"
            f"• <b>Ветка:</b> <code>{branch}</code>\n"
            f"• <b>Инициатор:</b> {user_label}\n"
            f"• <b>Комментарий:</b> {notes}\n\n"
            f"По завершении компиляции и подписи <code>.apk</code> бот пришлет готовый файл в этот чат.",
            reply_markup=kb
        )
    else:
        await status_msg.edit_text(f"❌ <b>Не удалось запустить сборку:</b>\n<code>{details}</code>")


@router.message(Command("status"))
async def cmd_status(message: Message):
    if not is_authorized(message.chat.id):
        await message.answer("⛔ Доступ запрещен.")
        return

    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/actions/runs?per_page=1"
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28"
    }

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                await message.answer(f"⚠️ Не удалось получить статус GitHub Actions (HTTP {resp.status}).")
                return
            data = await resp.json()

    runs = data.get("workflow_runs", [])
    if not runs:
        await message.answer("Сборок в GitHub Actions пока не найдено.")
        return

    latest = runs[0]
    await message.answer(
        f"📊 <b>Последний запуск CI/CD:</b>\n\n"
        f"• <b>Workflow:</b> {latest.get('name')}\n"
        f"• <b>Статус:</b> <code>{latest.get('status')}</code> ({latest.get('conclusion') or 'в процессе'})\n"
        f"• <b>Ветка:</b> <code>{latest.get('head_branch')}</code>\n"
        f"• <b>Коммит:</b> <code>{latest.get('head_sha', '')[:7]}</code>\n"
        f"• <b>Ссылка:</b> {latest.get('html_url')}"
    )


@router.message(Command("log"))
async def cmd_log(message: Message, command: CommandObject):
    if not is_authorized(message.chat.id):
        await message.answer("⛔ Доступ запрещен.")
        return

    if command.args:
        append_to_dev_log(command.args.strip())
        await message.answer(f"📝 Запись добавлена в <code>dev_log.md</code>:\n<code>{command.args.strip()}</code>")
        return

    if not DEV_LOG_PATH.exists():
        await message.answer("Файл <code>dev_log.md</code> еще не создан.")
        return

    content = DEV_LOG_PATH.read_text(encoding="utf-8")
    tail = content[-1500:] if len(content) > 1500 else content
    await message.answer(f"📖 <b>Последние записи из dev_log.md:</b>\n\n<pre>{tail}</pre>")


# =====================================================================
# 2. HTTP-ЭНДПОИНТЫ ДЛЯ ПРИЕМА APK ОТ GITHUB ACTIONS И HEALTHCHECK
# =====================================================================

async def handle_health(request: web.Request) -> web.Response:
    """Эндпоинт проверки здоровья для Render / Railway / VPS."""
    return web.json_response({"status": "ok", "repo": f"{GITHUB_OWNER}/{GITHUB_REPO}"})


async def handle_upload_apk(request: web.Request) -> web.Response:
    """
    Принимает multipart/form-data запрос от GitHub Actions с готовым файлом .apk
    и метаданными сборки, затем рассылает подписанный APK всем разрешенным чатам.
    Заголовок авторизации: X-Webhook-Secret: <WEBHOOK_SECRET из .env>
    """
    secret_header = request.headers.get("X-Webhook-Secret", "")
    if not WEBHOOK_SECRET or not hmac.compare_digest(secret_header, WEBHOOK_SECRET):
        return web.json_response({"error": "Invalid or missing X-Webhook-Secret"}, status=403)

    reader = await request.multipart()
    apk_bytes = None
    apk_filename = "app-release.apk"
    meta = {
        "commit_sha": "unknown",
        "commit_msg": "Без описания",
        "author": "unknown",
        "branch": GITHUB_DEFAULT_BRANCH,
        "build_number": "1",
        "backup_archive": ""
    }

    async for field in reader:
        if field.name == "apk_file":
            apk_filename = field.filename or apk_filename
            apk_bytes = await field.read()
        elif field.name in meta:
            meta[field.name] = (await field.read(decode=True)).decode("utf-8", errors="replace")

    if not apk_bytes:
        return web.json_response({"error": "apk_file field is required"}, status=400)

    short_sha = meta["commit_sha"][:7]
    caption = (
        f"📦 <b>Готова новая сборка APK (#{meta['build_number']})</b>\n\n"
        f"• <b>Репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\n"
        f"• <b>Ветка:</b> <code>{meta['branch']}</code>\n"
        f"• <b>Автор:</b> {meta['author']}\n"
        f"• <b>Коммит:</b> <code>{short_sha}</code>\n"
        f"• <b>Сообщение:</b> {meta['commit_msg']}\n"
    )
    if meta["backup_archive"]:
        caption += f"• <b>Бэкап исходников:</b> <code>{meta['backup_archive']}</code>\n"

    append_to_dev_log(
        f"Сборка #{meta['build_number']} ({short_sha} от {meta['author']}): `{apk_filename}` доставлена в Telegram."
    )

    sent_count = 0
    for chat_id in AUTHORIZED_CHAT_IDS:
        try:
            doc = BufferedInputFile(apk_bytes, filename=apk_filename)
            await bot.send_document(chat_id=chat_id, document=doc, caption=caption)
            sent_count += 1
        except Exception as exc:
            logger.error(f"Ошибка отправки APK в чат {chat_id}: {exc}")

    return web.json_response({"ok": True, "delivered_to": sent_count})


async def main():
    app = web.Application(client_max_size=200 * 1024 * 1024)  # До 200 МБ для игровых APK
    app.router.add_get("/health", handle_health)
    app.router.add_post("/api/upload-apk", handle_upload_apk)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host="0.0.0.0", port=PORT)
    await site.start()
    logger.info(f"HTTP-сервер запущен на порту {PORT} (/health, /api/upload-apk)")

    try:
        logger.info("Сброс активного вебхука (если был установлен) и запуск Telegram Long Polling...")
        await bot.delete_webhook(drop_pending_updates=True)
        await dp.start_polling(bot)
    finally:
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
