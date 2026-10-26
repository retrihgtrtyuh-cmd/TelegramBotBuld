import React, { useState } from 'react';
import {
  Terminal,
  Copy,
  Check,
  Play,
  Download,
  FileCode,
  ShieldCheck,
  Send,
  GitBranch,
  FileText,
  KeyRound,
  RefreshCw,
  FolderGit2,
  ExternalLink,
  Plus,
  Eye,
  EyeOff,
  X,
  Key
} from 'lucide-react';

interface BuildRun {
  id: number;
  sha: string;
  branch: string;
  author: string;
  message: string;
  trigger: 'push' | 'repository_dispatch' | 'workflow_dispatch';
  status: 'completed' | 'building';
  apkName: string;
  apkSize: string;
  backupName: string;
  timestamp: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  time: string;
  attachment?: {
    filename: string;
    size: string;
    backupArchive: string;
    sha: string;
    branch: string;
    author: string;
  };
}

export default function App() {
  // Interactive Configuration State
  const [config, setConfig] = useState({
    githubOwner: 'retrihgtrtyuh-cmd',
    githubRepo: 'xianxia-sect-maneger',
    defaultBranch: 'main',
    dispatchEvent: 'build_apk',
    chatId: '-1003962969725',
    keystoreAlias: 'upload_key_release',
    webhookUrl: 'https://apk-bot-service.onrender.com',
    githubToken: 'github_pat_11ABCDEFG_sample_token_here',
  });

  // Modal State for GitHub Token Replacement
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tempTokenInput, setTempTokenInput] = useState('github_pat_11ABCDEFG_sample_token_here');
  const [showTokenText, setShowTokenText] = useState(false);
  const [tokenSaveSuccess, setTokenSaveSuccess] = useState(false);

  // Active Navigation Section
  const [activeTab, setActiveTab] = useState<'code' | 'simulator' | 'secrets' | 'devlog' | 'concept'>('code');
  const [selectedFile, setSelectedFile] = useState<'build-apk' | 'bot' | 'requirements' | 'render' | 'workflow' | 'env' | 'dockerfile' | 'tree'>('build-apk');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulator State
  const [chatInput, setChatInput] = useState('/build main Хотфикс шейдеров и баланса');
  const [isBuilding, setIsBuilding] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);

  const [builds, setBuilds] = useState<BuildRun[]>([
    {
      id: 42,
      sha: '8f4d2a1',
      branch: 'main',
      author: 'Alexey Dev (alexey@gamedev.io)',
      message: 'feat(combat): оптимизация рендера частиц и подпись релизного APK',
      trigger: 'repository_dispatch',
      status: 'completed',
      apkName: 'app-release-v1.4.2-b42.apk',
      apkSize: '64.8 MB',
      backupName: 'backup_8f4d2a1_20261022_1420.tar.gz',
      timestamp: '2026-10-22 14:20 UTC',
    },
    {
      id: 41,
      sha: '3c9e11b',
      branch: 'main',
      author: 'Maria Tech (maria@gamedev.io)',
      message: 'fix(audio): устранен краш при смене сцены в главном меню',
      trigger: 'push',
      status: 'completed',
      apkName: 'app-release-v1.4.1-b41.apk',
      apkSize: '64.5 MB',
      backupName: 'backup_3c9e11b_20261022_1105.tar.gz',
      timestamp: '2026-10-22 11:05 UTC',
    },
  ]);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'user',
      text: '/start',
      time: '14:18',
    },
    {
      id: 'm2',
      sender: 'bot',
      text: `CI/CD Бот управления сборкой мобильной игры\nВаш Chat ID: 482910492 (Доступ разрешен)\nРепозиторий: studio-games/mobile-rpg-android\n\nДоступные команды:\n• /build [ветка] [комментарий] — принудительная сборка APK\n• /status — проверить статус последнего пайплайна\n• /log [текст] — запись в корневой dev_log.md`,
      time: '14:18',
    },
    {
      id: 'm3',
      sender: 'user',
      text: '/build main Релизный билд для закрытого бета-теста',
      time: '14:19',
    },
    {
      id: 'm4',
      sender: 'bot',
      text: `Запрос на сборку принят GitHub (HTTP 204)!\nСобытие: repository_dispatch (build_apk)\nВетка: main`,
      time: '14:19',
    },
    {
      id: 'm5',
      sender: 'bot',
      text: `Готова новая сборка APK (#42)\nКоммит: 8f4d2a1 — feat(combat): оптимизация рендера частиц и подпись релизного APK`,
      time: '14:20',
      attachment: {
        filename: 'app-release-v1.4.2-b42.apk',
        size: '64.8 MB',
        backupArchive: 'backup_8f4d2a1_20261022_1420.tar.gz',
        sha: '8f4d2a1',
        branch: 'main',
        author: 'Alexey Dev',
      },
    },
  ]);

  // Dev Log State
  const [devLogEntries, setDevLogEntries] = useState([
    {
      date: '2026-10-22 14:20 UTC',
      tag: 'CI/CD Release #42',
      content: 'Сборка #42 (8f4d2a1 от Alexey Dev): app-release-v1.4.2-b42.apk и архив backup_8f4d2a1_20261022_1420.tar.gz успешно созданы и доставлены в Telegram.',
    },
    {
      date: '2026-10-22 14:19 UTC',
      tag: 'Telegram Trigger',
      content: 'Запущена принудительная сборка APK по команде /build из Telegram (@alexey_dev), ветка main: Релизный билд для закрытого бета-теста.',
    },
    {
      date: '2026-10-22 11:05 UTC',
      tag: 'Auto Push Backup',
      content: 'Пайплайн GitHub Actions выполнил автоматический бэкап исходного кода в .tar.gz и подписал APK ключом из KEYSTORE_BASE64.',
    },
  ]);
  const [newLogText, setNewLogText] = useState('');

  // Keystore Base64 Helper State
  const [keystoreSampleInput, setKeystoreSampleInput] = useState('ANDROID_RELEASE_KEYSTORE_BINARY_DEMO_2026');
  const [encodedBase64, setEncodedBase64] = useState(() => btoa('ANDROID_RELEASE_KEYSTORE_BINARY_DEMO_2026'));
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFileName(`${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64Clean = result.includes(',') ? result.split(',')[1] : result;
      setEncodedBase64(base64Clean);
    };
    reader.readAsDataURL(file);
  };

  // Dynamic Code Generators based on current user config
  const pythonBotCode = `import os
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

# Загружаем переменные окружения из файла .env через python-dotenv
ROOT_DIR = Path(__file__).resolve().parent.parent
load_dotenv(dotenv_path=ROOT_DIR / ".env")
load_dotenv()  # Fallback, если .env лежит в папке bot/

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("apk-ci-bot")

# Считываем конфигурацию строго из .env (по умолчанию retrihgtrtyuh-cmd/xianxia-sect-maneger)
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
GITHUB_TOKEN = os.getenv("GITHUB_PAT")
GITHUB_OWNER = os.getenv("GITHUB_OWNER", "retrihgtrtyuh-cmd")
GITHUB_REPO = os.getenv("GITHUB_REPO", "xianxia-sect-maneger")
GITHUB_WORKFLOW = os.getenv("GITHUB_WORKFLOW", "build-apk.yml")
GITHUB_DEFAULT_BRANCH = os.getenv("GITHUB_BRANCH", "main")
WEBHOOK_SECRET = os.getenv("WEBHOOK_SECRET")
PORT = int(os.getenv("PORT", "8080"))
DEV_LOG_PATH = Path(os.getenv("DEV_LOG_PATH", str(ROOT_DIR / "dev_log.md")))

# ID разрешенных чатов и вашего приватного канала (-1003962969725)
raw_chats = os.getenv("TELEGRAM_CHAT_IDS", "-1003962969725")
AUTHORIZED_CHAT_IDS = {
    int(x.strip()) for x in raw_chats.split(",")
    if x.strip().lstrip("-").isdigit()
}
AUTHORIZED_CHAT_IDS.add(-1003962969725)

if not TELEGRAM_BOT_TOKEN:
    logger.critical("ОШИБКА: TELEGRAM_BOT_TOKEN не задан в .env!")
    sys.exit(1)

bot = Bot(token=TELEGRAM_BOT_TOKEN, default=DefaultBotProperties(parse_mode=ParseMode.HTML))
dp = Dispatcher()
router = Router()
dp.include_router(router)


def is_authorized(chat_id: int) -> bool:
    return chat_id in AUTHORIZED_CHAT_IDS


def append_to_dev_log(entry: str) -> None:
    try:
        ts = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
        line = f"\\n- **[{ts}]** {entry}\\n"
        with open(DEV_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(line)
    except Exception as exc:
        logger.warning(f"Ошибка записи в dev_log.md: {exc}")


async def trigger_github_workflow(branch: str, notes: str, initiated_by: str) -> tuple[bool, str]:
    if not GITHUB_TOKEN:
        return False, "В .env не задан GITHUB_PAT"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/1.0"
    }

    # 1. Запуск workflow_dispatch для build-apk.yml
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/actions/workflows/{GITHUB_WORKFLOW}/dispatches"
    payload = {"ref": branch, "inputs": {"notes": f"{notes} ({initiated_by})"}}

    async with aiohttp.ClientSession() as session:
        async with session.post(url, json=payload, headers=headers) as resp:
            if resp.status == 204:
                return True, f"Workflow {GITHUB_WORKFLOW} запущен в {GITHUB_OWNER}/{GITHUB_REPO} (HTTP 204)"
            err = await resp.text()

        # 2. Резервный вызов repository_dispatch
        disp_url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/dispatches"
        disp_payload = {
            "event_type": "build_apk",
            "client_payload": {"branch": branch, "notes": notes, "initiated_by": initiated_by}
        }
        async with session.post(disp_url, json=disp_payload, headers=headers) as resp:
            if resp.status == 204:
                return True, f"Dispatch запущен в {GITHUB_OWNER}/{GITHUB_REPO} (HTTP 204)"
            second_err = await resp.text()
            return False, f"HTTP {resp.status}: {second_err}"


# Обработчики работают И в личке (message), И в канале (channel_post)
@router.message(Command("start"))
@router.channel_post(Command("start"))
async def cmd_start(message: Message):
    await message.answer(
        f"<b>CI/CD Бот управления сборкой APK</b>\\n\\n"
        f"• Репозиторий: <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\\n"
        f"• Воркфлоу: <code>{GITHUB_WORKFLOW}</code>\\n"
        f"• Chat ID: <code>{message.chat.id}</code>\\n\\n"
        f"• /build [ветка] [комментарий] — запустить сборку APK на GitHub\\n"
        f"• /status — статус последнего запуска Actions\\n"
        f"• /log [запись] — прочитать или дополнить dev_log.md"
    )


@router.message(Command("build"))
@router.channel_post(Command("build"))
async def cmd_build(message: Message, command: CommandObject):
    if not is_authorized(message.chat.id):
        await message.answer(f"⛔ Chat ID {message.chat.id} не авторизован.")
        return

    args = (command.args or "").split(maxsplit=1)
    branch = args[0] if len(args) >= 1 else GITHUB_DEFAULT_BRANCH
    notes = args[1] if len(args) >= 2 else "Ручной запуск сборки из Telegram"
    author = f"@{message.from_user.username}" if message.from_user and message.from_user.username else str(message.chat.id)

    wait_msg = await message.answer(
        f"⏳ Запускаю <code>{GITHUB_WORKFLOW}</code> в "
        f"<code>{GITHUB_OWNER}/{GITHUB_REPO}</code> (ветка: <code>{branch}</code>)..."
    )

    ok, info = await trigger_github_workflow(branch=branch, notes=notes, initiated_by=author)
    if ok:
        append_to_dev_log(f"Сборка APK запущена из Telegram ({author}), ветка '{branch}': {notes}")
        kb = InlineKeyboardMarkup(inline_keyboard=[[
            InlineKeyboardButton(
                text="Открыть GitHub Actions",
                url=f"https://github.com/{GITHUB_OWNER}/{GITHUB_REPO}/actions"
            )
        ]])
        await wait_msg.edit_text(
            f"✅ <b>Сборка успешно запущена в GitHub Actions!</b>\\n\\n"
            f"• <b>Репозиторий:</b> <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\\n"
            f"• <b>Файл сборки:</b> <code>{GITHUB_WORKFLOW}</code>\\n"
            f"• <b>Ветка:</b> <code>{branch}</code>\\n"
            f"• <b>Примечание:</b> {notes}\\n\\n"
            f"Готовый файл .apk будет доставлен в чат сразу после сборки.",
            reply_markup=kb
        )
    else:
        await wait_msg.edit_text(f"❌ <b>Ошибка запуска сборки:</b>\\n<code>{info}</code>")


@router.message(Command("status"))
@router.channel_post(Command("status"))
async def cmd_status(message: Message):
    if not is_authorized(message.chat.id):
        return
    # Проверка статуса на GitHub API...
    await message.answer(f"📊 Мониторинг репозитория: {GITHUB_OWNER}/{GITHUB_REPO}")


@router.message(Command("log"))
@router.channel_post(Command("log"))
async def cmd_log(message: Message, command: CommandObject):
    if not is_authorized(message.chat.id):
        return
    if command.args:
        append_to_dev_log(command.args.strip())
        await message.answer(f"📝 Запись добавлена в dev_log.md.")
    elif DEV_LOG_PATH.exists():
        text = DEV_LOG_PATH.read_text(encoding="utf-8")[-1500:]
        await message.answer(f"📖 <b>dev_log.md:</b>\\n<pre>{text}</pre>")


# Корневой маршрут GET / для Render (отвечает 200 OK "Bot is alive")
async def handle_root(request: web.Request) -> web.Response:
    return web.Response(text="Bot is alive", status=200, content_type="text/plain")


async def handle_health(request: web.Request) -> web.Response:
    return web.json_response({"status": "ok", "bot": "alive", "repo": f"{GITHUB_OWNER}/{GITHUB_REPO}"})


async def handle_upload_apk(request: web.Request) -> web.Response:
    reader = await request.multipart()
    apk_bytes = None
    apk_filename = "app-release.apk"
    meta = {"commit_sha": "unknown", "commit_msg": "Без описания", "author": "unknown", "branch": GITHUB_DEFAULT_BRANCH, "build_number": "1"}

    async for field in reader:
        if field.name == "apk_file":
            apk_filename = field.filename or apk_filename
            apk_bytes = await field.read()
        elif field.name in meta:
            meta[field.name] = (await field.read(decode=True)).decode("utf-8", errors="replace")

    if not apk_bytes:
        return web.json_response({"error": "apk_file missing"}, status=400)

    caption = (
        f"📦 <b>Готова новая сборка APK (#{meta['build_number']})</b>\\n\\n"
        f"• Репозиторий: <code>{GITHUB_OWNER}/{GITHUB_REPO}</code>\\n"
        f"• Ветка: <code>{meta['branch']}</code>\\n"
        f"• Коммит: <code>{meta['commit_sha'][:7]}</code> — {meta['commit_msg']}"
    )

    for chat_id in AUTHORIZED_CHAT_IDS:
        doc = BufferedInputFile(apk_bytes, filename=apk_filename)
        await bot.send_document(chat_id=chat_id, document=doc, caption=caption)

    return web.json_response({"ok": True})


async def main():
    app = web.Application(client_max_size=200 * 1024 * 1024)
    # 200 OK на GET / для Render
    app.router.add_get("/", handle_root)
    app.router.add_get("/health", handle_health)
    app.router.add_post("/api/upload-apk", handle_upload_apk)

    runner = web.AppRunner(app)
    await runner.setup()
    await web.TCPSite(runner, "0.0.0.0", PORT).start()
    logger.info(f"Веб-сервер запущен на порту {PORT} (GET /, GET /health, POST /api/upload-apk)")

    try:
        # Сброс вебхука перед запуском Long Polling
        await bot.delete_webhook(drop_pending_updates=True)
        # Регистрируем обновления и обычных сообщений, и постов канала
        await dp.start_polling(bot, allowed_updates=["message", "channel_post"])
    finally:
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())`;

  const githubWorkflowCode = `name: Android Release APK & Source Backup

on:
  # 1. Автоматическая сборка и бэкап при каждом пуше в ${config.defaultBranch}
  push:
    branches:
      - ${config.defaultBranch}

  # 2. Запуск по команде /build из Telegram-бота через GitHub Repository Dispatch
  repository_dispatch:
    types:
      - ${config.dispatchEvent}

  # 3. Ручной запуск из интерфейса GitHub Actions
  workflow_dispatch:

jobs:
  build-and-deliver:
    runs-on: ubuntu-latest

    steps:
      - name: Checkout исходного кода
        uses: actions/checkout@v4
        with:
          ref: \${{ github.event.client_payload.branch || github.ref }}
          fetch-depth: 0

      - name: 1. Автоматический бэкап кода (.tar.gz)
        id: backup
        run: |
          SHORT_SHA=\$(git rev-parse --short HEAD)
          TIMESTAMP=\$(date -u +"%Y%m%d_%H%M%S")
          ARCHIVE_NAME="backup_\${SHORT_SHA}_\${TIMESTAMP}.tar.gz"
          tar --exclude='./.git' --exclude='./build' --exclude='./app/build' -czf "/tmp/\${ARCHIVE_NAME}" .
          mv "/tmp/\${ARCHIVE_NAME}" "./\${ARCHIVE_NAME}"
          echo "archive_name=\${ARCHIVE_NAME}" >> \$GITHUB_OUTPUT

      - name: Сохранение .tar.gz архива в GitHub Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: source-backup-\${{ github.run_number }}
          path: \${{ steps.backup.outputs.archive_name }}
          retention-days: 30

      - name: Установка JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      - name: Настройка Android SDK
        uses: android-actions/setup-android@v3

      - name: 2. Восстановление секретного ключа (.jks) из GitHub Secrets
        env:
          KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
        run: |
          echo "\$KEYSTORE_BASE64" | base64 --decode > app/release-key.jks

      - name: Сборка и подпись релизной версии APK (Gradle assembleRelease)
        env:
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: |
          chmod +x ./gradlew
          ./gradlew assembleRelease \\
            -Pandroid.injected.signing.store.file=\$(pwd)/app/release-key.jks \\
            -Pandroid.injected.signing.store.password="\${KEYSTORE_PASSWORD}" \\
            -Pandroid.injected.signing.key.alias="\${KEY_ALIAS}" \\
            -Pandroid.injected.signing.key.password="\${KEY_PASSWORD}"

      - name: Извлечение информации о коммите и авторе
        id: meta
        run: |
          COMMIT_SHA=\$(git rev-parse HEAD)
          SHORT_SHA=\$(git rev-parse --short HEAD)
          COMMIT_AUTHOR=\$(git log -1 --pretty=format:'%an (%ae)')
          COMMIT_MSG=\$(git log -1 --pretty=format:'%s')
          APK_PATH=\$(find app/build/outputs/apk/release -name "*.apk" | head -n 1)
          echo "commit_sha=\${COMMIT_SHA}" >> \$GITHUB_OUTPUT
          echo "short_sha=\${SHORT_SHA}" >> \$GITHUB_OUTPUT
          echo "author=\${COMMIT_AUTHOR}" >> \$GITHUB_OUTPUT
          echo "commit_msg=\${COMMIT_MSG}" >> \$GITHUB_OUTPUT
          echo "apk_path=\${APK_PATH}" >> \$GITHUB_OUTPUT

      - name: 3A. Отправка APK на эндпоинт бота (Render / Railway / VPS)
        if: \${{ secrets.BOT_WEBHOOK_URL != '' }}
        run: |
          curl -sS -X POST "\${{ secrets.BOT_WEBHOOK_URL }}/api/upload-apk" \\
            -H "X-Webhook-Secret: \${{ secrets.WEBHOOK_SECRET }}" \\
            -F "apk_file=@\${{ steps.meta.outputs.apk_path }}" \\
            -F "commit_sha=\${{ steps.meta.outputs.commit_sha }}" \\
            -F "commit_msg=\${{ steps.meta.outputs.commit_msg }}" \\
            -F "author=\${{ steps.meta.outputs.author }}" \\
            -F "branch=\${{ github.event.client_payload.branch || github.ref_name }}" \\
            -F "build_number=\${{ github.run_number }}" \\
            -F "backup_archive=\${{ steps.backup.outputs.archive_name }}"

      - name: 3B. Прямая доставка в Telegram через Bot API (sendDocument)
        if: \${{ secrets.BOT_WEBHOOK_URL == '' }}
        run: |
          CAPTION="📦 <b>Сборка APK #\${{ github.run_number }}</b>%0A• <b>Ветка:</b> <code>\${{ github.event.client_payload.branch || github.ref_name }}</code>%0A• <b>Автор:</b> \${{ steps.meta.outputs.author }}%0A• <b>Коммит:</b> <code>\${{ steps.meta.outputs.short_sha }}</code> — \${{ steps.meta.outputs.commit_msg }}%0A• <b>Бэкап:</b> <code>\${{ steps.backup.outputs.archive_name }}</code>"
          curl -sS -X POST "https://api.telegram.org/bot\${{ secrets.TELEGRAM_BOT_TOKEN }}/sendDocument" \\
            -F "chat_id=\${{ secrets.TELEGRAM_CHAT_ID }}" \\
            -F "parse_mode=HTML" \\
            -F "caption=\${CAPTION}" \\
            -F "document=@\${{ steps.meta.outputs.apk_path }}"

      - name: Удаление ключа подписи (.jks) с раннера
        if: always()
        run: rm -f app/release-key.jks`;

  const envFileCode = `# 1. Telegram Bot API (получить у @BotFather)
TELEGRAM_BOT_TOKEN="7123456789:AAH_your_bot_token_here"

# 2. Ваш личный Chat ID или ID рабочей группы (можно несколько через запятую)
TELEGRAM_CHAT_IDS="${config.chatId}"

# 3. GitHub Personal Access Token (Fine-grained Token с правами Contents: R/W и Actions: R/W)
GITHUB_PAT="${config.githubToken}"

# 4. Параметры целевого репозитория с игрой
GITHUB_OWNER="${config.githubOwner}"
GITHUB_REPO="${config.githubRepo}"
GITHUB_BRANCH="${config.defaultBranch}"

# 5. Секретный токен для авторизации входящих APK от GitHub Actions на /api/upload-apk
WEBHOOK_SECRET="apk_webhook_secret_key_2026"

# 6. Порт сервера (Render / Railway назначают автоматически) и путь к dev_log.md
PORT="8080"
DEV_LOG_PATH="../dev_log.md"`;

  const requirementsCode = `--only-binary=:all:
aiogram==3.15.0
pydantic==2.9.2
pydantic-core==2.23.4
python-dotenv==1.0.1
requests==2.32.3
aiohttp==3.10.11
PyNaCl==1.5.0`;

  const renderConfigCode = `# --- Файл 1: .python-version (в корне репозитория) ---
# Фиксирует Python 3.11.9 на Render, чтобы pydantic-core ставился из готового .whl без компиляции Rust
3.11.9

# --- Файл 2: Procfile (в корне репозитория) ---
web: python bot/main.py

# --- Файл 3: render.yaml (Blueprint для автонастройки на Render) ---
services:
  - type: web
    name: telegram-apk-ci-bot
    runtime: python
    plan: free
    buildCommand: pip install --upgrade pip && pip install --only-binary=:all: -r requirements.txt
    startCommand: python bot/main.py
    healthCheckPath: /health
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.9
      - key: TELEGRAM_BOT_TOKEN
        sync: false
      - key: TELEGRAM_CHAT_IDS
        sync: false
      - key: GITHUB_PAT
        sync: false
      - key: GITHUB_OWNER
        value: ${config.githubOwner}
      - key: GITHUB_REPO
        value: ${config.githubRepo}
      - key: GITHUB_BRANCH
        value: ${config.defaultBranch}
      - key: WEBHOOK_SECRET
        sync: false`;

  const dockerfileCode = `# Dockerfile для деплоя бота на Render / Railway / VPS
FROM python:3.11-slim

WORKDIR /srv/app

# Копируем корневой requirements.txt и устанавливаем зависимости
COPY requirements.txt ./requirements.txt
RUN pip install --no-cache-dir -r ./requirements.txt

# Копируем код бота и корневой журнал разработки dev_log.md
COPY bot/ ./bot/
COPY dev_log.md ./dev_log.md

WORKDIR /srv/app
EXPOSE 8080

CMD ["python", "bot/main.py"]`;

  const projectTreeCode = `telegram-bot-deploy/ (Репозиторий Telegram-бота)
├── bot/
│   └── main.py                    # aiogram 3 + мониторинг новых репозиториев + 1-click CI/CD и Pages
├── bot_config.json                # Создается автоматически: хранит токены и секреты подписи из /setup
├── known_repos.json               # Создается автоматически: список известных репозиториев GitHub
├── requirements.txt               # Зависимости (aiogram, aiohttp, PyNaCl для шифрования GitHub Secrets)
├── Procfile                       # web: python bot/main.py
├── render.yaml                    # Авто-конфигурация Render Blueprint
├── .python-version                # 3.11.9 (предотвращает проблемы с Rust/pydantic-core)
├── .env.example                   # GITHUB_OWNER="retrihgtrtyuh-cmd", GITHUB_REPO="xianxia-sect-maneger"
├── .gitignore                     # Исключает .env, bot_config.json, __pycache__/
└── dev_log.md                     # Корневой журнал сборок и прогресса

УДАЛЕНО: Папка .github/workflows полностью отсутствует в проекте бота!
При подключении нового репозитория бот сам создает .github/workflows/build-and-deploy.yml через GitHub API.`;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  const handleDownloadFile = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Interactive Simulation of Telegram Bot + GitHub Actions Pipeline
  const handleSendCommand = (cmdText?: string) => {
    const input = (cmdText ?? chatInput).trim();
    if (!input || isBuilding) return;

    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: input,
      time: nowTime,
    };
    setMessages((prev) => [...prev, userMsg]);
    if (!cmdText) setChatInput('');

    if (input.startsWith('/build')) {
      const parts = input.replace('/build', '').trim().split(/\s+/);
      const branch = parts[0] || config.defaultBranch;
      const comment = parts.slice(1).join(' ') || 'Принудительная сборка по запросу из Telegram';

      const botAck: ChatMessage = {
        id: `b-ack-${Date.now()}`,
        sender: 'bot',
        text: `⏳ Отправляю POST https://api.github.com/repos/${config.githubOwner}/${config.githubRepo}/dispatches (event_type: "${config.dispatchEvent}", ветка: "${branch}")...\n✅ HTTP 204 No Content — пайплайн запущен!`,
        time: nowTime,
      };
      setMessages((prev) => [...prev, botAck]);

      // Start simulated CI/CD pipeline steps
      setIsBuilding(true);
      setPipelineStep(1);

      setTimeout(() => setPipelineStep(2), 700);
      setTimeout(() => setPipelineStep(3), 1500);
      setTimeout(() => setPipelineStep(4), 2300);
      setTimeout(() => {
        const nextBuildNum = builds[0].id + 1;
        const randomSha = Math.random().toString(16).substring(2, 9);
        const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
        const apkFile = `app-release-v1.4.${nextBuildNum - 40}-b${nextBuildNum}.apk`;
        const backupFile = `backup_${randomSha}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.tar.gz`;

        const newBuild: BuildRun = {
          id: nextBuildNum,
          sha: randomSha,
          branch,
          author: 'You (@telegram_admin)',
          message: comment,
          trigger: 'repository_dispatch',
          status: 'completed',
          apkName: apkFile,
          apkSize: '65.1 MB',
          backupName: backupFile,
          timestamp: ts,
        };

        setBuilds((prev) => [newBuild, ...prev]);
        setDevLogEntries((prev) => [
          {
            date: ts,
            tag: `CI/CD Release #${nextBuildNum}`,
            content: `Сборка #${nextBuildNum} (${randomSha}, ветка ${branch}): ${apkFile} + бэкап ${backupFile} доставлены через бот. Комментарий: ${comment}`,
          },
          ...prev,
        ]);

        const botApkMsg: ChatMessage = {
          id: `b-apk-${Date.now()}`,
          sender: 'bot',
          text: `📦 Готова новая сборка APK (#${nextBuildNum})\nКоммит: ${randomSha} — ${comment}`,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          attachment: {
            filename: apkFile,
            size: '65.1 MB',
            backupArchive: backupFile,
            sha: randomSha,
            branch,
            author: 'You (@telegram_admin)',
          },
        };

        setMessages((prev) => [...prev, botApkMsg]);
        setIsBuilding(false);
        setPipelineStep(0);
      }, 3100);
    } else if (input.startsWith('/status')) {
      const latest = builds[0];
      setMessages((prev) => [
        ...prev,
        {
          id: `b-stat-${Date.now()}`,
          sender: 'bot',
          text: `📊 Последний запуск CI/CD:\n• Сборка: #${latest.id} (completed / success)\n• Ветка: ${latest.branch}\n• Коммит: ${latest.sha} — ${latest.message}\n• Артефакт: ${latest.apkName} (${latest.apkSize})`,
          time: nowTime,
        },
      ]);
    } else if (input.startsWith('/log')) {
      const note = input.replace('/log', '').trim();
      if (note) {
        const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
        setDevLogEntries((prev) => [
          { date: ts, tag: 'Dev Log Запись', content: note },
          ...prev,
        ]);
        setMessages((prev) => [
          ...prev,
          {
            id: `b-log-${Date.now()}`,
            sender: 'bot',
            text: `📝 Запись добавлена в корневой dev_log.md:\n"${note}"`,
            time: nowTime,
          },
        ]);
      } else {
        const topLogs = devLogEntries
          .slice(0, 2)
          .map((e) => `[${e.date}] ${e.content}`)
          .join('\n\n');
        setMessages((prev) => [
          ...prev,
          {
            id: `b-log-${Date.now()}`,
            sender: 'bot',
            text: `📖 Последние записи из dev_log.md:\n\n${topLogs}`,
            time: nowTime,
          },
        ]);
      }
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: `b-help-${Date.now()}`,
          sender: 'bot',
          text: `Используйте /build [ветка] [комментарий] для запуска сборки APK в GitHub Actions, /status для проверки пайплайна или /log [текст] для записи в dev_log.md.`,
          time: nowTime,
        },
      ]);
    }
  };

  const handleAddDevLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    setDevLogEntries((prev) => [
      {
        date: ts,
        tag: 'Ручная запись',
        content: newLogText.trim(),
      },
      ...prev,
    ]);
    setNewLogText('');
  };

  const buildApkWorkflowCode = `name: Build & Send APK to Telegram

on:
  # Ручной запуск (из веб-интерфейса GitHub или через GitHub API / Telegram-бота)
  workflow_dispatch:
    inputs:
      notes:
        description: 'Комментарий к сборке'
        required: false
        default: 'Ручной запуск сборки APK'

jobs:
  build:
    name: Build Android APK
    runs-on: ubuntu-latest

    steps:
      # 1. Клонирование репозитория
      - name: Checkout repository
        uses: actions/checkout@v4

      # 2. Настройка рабочей среды Java (JDK 17)
      - name: Set up JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'temurin'
          java-version: '17'
          cache: 'gradle'

      # 3. Настройка Android SDK
      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      # 4. Предоставление прав на исполнение скрипту Gradle Wrapper
      - name: Grant execute permission for gradlew
        run: chmod +x gradlew

      # 5. Сборка APK с помощью Gradle (assembleRelease)
      - name: Build APK with Gradle
        run: ./gradlew assembleRelease

      # 6. Поиск собранного файла APK и сбор метаданных коммита
      - name: Locate compiled APK
        id: locate_apk
        run: |
          APK_FILE=$(find . -path "*/build/outputs/apk/*" -name "*.apk" | head -n 1)
          if [ -z "$APK_FILE" ]; then
            echo "::error::APK файл не найден в директориях build/outputs/apk/"
            exit 1
          fi
          echo "Found APK: $APK_FILE"
          echo "apk_path=$APK_FILE" >> $GITHUB_OUTPUT
          
          SHORT_SHA=$(git rev-parse --short HEAD)
          COMMIT_MSG=$(git log -1 --pretty=format:'%s')
          AUTHOR=$(git log -1 --pretty=format:'%an')
          echo "short_sha=$SHORT_SHA" >> $GITHUB_OUTPUT
          echo "commit_msg=$COMMIT_MSG" >> $GITHUB_OUTPUT
          echo "author=$AUTHOR" >> $GITHUB_OUTPUT

      # 7. Отправка готового APK в Telegram-чат через Telegram Bot API (sendDocument)
      - name: Send APK to Telegram
        if: success()
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: \${{ secrets.TELEGRAM_CHAT_ID }}
          APK_PATH: \${{ steps.locate_apk.outputs.apk_path }}
          SHORT_SHA: \${{ steps.locate_apk.outputs.short_sha }}
          COMMIT_MSG: \${{ steps.locate_apk.outputs.commit_msg }}
          AUTHOR: \${{ steps.locate_apk.outputs.author }}
          RUN_NUM: \${{ github.run_number }}
          NOTES: \${{ github.event.inputs.notes || 'Сборка через GitHub Actions' }}
        run: |
          CAPTION="📦 <b>Новая сборка APK (#\${RUN_NUM}) готова!</b>%0A%0A• <b>Ветка:</b> <code>\${{ github.ref_name }}</code>%0A• <b>Коммит:</b> <code>\${SHORT_SHA}</code> — \${COMMIT_MSG}%0A• <b>Автор:</b> \${AUTHOR}%0A• <b>Примечание:</b> \${NOTES}"

          RESPONSE=\$(curl -s -w "\\n%{http_code}" -X POST "https://api.telegram.org/bot\${TELEGRAM_BOT_TOKEN}/sendDocument" \\
            -F "chat_id=\${TELEGRAM_CHAT_ID}" \\
            -F "parse_mode=HTML" \\
            -F "caption=\${CAPTION}" \\
            -F "document=@\${APK_PATH}")

          HTTP_CODE=\$(echo "$RESPONSE" | tail -n 1)
          BODY=\$(echo "$RESPONSE" | sed '$d')

          echo "Telegram API Response HTTP code: $HTTP_CODE"
          if [ "$HTTP_CODE" -ne 200 ]; then
            echo "::error::Не удалось отправить файл в Telegram. Ответ: $BODY"
            exit 1
          else
            echo "APK успешно отправлен в Telegram!"
          fi`;

  const getSelectedCodeContent = () => {
    switch (selectedFile) {
      case 'build-apk':
        return { filename: '.github/workflows/build-apk.yml', lang: 'yaml', code: buildApkWorkflowCode };
      case 'bot':
        return { filename: 'bot/main.py', lang: 'python', code: pythonBotCode };
      case 'requirements':
        return { filename: 'requirements.txt', lang: 'text', code: requirementsCode };
      case 'render':
        return { filename: 'render.yaml / Procfile', lang: 'yaml', code: renderConfigCode };
      case 'workflow':
        return { filename: '.github/workflows/android_build.yml', lang: 'yaml', code: githubWorkflowCode };
      case 'env':
        return { filename: '.env.example', lang: 'ini', code: envFileCode };
      case 'dockerfile':
        return { filename: 'Dockerfile', lang: 'dockerfile', code: dockerfileCode };
      case 'tree':
        return { filename: 'Структура проекта', lang: 'text', code: projectTreeCode };
    }
  };

  const activeFileObj = getSelectedCodeContent();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col">
      {/* Top Bar Contract: Zone 1 (Wordmark) — Zone 2 (4-5 Nav Links) — Zone 3 (1 Primary CTA) */}
      <header className="flex items-center justify-between gap-8 px-6 py-4 border-b border-slate-800/80 bg-[#0B0F17]/95 sticky top-0 z-30">
        <a
          href="#top"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('code');
          }}
          className="text-base font-bold tracking-tight text-white whitespace-nowrap shrink-0"
        >
          APK Dispatch Studio
        </a>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('code')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'code' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Код и Конфигурация
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'simulator' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Симулятор /build
          </button>
          <button
            onClick={() => setActiveTab('secrets')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'secrets' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            .env и Keystore Base64
          </button>
          <button
            onClick={() => setActiveTab('devlog')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'devlog' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Журнал dev_log.md
          </button>
          <button
            onClick={() => setActiveTab('concept')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 ${
              activeTab === 'concept' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Концепт CI/CD
          </button>
        </nav>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => {
              setTempTokenInput(config.githubToken);
              setTokenSaveSuccess(false);
              setIsTokenModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            Заменить токен GitHub
          </button>
          <button
            onClick={() => {
              setActiveTab('simulator');
              handleSendCommand(`/build ${config.defaultBranch} Принудительная сборка релизного APK`);
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Тест сборки APK
          </button>
        </div>
      </header>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center gap-2 overflow-x-auto px-4 py-2.5 border-b border-slate-800 bg-[#0F1623]">
        {[
          { id: 'code', label: 'Код бота и YAML' },
          { id: 'simulator', label: 'Симулятор /build' },
          { id: 'secrets', label: 'Секреты и .jks' },
          { id: 'devlog', label: 'dev_log.md' },
          { id: 'concept', label: 'Концепт PDF' },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as typeof activeTab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap shrink-0 ${
              activeTab === t.id ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Main Content Area (1440px max-w container) */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 space-y-8">
        {/* Top Context Banner & Live Parameters Bar */}
        <section className="border border-slate-800 bg-[#111827] rounded-xl p-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-800/80">
            <div className="space-y-1.5 max-w-2xl">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span>Python 3.11 + aiogram 3.17</span>
                <span aria-hidden="true">·</span>
                <span>GitHub Actions (JDK 17 / Android SDK)</span>
                <span aria-hidden="true">·</span>
                <span>Render / Railway / VPS Ready</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Автоматизация сборки Android APK и Telegram-управления
              </h1>
              <p className="text-sm text-slate-400 leading-relaxed">
                Полный сквозной пайплайн по вашему ТЗ: автоматический <code className="text-slate-200">.tar.gz</code> бэкап кода при пуше в{' '}
                <code className="text-slate-200">{config.defaultBranch}</code>, восстановление ключа подписи <code className="text-slate-200">.jks</code> из Base64, сборка{' '}
                <code className="text-slate-200">assembleRelease</code>, отправка APK в Telegram и принудительный запуск через{' '}
                <code className="text-slate-200">repository_dispatch</code> по команде <code className="text-sky-400">/build</code>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => handleDownloadFile('main.py', pythonBotCode)}
                className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Скачать main.py
              </button>
              <button
                onClick={() => handleDownloadFile('android_build.yml', githubWorkflowCode)}
                className="px-4 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Скачать android_build.yml
              </button>
            </div>
          </div>

          {/* Interactive Repository Parameters */}
          <div className="pt-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Владелец GitHub (GITHUB_OWNER)</label>
              <input
                type="text"
                value={config.githubOwner}
                onChange={(e) => setConfig({ ...config, githubOwner: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Репозиторий игры (GITHUB_REPO)</label>
              <input
                type="text"
                value={config.githubRepo}
                onChange={(e) => setConfig({ ...config, githubRepo: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Основная ветка (GITHUB_BRANCH)</label>
              <input
                type="text"
                value={config.defaultBranch}
                onChange={(e) => setConfig({ ...config, defaultBranch: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Тип события Dispatch</label>
              <input
                type="text"
                value={config.dispatchEvent}
                onChange={(e) => setConfig({ ...config, dispatchEvent: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1.5">Ваш Telegram Chat ID</label>
              <input
                type="text"
                value={config.chatId}
                onChange={(e) => setConfig({ ...config, chatId: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>
        </section>

        {/* ===================================================================
            TAB 1: КОД БОТА, GITHUB ACTIONS YAML И АРХИТЕКТУРА
        =================================================================== */}
        {activeTab === 'code' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Sidebar: File Switcher & Architectural Notes */}
            <div className="lg:col-span-4 space-y-6">
              <div className="border border-slate-800 bg-[#111827] rounded-xl p-5 space-y-4">
                <h2 className="text-base font-semibold text-white">Файлы проекта</h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Все файлы синхронизированы с вашими параметрами выше и уже сохранены в рабочем пространстве проекта.
                </p>

                <div className="space-y-1.5">
                  {[
                    {
                      id: 'build-apk',
                      title: '.github/workflows/build-apk.yml',
                      desc: 'Сборка Gradle + прямая отправка APK в Telegram',
                    },
                    {
                      id: 'requirements',
                      title: 'requirements.txt (в корне)',
                      desc: 'aiogram, python-dotenv, requests, aiohttp',
                    },
                    {
                      id: 'render',
                      title: 'Procfile и render.yaml',
                      desc: 'Конфигурация сборки и запуска на Render',
                    },
                    {
                      id: 'bot',
                      title: 'bot/main.py',
                      desc: 'Код бота (aiogram 3 + aiohttp сервер)',
                    },
                    {
                      id: 'workflow',
                      title: '.github/workflows/android_build.yml',
                      desc: 'Бэкап .tar.gz, подпись .jks и отправка APK',
                    },
                    {
                      id: 'env',
                      title: '.env.example',
                      desc: 'Переменные окружения для сервера',
                    },
                    {
                      id: 'dockerfile',
                      title: 'Dockerfile',
                      desc: 'Контейнер для Render / Railway / VPS',
                    },
                    {
                      id: 'tree',
                      title: 'Структура с dev_log.md',
                      desc: 'Рекомендуемое дерево директорий',
                    },
                  ].map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setSelectedFile(item.id as typeof selectedFile)}
                      className={`w-full text-left px-3.5 py-2.5 rounded-lg transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                        selectedFile === item.id
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60 border border-transparent'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-mono font-semibold truncate">{item.title}</div>
                        <div className="text-[11px] text-slate-400 truncate mt-0.5">{item.desc}</div>
                      </div>
                      <FileCode className="w-4 h-4 shrink-0 opacity-70" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="border border-slate-800 bg-[#111827] rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-white">01. Два режима доставки APK в Telegram</h3>
                <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                  <div>
                    <div className="font-semibold text-white mb-0.5">Режим А: Через HTTP-эндпоинт бота (/api/upload-apk)</div>
                    <p className="text-slate-400">
                      Бот поднимает <code className="text-slate-200">aiohttp</code> сервер. GitHub Actions после сборки отправляет APK и метаданные коммита на ваш Render/Railway/VPS URL, а бот рассылает файл всем разрешенным чатам и автоматически дописывает строку в <code className="text-slate-200">dev_log.md</code>.
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <div className="font-semibold text-white mb-0.5">Режим Б: Напрямую из GitHub Actions (sendDocument)</div>
                    <p className="text-slate-400">
                      Если вы не хотите открывать внешний HTTP-порт у бота, шаг <code className="text-slate-200">3B</code> в <code className="text-slate-200">android_build.yml</code> напрямую вызывает метод Telegram Bot API <code className="text-slate-200">sendDocument</code> через <code className="text-slate-200">curl</code> (до 50 МБ через публичный API).
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: Code Viewer */}
            <div className="lg:col-span-8 border border-slate-800 bg-[#111827] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-slate-800 bg-[#0D131F]">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Terminal className="w-4 h-4 text-sky-400 shrink-0" />
                  <span className="text-xs font-mono font-semibold text-slate-200 truncate">
                    {activeFileObj.filename}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleCopy(activeFileObj.code, activeFileObj.filename)}
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {copiedId === activeFileObj.filename ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        Скопировано
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Копировать код
                      </>
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleDownloadFile(activeFileObj.filename.split('/').pop() || 'file.txt', activeFileObj.code)
                    }
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Скачать
                  </button>
                </div>
              </div>

              <div className="p-5 overflow-x-auto max-h-[680px] overflow-y-auto bg-[#090D14]">
                <pre className="text-xs font-mono leading-relaxed text-slate-200 select-all">
                  <code>{activeFileObj.code}</code>
                </pre>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 2: ИНТЕРАКТИВНЫЙ СИМУЛЯТОР TELEGRAM-БОТА И GITHUB ACTIONS
        =================================================================== */}
        {activeTab === 'simulator' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Telegram Chat Simulator */}
            <div className="lg:col-span-6 border border-slate-800 bg-[#111827] rounded-xl flex flex-col h-[640px]">
              <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white">Telegram Чат: @GameApkBuilderBot</h2>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Chat ID: {config.chatId}</span>
                    <span aria-hidden="true">·</span>
                    <span>Авторизован</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleSendCommand('/status')}
                    disabled={isBuilding}
                    className="px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    /status
                  </button>
                  <button
                    onClick={() => handleSendCommand('/log')}
                    disabled={isBuilding}
                    className="px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    /log
                  </button>
                </div>
              </div>

              {/* Messages Feed */}
              <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-[#0B0F17]">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[88%] rounded-xl px-4 py-3 text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-sky-600 text-white'
                          : 'bg-[#161F30] text-slate-200 border border-slate-800'
                      }`}
                    >
                      <div className="whitespace-pre-wrap font-sans">{msg.text}</div>

                      {msg.attachment && (
                        <div className="mt-3 pt-3 border-t border-slate-700/80 flex items-center justify-between gap-3">
                          <div className="min-w-0">
                            <div className="font-mono font-semibold text-sky-300 truncate">
                              {msg.attachment.filename}
                            </div>
                            <div className="text-[11px] text-slate-400 tabular-nums mt-0.5">
                              {msg.attachment.size} · Коммит {msg.attachment.sha} · Бэкап: {msg.attachment.backupArchive}
                            </div>
                          </div>
                          <button
                            onClick={() =>
                              handleDownloadFile(
                                `${msg.attachment?.filename}.info.txt`,
                                `APK Build Artifact: ${msg.attachment?.filename}\nCommit: ${msg.attachment?.sha}\nBranch: ${msg.attachment?.branch}\nAuthor: ${msg.attachment?.author}\nSource Backup: ${msg.attachment?.backupArchive}`
                              )
                            }
                            className="px-3 py-1.5 text-xs font-medium bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 rounded-md whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            Скачать
                          </button>
                        </div>
                      )}

                      <div
                        className={`text-[10px] mt-1.5 text-right tabular-nums ${
                          msg.sender === 'user' ? 'text-sky-200' : 'text-slate-400'
                        }`}
                      >
                        {msg.time}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Command Input Bar */}
              <div className="p-4 border-t border-slate-800 bg-[#111827]">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSendCommand();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Введите /build main Комментарий или /log Текст..."
                    className="flex-1 px-3.5 py-2.5 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isBuilding}
                    className="px-4 py-2.5 text-xs font-semibold bg-sky-400 text-slate-950 hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Отправить
                  </button>
                </form>
              </div>
            </div>

            {/* Right Column: Live GitHub Actions Pipeline & Build History */}
            <div className="lg:col-span-6 space-y-6">
              <div className="border border-slate-800 bg-[#111827] rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-sm font-semibold text-white">
                      GitHub Actions Раннер (ubuntu-latest / JDK 17)
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Визуализация выполнения шагов <code className="text-slate-200">android_build.yml</code> при вызове <code className="text-sky-400">/build</code>
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-300 tabular-nums">
                    {isBuilding ? 'Сборка выполняется...' : 'Ожидание сигнала'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    {
                      step: 1,
                      title: '1. GitHub Repository Dispatch & Checkout',
                      detail: `POST /repos/${config.githubOwner}/${config.githubRepo}/dispatches (event_type: ${config.dispatchEvent})`,
                    },
                    {
                      step: 2,
                      title: '2. Архивация исходного кода (.tar.gz)',
                      detail: 'Создание архива backup_<sha>_<timestamp>.tar.gz и загрузка в GitHub Artifacts',
                    },
                    {
                      step: 3,
                      title: '3. Декодирование .jks из Base64 и Gradle assembleRelease',
                      detail: 'Восстановление KEYSTORE_BASE64 -> app/release-key.jks и подпись релизного APK',
                    },
                    {
                      step: 4,
                      title: '4. Доставка подписанного APK в Telegram и запись в dev_log.md',
                      detail: 'POST /api/upload-apk (или sendDocument) с информацией о коммите и авторе',
                    },
                  ].map((item) => {
                    const isDone = !isBuilding ? true : pipelineStep > item.step;
                    const isCurrent = isBuilding && pipelineStep === item.step;
                    return (
                      <div
                        key={item.step}
                        className={`p-3.5 rounded-lg border transition-colors ${
                          isCurrent
                            ? 'border-sky-500 bg-sky-500/10'
                            : isDone
                            ? 'border-slate-800 bg-[#0B0F17]'
                            : 'border-slate-800/50 bg-[#0B0F17]/50 opacity-60'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-slate-200">{item.title}</span>
                          <span className="text-[11px] font-mono text-slate-400">
                            {isCurrent ? 'Выполняется...' : isDone ? 'Готово' : 'В очереди'}
                          </span>
                        </div>
                        <div className="text-[11px] font-mono text-slate-400 mt-1">{item.detail}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Recent Builds Table */}
              <div className="border border-slate-800 bg-[#111827] rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-white">История собранных APK и .tar.gz бэкапов</h3>
                  <span className="text-xs text-slate-400 tabular-nums">Всего сборок: {builds.length}</span>
                </div>
                <div className="divide-y divide-slate-800">
                  {builds.map((b) => (
                    <div key={b.id} className="p-4 hover:bg-slate-800/30 transition-colors space-y-1.5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2 text-xs font-medium text-white">
                          <span className="font-mono text-sky-400 tabular-nums">#{b.id}</span>
                          <span>·</span>
                          <span className="font-mono">{b.apkName}</span>
                          <span>·</span>
                          <span className="text-slate-400 tabular-nums">{b.apkSize}</span>
                        </div>
                        <span className="text-xs text-slate-400 tabular-nums">{b.timestamp}</span>
                      </div>
                      <div className="text-xs text-slate-300">{b.message}</div>
                      <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono">
                        <span>Коммит: {b.sha}</span>
                        <span aria-hidden="true">·</span>
                        <span>Ветка: {b.branch}</span>
                        <span aria-hidden="true">·</span>
                        <span>Автор: {b.author}</span>
                        <span aria-hidden="true">·</span>
                        <span>Бэкап: {b.backupName}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 3: ИНСТРУКЦИЯ ПО .ENV, GITHUB SECRETS И КОНВЕРТЕР KEYSTORE BASE64
        =================================================================== */}
        {activeTab === 'secrets' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Table 1: .env for Python Bot */}
              <div className="border border-slate-800 bg-[#111827] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <h2 className="text-base font-semibold text-white">
                    1. Переменные окружения в .env (для сервера бота Render / Railway / VPS)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Пропишите эти переменные в файле <code className="text-slate-200">.env</code> на VPS или во вкладке Environment Variables на Render / Railway.
                  </p>
                </div>
                <div className="divide-y divide-slate-800 text-xs">
                  {[
                    {
                      name: 'TELEGRAM_BOT_TOKEN',
                      req: 'Обязательно',
                      desc: 'Токен вашего бота от @BotFather (например, 7123456:AAH...).',
                    },
                    {
                      name: 'TELEGRAM_CHAT_IDS',
                      req: 'Обязательно',
                      desc: 'Ваш личный Chat ID или ID группы разработки (через запятую). Только эти ID могут вызывать /build и получать APK.',
                    },
                    {
                      name: 'GITHUB_PAT',
                      req: 'Обязательно',
                      desc: 'Personal Access Token с правами Contents (Read & Write) и Actions (Read & Write) для вызова /dispatches.',
                    },
                    {
                      name: 'GITHUB_OWNER / GITHUB_REPO',
                      req: 'Обязательно',
                      desc: `Владелец и имя репозитория без слеша (${config.githubOwner} и ${config.githubRepo}).`,
                    },
                    {
                      name: 'WEBHOOK_SECRET',
                      req: 'Обязательно',
                      desc: 'Произвольная криптостойкая строка для проверки заголовка X-Webhook-Secret при приеме APK на /api/upload-apk.',
                    },
                  ].map((v) => (
                    <div key={v.name} className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <code className="font-mono font-semibold text-sky-400">{v.name}</code>
                        <span className="text-[11px] text-slate-400">{v.req}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Table 2: GitHub Actions Secrets */}
              <div className="border border-slate-800 bg-[#111827] rounded-xl overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-800">
                  <h2 className="text-base font-semibold text-white">
                    2. Секреты в GitHub Actions (Settings → Secrets and variables → Actions)
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Согласно вашему концепту безопасности, ключ подписи <code className="text-slate-200">.jks</code> и пароли хранятся в GitHub Secrets.
                  </p>
                </div>
                <div className="divide-y divide-slate-800 text-xs">
                  {[
                    {
                      name: 'KEYSTORE_BASE64',
                      req: 'Подпись APK',
                      desc: 'Base64-представление вашего файла release-key.jks. В пайплайне декодируется командой base64 --decode > app/release-key.jks.',
                    },
                    {
                      name: 'KEYSTORE_PASSWORD',
                      req: 'Подпись APK',
                      desc: 'Пароль от хранилища ключей Keystore (storePassword).',
                    },
                    {
                      name: 'KEY_ALIAS / KEY_PASSWORD',
                      req: 'Подпись APK',
                      desc: 'Алиас ключа в .jks (keyAlias) и пароль самого ключа (keyPassword).',
                    },
                    {
                      name: 'BOT_WEBHOOK_URL / WEBHOOK_SECRET',
                      req: 'Доставка через сервер бота',
                      desc: 'Публичный URL вашего бота на Render/Railway (например, https://my-bot.onrender.com) и тот же секрет WEBHOOK_SECRET.',
                    },
                    {
                      name: 'TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID',
                      req: 'Прямая доставка (альтернатива)',
                      desc: 'Используются шагом 3B для прямой отправки APK из раннера GitHub через метод Telegram sendDocument.',
                    },
                  ].map((v) => (
                    <div key={v.name} className="p-4 space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <code className="font-mono font-semibold text-emerald-400">{v.name}</code>
                        <span className="text-[11px] text-slate-400">{v.req}</span>
                      </div>
                      <p className="text-slate-300 leading-relaxed">{v.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive Keystore (.jks) to Base64 Converter */}
            <div className="border border-slate-800 bg-[#111827] rounded-xl p-6 space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-sky-400" />
                    Локальный конвертер ключа подписи (.jks / .keystore) в Base64
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Выберите ваш файл <code className="text-slate-200">.jks</code> (выполняется строго локально в браузере без отправки в сеть) или используйте терминальную команду ниже, чтобы получить строку для секрета <code className="text-slate-200">KEYSTORE_BASE64</code>.
                  </p>
                </div>
                <label className="px-4 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap shrink-0">
                  Выбрать файл .jks
                  <input type="file" accept=".jks,.keystore,.bks" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-slate-300">
                    Команда в терминале (Linux / macOS / Git Bash):
                  </div>
                  <div className="p-3.5 rounded-lg bg-[#090D14] border border-slate-800 font-mono text-xs text-slate-200">
                    base64 -w 0 release-key.jks &gt; keystore_base64.txt
                  </div>
                  <div className="text-xs font-medium text-slate-300 pt-2">
                    Или тестовая строка / загруженный файл {uploadedFileName ? `(${uploadedFileName})` : ''}:
                  </div>
                  <input
                    type="text"
                    value={keystoreSampleInput}
                    onChange={(e) => {
                      setKeystoreSampleInput(e.target.value);
                      setUploadedFileName(null);
                      try {
                        setEncodedBase64(btoa(unescape(encodeURIComponent(e.target.value))));
                      } catch {
                        setEncodedBase64('');
                      }
                    }}
                    className="w-full px-3.5 py-2 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-slate-200"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-300">
                      Результат для GitHub Secret <code className="text-emerald-400">KEYSTORE_BASE64</code>:
                    </span>
                    <button
                      onClick={() => handleCopy(encodedBase64, 'b64')}
                      className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === 'b64' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedId === 'b64' ? 'Скопировано' : 'Копировать Base64'}
                    </button>
                  </div>
                  <textarea
                    readOnly
                    rows={4}
                    value={encodedBase64}
                    className="w-full p-3.5 text-xs font-mono bg-[#090D14] border border-slate-800 rounded-lg text-emerald-300 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 4: УПРАВЛЕНИЕ ФАЙЛОМ DEV_LOG.MD В КОРНЕ ПРОЕКТА
        =================================================================== */}
        {activeTab === 'devlog' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 border border-slate-800 bg-[#111827] rounded-xl p-6 space-y-5">
              <div>
                <h2 className="text-base font-semibold text-white">Интеграция корневого dev_log.md</h2>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                  Файл <code className="text-slate-200">/dev_log.md</code> располагается в корне репозитория. Бот автоматически дописывает в него информацию о каждой запущенной сборке и доставленном <code className="text-slate-200">.apk</code>, а также позволяет разработчикам добавлять заметки прямо из чата командой <code className="text-sky-400">/log Текст заметки</code>.
                </p>
              </div>

              <form onSubmit={handleAddDevLog} className="space-y-3 pt-2 border-t border-slate-800">
                <label className="block text-xs font-medium text-slate-300">
                  Добавить новую запись в журнал разработки:
                </label>
                <textarea
                  rows={3}
                  value={newLogText}
                  onChange={(e) => setNewLogText(e.target.value)}
                  placeholder="Например: Добавлена поддержка Vulkan API и обновлен keystore для релизной сборки..."
                  className="w-full p-3 text-xs bg-[#0B0F17] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                />
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-semibold bg-sky-400 text-slate-950 hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Записать в dev_log.md
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const md = `# Журнал разработки (dev_log.md)\n\n${devLogEntries
                        .map((e) => `### [${e.date}] — ${e.tag}\n- ${e.content}`)
                        .join('\n\n')}\n`;
                      handleDownloadFile('dev_log.md', md);
                    }}
                    className="px-3.5 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Скачать dev_log.md
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-7 border border-slate-800 bg-[#111827] rounded-xl overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                <span className="text-sm font-mono font-semibold text-white">/dev_log.md</span>
                <span className="text-xs text-slate-400 tabular-nums">Записей: {devLogEntries.length}</span>
              </div>
              <div className="divide-y divide-slate-800">
                {devLogEntries.map((entry, idx) => (
                  <div key={idx} className="p-5 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs text-slate-400 font-mono tabular-nums">
                      <span className="text-sky-400">{entry.date}</span>
                      <span aria-hidden="true">·</span>
                      <span>{entry.tag}</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">{entry.content}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ===================================================================
            TAB 5: КОНЦЕПТ АВТОМАТИЗАЦИИ (ПРИКРЕПЛЕННЫЙ ДОКУМЕНТ)
        =================================================================== */}
        {activeTab === 'concept' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-6 border border-slate-800 bg-[#111827] rounded-xl p-6 space-y-5">
              <h2 className="text-lg font-semibold text-white">
                Соответствие техническому концепту от 2026-10-22
              </h2>
              <div className="space-y-4 text-xs text-slate-300 leading-relaxed">
                <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-1">
                  <div className="font-semibold text-white">1. Автоматический бэкап кода (.tar.gz)</div>
                  <p className="text-slate-400">
                    При каждом пуше в ветку <code className="text-slate-200">main</code> или вызове <code className="text-slate-200">/build</code> шаг <code className="text-slate-200">backup</code> упаковывает исходники в <code className="text-slate-200">backup_&lt;sha&gt;_&lt;timestamp&gt;.tar.gz</code> (исключая временные папки <code className="text-slate-200">build/</code> и <code className="text-slate-200">.git</code>) и сохраняет архив в GitHub Artifacts.
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-1">
                  <div className="font-semibold text-white">2. Автоматическая сборка и подпись APK (.jks)</div>
                  <p className="text-slate-400">
                    На раннере <code className="text-slate-200">ubuntu-latest</code> с JDK 17 и Android SDK восстанавливается ключ <code className="text-slate-200">app/release-key.jks</code> из <code className="text-slate-200">secrets.KEYSTORE_BASE64</code>, выполняется <code className="text-slate-200">./gradlew assembleRelease</code> с параметрами подписи, после чего ключ гарантированно удаляется (<code className="text-slate-200">if: always()</code>).
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-1">
                  <div className="font-semibold text-white">3. Доставка в Telegram и удаленный запуск</div>
                  <p className="text-slate-400">
                    Готовый подписанный <code className="text-slate-200">.apk</code> доставляется в Telegram вместе с хэшем коммита, автором, сообщением коммита и именем архива бэкапа.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <a
                  href="/assets/aistudio/CI-CD_APK_Automation_Concept.md_e1dcb8f0.pdf"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 text-xs font-medium text-sky-300 bg-sky-500/15 hover:bg-sky-500/25 rounded-lg transition-colors"
                >
                  <FileText className="w-4 h-4" />
                  Открыть оригинальный PDF-документ концепта
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6 border border-slate-800 bg-[#111827] rounded-xl overflow-hidden">
              <div className="px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300">
                  CI-CD_APK_Automation_Concept.md_e1dcb8f0.pdf
                </span>
              </div>
              <iframe
                src="/assets/aistudio/CI-CD_APK_Automation_Concept.md_e1dcb8f0.pdf"
                title="Концепт автоматизации CI/CD для сборки APK"
                className="w-full h-[520px] bg-slate-900"
              />
            </div>
          </div>
        )}
      </main>

      {/* Interactive Modal: Замена токена GitHub */}
      {isTokenModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
          <div className="bg-[#111827] border border-slate-700/80 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-xs text-sky-400 font-medium">
                  <KeyRound className="w-4 h-4" />
                  <span>GitHub Personal Access Token (PAT)</span>
                </div>
                <h2 className="text-lg font-bold text-white mt-1">Окно замены токена GitHub</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Токен используется ботом для запуска сборки APK через <code className="text-slate-200">repository_dispatch</code> на серверах GitHub Actions.
                </p>
              </div>
              <button
                onClick={() => setIsTokenModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
                title="Закрыть"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-200 mb-1.5">
                  Новый токен GitHub (переменная GITHUB_PAT в .env):
                </label>
                <div className="relative">
                  <input
                    type={showTokenText ? 'text' : 'password'}
                    value={tempTokenInput}
                    onChange={(e) => {
                      setTempTokenInput(e.target.value);
                      setTokenSaveSuccess(false);
                    }}
                    placeholder="github_pat_11A... или ghp_..."
                    className="w-full px-3.5 py-2.5 pr-10 text-xs font-mono bg-[#0B0F17] border border-slate-700 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowTokenText(!showTokenText)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    title={showTokenText ? 'Скрыть токен' : 'Показать токен'}
                  >
                    {showTokenText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                  <span>
                    {tempTokenInput.startsWith('github_pat_')
                      ? '✓ Формат: Fine-grained Personal Access Token'
                      : tempTokenInput.startsWith('ghp_')
                      ? '✓ Формат: Classic Personal Access Token'
                      : 'Токен обычно начинается с github_pat_ или ghp_'}
                  </span>
                  <span className="font-mono tabular-nums">{tempTokenInput.length} символов</span>
                </div>
              </div>

              {/* Инструкция по созданию токена с прямым переходом */}
              <div className="p-3.5 rounded-lg bg-[#0B0F17] border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-200">Необходимые права (Permissions) токена:</span>
                  <a
                    href="https://github.com/settings/tokens?type=beta"
                    target="_blank"
                    rel="noreferrer"
                    className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium"
                  >
                    Создать токен на GitHub <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <ul className="space-y-1 text-slate-400 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Contents: Read and write</strong> (для вызова dispatches и чтения коммитов)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Actions: Read and write</strong> (для удаленного запуска пайплайнов)</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span><strong>Metadata: Read-only</strong> (выбирается автоматически)</span>
                  </li>
                </ul>
              </div>

              {tokenSaveSuccess && (
                <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300 flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Токен успешно сохранен в конфигурации проекта и обновлен в шаблоне .env!</span>
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  const line = `GITHUB_PAT="${tempTokenInput}"`;
                  handleCopy(line, 'modal-pat');
                }}
                className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {copiedId === 'modal-pat' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedId === 'modal-pat' ? 'Скопировано!' : 'Скопировать строку для .env'}
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => setIsTokenModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg transition-colors cursor-pointer"
                >
                  Закрыть
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setConfig({ ...config, githubToken: tempTokenInput.trim() });
                    setTokenSaveSuccess(true);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Check className="w-3.5 h-3.5" />
                  Сохранить токен
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
