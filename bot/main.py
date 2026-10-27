import os
import sys
import json
import hmac
import base64
import asyncio
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

try:
    from nacl import encoding, public
    HAS_NACL = True
except ImportError:
    HAS_NACL = False

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

# Пути к локальным JSON-хранилищам и логам
CONFIG_JSON_PATH = ROOT_DIR / "bot_config.json"
KNOWN_REPOS_PATH = ROOT_DIR / "known_repos.json"
DEV_LOG_PATH = Path(os.getenv("DEV_LOG_PATH", str(ROOT_DIR / "dev_log.md")))

# =====================================================================
# 1. ЕДИНОЕ ХРАНИЛИЩЕ КОНФИГУРАЦИИ И СЕКРЕТОВ (ИЗ КОДА/.ENV + BOT_CONFIG.JSON)
# =====================================================================

TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN")
PORT = int(os.getenv("PORT", "8080"))

# Разрешенные ID чатов и приватного канала (-1003962969725)
raw_chat_ids = os.getenv("TELEGRAM_CHAT_IDS", "-1003962969725")
AUTHORIZED_CHAT_IDS = {
    int(x.strip()) for x in raw_chat_ids.split(",")
    if x.strip().lstrip("-").isdigit()
}
AUTHORIZED_CHAT_IDS.add(-1003962969725)


def load_bot_config() -> dict:
    """
    Собирает все существующие токены, Chat ID, GitHub логин и данные подписи APK
    из переменных окружения и дополняет их сохраненными данными из bot_config.json.
    """
    default_chat_id = os.getenv("TELEGRAM_CHAT_ID", "-1003962969725")
    base_cfg = {
        "github_pat": os.getenv("GITHUB_PAT", ""),
        "github_owner": os.getenv("GITHUB_OWNER", "retrihgtrtyuh-cmd"),
        "github_repo": os.getenv("GITHUB_REPO", "xianxia-sect-maneger"),
        "github_workflow": os.getenv("GITHUB_WORKFLOW", "build-apk.yml"),
        "github_branch": os.getenv("GITHUB_BRANCH", "main"),
        "telegram_chat_id": default_chat_id,
        "webhook_secret": os.getenv("WEBHOOK_SECRET", ""),
        "keystore_base64": os.getenv("KEYSTORE_BASE64", ""),
        "keystore_password": os.getenv("KEYSTORE_PASSWORD", ""),
        "key_alias": os.getenv("KEY_ALIAS", ""),
        "key_password": os.getenv("KEY_PASSWORD", ""),
    }
    if CONFIG_JSON_PATH.exists():
        try:
            saved = json.loads(CONFIG_JSON_PATH.read_text(encoding="utf-8"))
            for k, v in saved.items():
                if v:
                    base_cfg[k] = v
        except Exception as exc:
            logger.warning(f"Не удалось прочитать bot_config.json: {exc}")
    return base_cfg


def save_bot_config(updates: dict) -> dict:
    """Сохраняет обновленные токены/секреты в локальный bot_config.json."""
    cfg = load_bot_config()
    cfg.update(updates)
    try:
        CONFIG_JSON_PATH.write_text(
            json.dumps(cfg, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    except Exception as exc:
        logger.error(f"Ошибка сохранения bot_config.json: {exc}")
    return cfg


def load_known_repos() -> tuple[set[str], bool]:
    """
    Возвращает множество известных репозиториев и флаг (True, если файл уже существовал).
    При первом старте файл еще не существует — бот просто запомнит текущие репозитории.
    """
    if not KNOWN_REPOS_PATH.exists():
        return set(), False
    try:
        data = json.loads(KNOWN_REPOS_PATH.read_text(encoding="utf-8"))
        if isinstance(data, list):
            return set(data), True
        if isinstance(data, dict) and "repos" in data:
            return set(data["repos"]), True
    except Exception as exc:
        logger.warning(f"Ошибка чтения known_repos.json: {exc}")
    return set(), False


def save_known_repos(repos: set[str]) -> None:
    """Сохраняет список известных репозиториев в known_repos.json."""
    try:
        payload = {
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "repos": sorted(list(repos))
        }
        KNOWN_REPOS_PATH.write_text(
            json.dumps(payload, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    except Exception as exc:
        logger.error(f"Ошибка записи known_repos.json: {exc}")


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

# Состояние ожидания интерактивного ввода от пользователя в Telegram:
# chat_id -> {"field": "github_pat" | ..., "pending_action": "apk" | "pages" | None, "repo": str | None}
PENDING_INPUT_STATE: dict[int, dict] = {}


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


# =====================================================================
# 2. ШАБЛОН WORKFLOW (.github/workflows/build-and-deploy.yml) ДЛЯ НОВЫХ РЕПОЗИТОРИЕВ
# =====================================================================

def generate_workflow_yaml() -> str:
    """
    Генерирует универсальный файл .github/workflows/build-and-deploy.yml для любых проектов из AI Studio.
    1) В Set up JDK 17 использует actions/setup-java@v5 БЕЗ cache: 'gradle'.
    2) Если папки android и файла gradlew нет — устанавливает Node.js, собирает веб-бандл (npm install && npm run build
       или корневой index.html), создает capacitor.config.json с именем репозитория, выполняет npx cap add android,
       переходит в папку android и собирает APK через ./gradlew assembleRelease.
    3) Переименовывает готовый APK в формат {имя_репозитория}_v{github.run_number}.apk перед отправкой в Telegram.
    """
    return """name: Build & Deploy Android APK to Telegram

on:
  push:
    branches:
      - main
      - master
  workflow_dispatch:
    inputs:
      notes:
        description: 'Комментарий к сборке'
        required: false
        default: 'Автоматическая сборка APK'

jobs:
  build-and-deploy:
    name: Build Android APK & Send to Telegram
    runs-on: ubuntu-latest

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up JDK 17
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      - name: Set up Android SDK
        env:
          ANDROID_SDK_ROOT: /usr/local/lib/android/sdk
          ANDROID_HOME: /usr/local/lib/android/sdk
        run: |
          echo "ANDROID_SDK_ROOT=/usr/local/lib/android/sdk" >> $GITHUB_ENV
          echo "ANDROID_HOME=/usr/local/lib/android/sdk" >> $GITHUB_ENV
          yes | sudo ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null || true
          echo "y" | sudo ${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --install "platforms;android-34" "build-tools;34.0.0" "platform-tools"

      - name: Prepare Web Project & Wrap with Capacitor (if no android/ or gradlew)
        run: |
          if [ -d "android" ] || [ -f "gradlew" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
            echo "Обнаружен существующий Android/Gradle проект — шаг обертки Capacitor не требуется."
          else
            echo "Папка android/ и gradlew не найдены. Обнаружен веб-проект (AI Studio) — выполняем сборку и обертку в Android через Capacitor..."

            # 1. Установка зависимостей и сборка веб-бандла
            if [ ! -f "package.json" ]; then
              npm init -y
            else
              npm install --legacy-peer-deps || npm install
            fi

            WEB_DIR="www_bundle"
            if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.build ? 0 : 1)" 2>/dev/null; then
              npm run build
            fi

            if [ -d "dist" ] && [ -f "dist/index.html" ]; then
              WEB_DIR="dist"
            elif [ -d "build" ] && [ -f "build/index.html" ]; then
              WEB_DIR="build"
            elif [ -d "www" ] && [ -f "www/index.html" ]; then
              WEB_DIR="www"
            else
              # Если нет скрипта build — используем корневую папку с index.html
              mkdir -p "$WEB_DIR"
              for item in index.html *.html *.js *.css *.json *.png *.svg *.ico assets public src styles; do
                if [ -e "$item" ] && [ "$item" != "package.json" ] && [ "$item" != "package-lock.json" ] && [ "$item" != "tsconfig.json" ]; then
                  cp -r "$item" "$WEB_DIR/" 2>/dev/null || true
                fi
              done
              if [ ! -f "$WEB_DIR/index.html" ]; then
                echo "<!DOCTYPE html><html><head><meta charset='utf-8'><meta name='viewport' content='width=device-width,initial-scale=1'><title>${{ github.event.repository.name }}</title></head><body><h1>${{ github.event.repository.name }}</h1></body></html>" > "$WEB_DIR/index.html"
              fi
            fi

            # 2. Автоматическая инициализация Capacitor и создание capacitor.config.json с именем репозитория
            npm install @capacitor/core @capacitor/cli @capacitor/android --no-save --legacy-peer-deps || npm install @capacitor/core @capacitor/cli @capacitor/android --no-save

            RAW_NAME=$(echo "${{ github.event.repository.name }}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
            if [ -z "$RAW_NAME" ]; then RAW_NAME="app"; fi
            SAFE_PKG=$(echo "$RAW_NAME" | sed 's/^[0-9]/app&/')
            APP_ID="com.aistudio.${SAFE_PKG}"

            cat <<EOF > capacitor.config.json
          {
            "appId": "${APP_ID}",
            "appName": "${{ github.event.repository.name }}",
            "webDir": "${WEB_DIR}",
            "bundledWebRuntime": false
          }
          EOF

            # 3. Создание папки android и синхронизация
            npx cap add android
            npx cap sync android
          fi

      - name: Prepare Signing Keystore (.jks)
        id: keystore
        env:
          KEYSTORE_BASE64: ${{ secrets.KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        run: |
          if [ -n "$KEYSTORE_BASE64" ] && [ "$KEYSTORE_BASE64" != "-" ] && [ -n "$KEYSTORE_PASSWORD" ]; then
            echo "$KEYSTORE_BASE64" | base64 --decode > "$RUNNER_TEMP/release-key.jks"
            echo "store_file=$RUNNER_TEMP/release-key.jks" >> $GITHUB_OUTPUT
            echo "store_password=$KEYSTORE_PASSWORD" >> $GITHUB_OUTPUT
            echo "key_alias=$KEY_ALIAS" >> $GITHUB_OUTPUT
            echo "key_password=$KEY_PASSWORD" >> $GITHUB_OUTPUT
          else
            keytool -genkeypair -v \\
              -keystore "$RUNNER_TEMP/release-key.jks" \\
              -alias release_key \\
              -keyalg RSA -keysize 2048 -validity 10000 \\
              -storepass android123 -keypass android123 \\
              -dname "CN=AIStudio, OU=Mobile, O=AIStudio, L=City, S=State, C=US"
            echo "store_file=$RUNNER_TEMP/release-key.jks" >> $GITHUB_OUTPUT
            echo "store_password=android123" >> $GITHUB_OUTPUT
            echo "key_alias=release_key" >> $GITHUB_OUTPUT
            echo "key_password=android123" >> $GITHUB_OUTPUT
          fi

      - name: Build Release APK with Gradle
        run: |
          if [ -d "android" ] && [ -f "android/gradlew" ]; then
            cd android
          fi

          chmod +x gradlew
          ./gradlew assembleRelease \\
            -Pandroid.injected.signing.store.file="${{ steps.keystore.outputs.store_file }}" \\
            -Pandroid.injected.signing.store.password="${{ steps.keystore.outputs.store_password }}" \\
            -Pandroid.injected.signing.key.alias="${{ steps.keystore.outputs.key_alias }}" \\
            -Pandroid.injected.signing.key.password="${{ steps.keystore.outputs.key_password }}" || ./gradlew assembleDebug

      - name: Locate & Rename APK ({repo}_v{run_number}.apk)
        id: locate_apk
        run: |
          APK_FILE=$(find . -path "*/build/outputs/apk/*" -name "*.apk" ! -name "*-unsigned.apk" | head -n 1)
          if [ -z "$APK_FILE" ]; then
            APK_FILE=$(find . -path "*/build/outputs/apk/*" -name "*.apk" | head -n 1)
          fi
          if [ -z "$APK_FILE" ]; then
            echo "::error::Файл APK не найден в build/outputs/apk/"
            exit 1
          fi
          SHORT_SHA=$(git rev-parse --short HEAD)
          RENAMED_APK="${{ github.event.repository.name }}_v${{ github.run_number }}.apk"
          cp "$APK_FILE" "./$RENAMED_APK"
          echo "apk_path=./$RENAMED_APK" >> $GITHUB_OUTPUT
          echo "apk_filename=$RENAMED_APK" >> $GITHUB_OUTPUT
          echo "short_sha=$SHORT_SHA" >> $GITHUB_OUTPUT
          echo "commit_msg=$(git log -1 --pretty=format:'%s')" >> $GITHUB_OUTPUT
          echo "author=$(git log -1 --pretty=format:'%an')" >> $GITHUB_OUTPUT

      - name: Send APK to Telegram
        if: success()
        env:
          TELEGRAM_BOT_TOKEN: ${{ secrets.TELEGRAM_BOT_TOKEN }}
          TELEGRAM_CHAT_ID: ${{ secrets.TELEGRAM_CHAT_ID }}
          REPO_NAME: ${{ github.event.repository.name }}
          RUN_NUM: ${{ github.run_number }}
          APK_PATH: ${{ steps.locate_apk.outputs.apk_path }}
          SHORT_SHA: ${{ steps.locate_apk.outputs.short_sha }}
          COMMIT_MSG: ${{ steps.locate_apk.outputs.commit_msg }}
          AUTHOR: ${{ steps.locate_apk.outputs.author }}
        run: |
          RENAMED_APK="${REPO_NAME}_v${RUN_NUM}.apk"
          if [ "$APK_PATH" != "./$RENAMED_APK" ] && [ -f "$APK_PATH" ]; then
            cp "$APK_PATH" "./$RENAMED_APK"
          fi
          CAPTION="📦 <b>Сборка APK готова!</b>%0A%0A• <b>Проект:</b> <code>${REPO_NAME}</code>%0A• <b>Номер сборки:</b> <code>#${RUN_NUM}</code> (<code>v${RUN_NUM}</code>)%0A• <b>Файл:</b> <code>${RENAMED_APK}</code>%0A• <b>Ветка:</b> <code>${{ github.ref_name }}</code>%0A• <b>Коммит:</b> <code>${SHORT_SHA}</code> — ${COMMIT_MSG}%0A• <b>Автор:</b> ${AUTHOR}"
          curl -sS -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendDocument" \\
            -F "chat_id=${TELEGRAM_CHAT_ID}" \\
            -F "parse_mode=HTML" \\
            -F "caption=${CAPTION}" \\
            -F "document=@./${RENAMED_APK}"

      - name: Cleanup Keystore & Temp APK
        if: always()
        run: rm -f "$RUNNER_TEMP/release-key.jks" app/release-key.jks ./*_v*.apk
"""


# =====================================================================
# 3. РАБОТА С GITHUB API (ЗАПУСК СБОРОК, СЕКРЕТЫ ACTIONS, WORKFLOW, PAGES)
# =====================================================================

def get_github_headers(token: str) -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/2.0"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def encrypt_github_secret(public_key_b64: str, secret_value: str) -> str:
    """Шифрует значение секрета публичным ключом репозитория (LibSodium / PyNaCl)."""
    pk = public.PublicKey(public_key_b64.encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(pk)
    encrypted = sealed_box.encrypt(secret_value.encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")


async def set_repo_actions_secret(
    session: aiohttp.ClientSession,
    owner: str,
    repo: str,
    token: str,
    secret_name: str,
    secret_value: str
) -> tuple[bool, str]:
    """Записывает секрет в GitHub Actions Secrets указанного репозитория."""
    if not HAS_NACL:
        return False, "Библиотека PyNaCl не установлена (нужна для шифрования GitHub Secrets)."

    headers = get_github_headers(token)
    pk_url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/public-key"

    async with session.get(pk_url, headers=headers) as resp:
        if resp.status != 200:
            err = await resp.text()
            return False, f"Не удалось получить public-key репозитория (HTTP {resp.status}): {err}"
        pk_data = await resp.json()

    key_id = pk_data["key_id"]
    key_b64 = pk_data["key"]
    encrypted_value = encrypt_github_secret(key_b64, secret_value)

    secret_url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/{secret_name}"
    payload = {
        "encrypted_value": encrypted_value,
        "key_id": key_id
    }
    async with session.put(secret_url, json=payload, headers=headers) as resp:
        if resp.status in (201, 204):
            return True, "OK"
        err = await resp.text()
        return False, f"Ошибка записи секрета {secret_name} (HTTP {resp.status}): {err}"


async def create_or_update_workflow_file(
    session: aiohttp.ClientSession,
    owner: str,
    repo: str,
    token: str,
    branch: str = "main"
) -> tuple[bool, str]:
    """Создает или обновляет .github/workflows/build-and-deploy.yml в репозитории."""
    headers = get_github_headers(token)
    path = ".github/workflows/build-and-deploy.yml"
    url = f"https://api.github.com/repos/{owner}/{repo}/contents/{path}"

    # Проверяем, существует ли уже файл (если да — нужен его sha для обновления)
    existing_sha = None
    async with session.get(url, headers=headers) as resp:
        if resp.status == 200:
            data = await resp.json()
            existing_sha = data.get("sha")

    yaml_content = generate_workflow_yaml()
    content_b64 = base64.b64encode(yaml_content.encode("utf-8")).decode("utf-8")

    payload = {
        "message": "ci: add automated Android APK build & Telegram delivery workflow",
        "content": content_b64,
    }
    if existing_sha:
        payload["sha"] = existing_sha

    async with session.put(url, json=payload, headers=headers) as resp:
        if resp.status in (200, 201):
            return True, path
        err = await resp.text()
        return False, f"Ошибка создания файла воркфлоу (HTTP {resp.status}): {err}"


async def setup_auto_apk_for_repo(owner: str, repo: str, chat_id: int) -> tuple[bool, str]:
    """
    Полный цикл настройки автосборки APK в новом репозитории:
    1. Записывает секреты (TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID и опционально KEYSTORE_*).
    2. Создает файл .github/workflows/build-and-deploy.yml.
    """
    cfg = load_bot_config()
    token = cfg.get("github_pat", "")
    if not token:
        return False, "MISSING_GITHUB_PAT"

    target_chat_id = str(cfg.get("telegram_chat_id") or chat_id)
    secrets_to_set = {
        "TELEGRAM_BOT_TOKEN": TELEGRAM_BOT_TOKEN,
        "TELEGRAM_CHAT_ID": target_chat_id,
    }

    # Если у нас сохранены данные подписи APK (keystore), прописываем и их
    for cfg_key, secret_env_name in [
        ("keystore_base64", "KEYSTORE_BASE64"),
        ("keystore_password", "KEYSTORE_PASSWORD"),
        ("key_alias", "KEY_ALIAS"),
        ("key_password", "KEY_PASSWORD"),
    ]:
        val = cfg.get(cfg_key, "")
        if val and val != "-":
            secrets_to_set[secret_env_name] = val

    async with aiohttp.ClientSession() as session:
        # 1. Прописываем секреты в Actions Secrets
        for s_name, s_val in secrets_to_set.items():
            ok, msg = await set_repo_actions_secret(session, owner, repo, token, s_name, s_val)
            if not ok:
                return False, msg

        # 2. Создаем .github/workflows/build-and-deploy.yml
        ok, msg = await create_or_update_workflow_file(session, owner, repo, token)
        if not ok:
            return False, msg

    append_to_dev_log(f"В репозитории `{owner}/{repo}` автоматически настроен CI/CD (.github/workflows/build-and-deploy.yml + Actions Secrets).")
    return True, f"Секретов записано: {len(secrets_to_set)} ({', '.join(secrets_to_set.keys())})"


async def enable_github_pages_for_repo(owner: str, repo: str) -> tuple[bool, str]:
    """Включает GitHub Pages для ветки main (или master) и возвращает ссылку на сайт."""
    cfg = load_bot_config()
    token = cfg.get("github_pat", "")
    if not token:
        return False, "MISSING_GITHUB_PAT"

    headers = get_github_headers(token)
    pages_url = f"https://api.github.com/repos/{owner}/{repo}/pages"

    async with aiohttp.ClientSession() as session:
        # Узнаем дефолтную ветку репозитория (main или master)
        repo_url = f"https://api.github.com/repos/{owner}/{repo}"
        default_branch = "main"
        async with session.get(repo_url, headers=headers) as r_resp:
            if r_resp.status == 200:
                r_data = await r_resp.json()
                default_branch = r_data.get("default_branch") or "main"

        payload = {
            "source": {
                "branch": default_branch,
                "path": "/"
            }
        }
        async with session.post(pages_url, json=payload, headers=headers) as resp:
            site_url = f"https://{owner}.github.io/{repo}/"
            if resp.status == 201:
                data = await resp.json()
                site_url = data.get("html_url") or site_url
                append_to_dev_log(f"Для репозитория `{owner}/{repo}` включен GitHub Pages: {site_url}")
                return True, site_url
            elif resp.status == 409:
                # GitHub Pages уже включен — возвращаем готовую ссылку
                async with session.get(pages_url, headers=headers) as get_resp:
                    if get_resp.status == 200:
                        g_data = await get_resp.json()
                        site_url = g_data.get("html_url") or site_url
                return True, site_url
            else:
                err = await resp.text()
                return False, f"Ошибка GitHub Pages API (HTTP {resp.status}): {err}"


async def trigger_github_workflow(
    branch: str = None,
    notes: str = "Запуск сборки из Telegram",
    initiated_by: str = "Telegram",
    repo_override: str = None
) -> tuple[bool, str]:
    """
    Запускает сборку APK в выбранном или основном репозитории через workflow_dispatch
    (пробует основной воркфлоу, затем build-and-deploy.yml / build-apk.yml, затем repository_dispatch).
    """
    cfg = load_bot_config()
    token = cfg.get("github_pat", "")
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    repo = repo_override or cfg.get("github_repo", "xianxia-sect-maneger")
    configured_wf = cfg.get("github_workflow", "build-apk.yml")
    target_branch = branch or cfg.get("github_branch", "main")

    if not token:
        return False, "Токен GitHub (GITHUB_PAT) еще не задан. Отправьте /token или нажмите кнопку настройки токена."

    headers = get_github_headers(token)

    # Список возможных файлов воркфлоу (чтобы работало и со старым build-apk.yml, и с новым build-and-deploy.yml)
    workflows_to_try = []
    for wf in [configured_wf, "build-and-deploy.yml", "build-apk.yml"]:
        if wf and wf not in workflows_to_try:
            workflows_to_try.append(wf)

    payload = {
        "ref": target_branch,
        "inputs": {
            "notes": f"{notes} (от {initiated_by})"
        }
    }

    last_err = ""
    async with aiohttp.ClientSession() as session:
        for wf_name in workflows_to_try:
            workflow_url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{wf_name}/dispatches"
            async with session.post(workflow_url, json=payload, headers=headers) as resp:
                if resp.status == 204:
                    return True, f"Workflow {wf_name} успешно запущен в {owner}/{repo} (HTTP 204)."
                last_err = await resp.text()
                logger.warning(f"workflow_dispatch ({wf_name}) для {owner}/{repo} вернул HTTP {resp.status}: {last_err}")

        # Fallback: пробуем без inputs на случай, если в YAML не описаны inputs
        for wf_name in workflows_to_try:
            workflow_url = f"https://api.github.com/repos/{owner}/{repo}/actions/workflows/{wf_name}/dispatches"
            async with session.post(workflow_url, json={"ref": target_branch}, headers=headers) as resp:
                if resp.status == 204:
                    return True, f"Workflow {wf_name} успешно запущен в {owner}/{repo} (HTTP 204)."

        # Fallback 2: repository_dispatch
        dispatch_url = f"https://api.github.com/repos/{owner}/{repo}/dispatches"
        dispatch_payload = {
            "event_type": "build_apk",
            "client_payload": {
                "branch": target_branch,
                "notes": notes,
                "initiated_by": initiated_by,
                "timestamp": datetime.now(timezone.utc).isoformat()
            }
        }
        async with session.post(dispatch_url, json=dispatch_payload, headers=headers) as resp:
            if resp.status == 204:
                return True, f"Repository dispatch успешно отправлен в {owner}/{repo} (HTTP 204)."
            second_err = await resp.text()
            return False, (
                f"Не удалось запустить воркфлоу в {owner}/{repo} (HTTP {resp.status}). "
                f"Если в этом репозитории еще не настроена автосборка, нажмите «📱 Подключить автосборку APK» в карточке репозитория. "
                f"Детали GitHub: {last_err or second_err}"
            )


# =====================================================================
# 4. УПРАВЛЕНИЕ ВСЕМИ РЕПОЗИТОРИЯМИ И ФОНОВОЕ ОТСЛЕЖИВАНИЕ (КАЖДЫЕ 3 МИНУТЫ)
# =====================================================================

def get_new_repo_card_keyboard(repo_name: str, is_new_notification: bool = False) -> InlineKeyboardMarkup:
    """
    Клавиатура управления конкретным репозиторием:
    позволяет подключить автосборку APK, запустить билд прямо сейчас, проверить статус,
    включить GitHub Pages или сделать этот репозиторий основным.
    """
    cfg = load_bot_config()
    active_repo = cfg.get("github_repo", "xianxia-sect-maneger")
    is_active = (repo_name == active_repo)

    rows = [
        [
            InlineKeyboardButton(
                text="🔄 Обновить workflow в репозитории",
                callback_data=f"repo_update_wf:{repo_name}"
            )
        ],
        [
            InlineKeyboardButton(
                text="📱 Подключить автосборку APK (CI/CD)",
                callback_data=f"repo_apk:{repo_name}"
            )
        ],
        [
            InlineKeyboardButton(
                text="🚀 Собрать APK сейчас",
                callback_data=f"repo_build_now:{repo_name}"
            ),
            InlineKeyboardButton(
                text="📊 Статус сборок",
                callback_data=f"repo_status:{repo_name}"
            )
        ],
        [
            InlineKeyboardButton(
                text="🌐 Включить GitHub Pages",
                callback_data=f"repo_pages:{repo_name}"
            )
        ],
    ]

    if not is_active:
        rows.append([
            InlineKeyboardButton(
                text="⭐ Сделать основным проектом бота",
                callback_data=f"repo_set_active:{repo_name}"
            )
        ])

    if is_new_notification:
        rows.append([
            InlineKeyboardButton(
                text="❌ Пропустить",
                callback_data=f"repo_skip:{repo_name}"
            ),
            InlineKeyboardButton(
                text="📂 Все репозитории",
                callback_data="cb_repos_list"
            )
        ])
    else:
        rows.append([
            InlineKeyboardButton(
                text="⬅️ К списку репозиториев",
                callback_data="cb_repos_list"
            ),
            InlineKeyboardButton(
                text="🏠 В меню",
                callback_data="cb_back_main"
            )
        ])

    return InlineKeyboardMarkup(inline_keyboard=rows)


def get_repo_action_result_keyboard(repo_name: str) -> InlineKeyboardMarkup:
    """Кнопки возврата к карточке репозитория, списку всех репозиториев или в главное меню."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🚀 Запустить сборку APK сейчас",
                    callback_data=f"repo_build_now:{repo_name}"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🔄 Обновить workflow в репозитории",
                    callback_data=f"repo_update_wf:{repo_name}"
                )
            ],
            [
                InlineKeyboardButton(
                    text=f"⬅️ Назад к {repo_name}",
                    callback_data=f"repo_card:{repo_name}"
                ),
                InlineKeyboardButton(
                    text="📂 Все репо",
                    callback_data="cb_repos_list"
                )
            ],
            [
                InlineKeyboardButton(
                    text="🏠 Главное меню",
                    callback_data="cb_back_main"
                )
            ]
        ]
    )


def get_repos_list_keyboard(repo_names: list[str]) -> InlineKeyboardMarkup:
    """
    Строит список кнопок со ВСЕМИ репозиториями пользователя,
    чтобы можно было открыть любой из них и настроить автосборку APK или Pages.
    """
    cfg = load_bot_config()
    active_repo = cfg.get("github_repo", "xianxia-sect-maneger")
    rows = []

    for r_name in repo_names:
        prefix = "⭐ " if r_name == active_repo else "📦 "
        suffix = " (основной)" if r_name == active_repo else ""
        rows.append([
            InlineKeyboardButton(
                text=f"{prefix}{r_name}{suffix}",
                callback_data=f"repo_card:{r_name}"
            )
        ])

    rows.append([
        InlineKeyboardButton(text="🔄 Обновить список с GitHub", callback_data="cb_check_repos")
    ])
    rows.append([
        InlineKeyboardButton(text="⬅️ Назад в главное меню", callback_data="cb_back_main")
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


def get_back_to_main_keyboard() -> InlineKeyboardMarkup:
    """Универсальная кнопка возврата в главное меню."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="⬅️ Назад в главное меню",
                    callback_data="cb_back_main"
                )
            ]
        ]
    )


def get_back_to_setup_keyboard(repo_name: str = None) -> InlineKeyboardMarkup:
    """Кнопка отмены ввода и возврата в меню настроек (или к карточке репозитория)."""
    rows = []
    if repo_name:
        rows.append([
            InlineKeyboardButton(
                text=f"⬅️ Назад к {repo_name}",
                callback_data=f"repo_card:{repo_name}"
            )
        ])
    rows.append([
        InlineKeyboardButton(
            text="⬅️ Назад к настройкам",
            callback_data="cb_back_setup"
        ),
        InlineKeyboardButton(
            text="🏠 В меню",
            callback_data="cb_back_main"
        )
    ])
    return InlineKeyboardMarkup(inline_keyboard=rows)


async def fetch_public_repos(owner: str, token: str = "") -> list[dict]:
    """Получает список репозиториев профиля GitHub."""
    url = f"https://api.github.com/users/{owner}/repos?type=public&sort=updated&direction=desc&per_page=50"
    headers = get_github_headers(token)
    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                logger.warning(f"Не удалось получить список репозиториев {owner}: HTTP {resp.status}")
                return []
            data = await resp.json()
            return data if isinstance(data, list) else []


async def get_all_tracked_repos_view() -> tuple[str, InlineKeyboardMarkup]:
    """
    Синхронизирует список репозиториев с GitHub и возвращает текст + кнопки
    для выбора ЛЮБОГО из существующих репозиториев пользователя.
    """
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    active_repo = cfg.get("github_repo", "xianxia-sect-maneger")
    token = cfg.get("github_pat", "")

    repos_data = await fetch_public_repos(owner, token)
    known_names, _ = load_known_repos()

    if repos_data:
        fetched_names = [r["name"] for r in repos_data if r.get("name")]
        merged_set = set(fetched_names) | known_names
        save_known_repos(merged_set)
        # Сохраняем порядок с GitHub (сначала самые свежие), плюс остальные из known_repos
        ordered_repos = fetched_names + [n for n in sorted(known_names) if n not in fetched_names]
    else:
        ordered_repos = sorted(list(known_names)) if known_names else [active_repo]

    text = (
        f"📂 <b>Ваши репозитории в профиле <code>{owner}</code> ({len(ordered_repos)} шт.):</b>\n\n"
        f"• <b>Основной проект по умолчанию:</b> <code>{active_repo}</code> (отмечен ⭐)\n\n"
        f"👇 <b>Нажмите на любой репозиторий ниже</b>, чтобы:\n"
        f"— 📱 В 1 клик подключить ему автосборку APK (создать workflow + секреты)\n"
        f"— 🚀 Запустить сборку APK для него прямо сейчас\n"
        f"— 🌐 Включить ему GitHub Pages\n"
        f"— ⭐ Сделать его основным репозиторием бота"
    )
    return text, get_repos_list_keyboard(ordered_repos)


async def check_for_new_repositories(manual_trigger_chat_id: int = None) -> None:
    """
    Проверяет появление новых публичных репозиториев.
    При ручном вызове из чата всегда показывает список ВСЕХ доступных репозиториев кнопками!
    """
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    token = cfg.get("github_pat", "")

    repos_data = await fetch_public_repos(owner, token)
    if not repos_data:
        if manual_trigger_chat_id:
            known_names, _ = load_known_repos()
            fallback_list = sorted(list(known_names)) if known_names else [cfg.get("github_repo", "xianxia-sect-maneger")]
            await bot.send_message(
                manual_trigger_chat_id,
                f"⚠️ Не удалось обновить список с GitHub для <code>{owner}</code>. Показаны сохраненные репозитории:",
                reply_markup=get_repos_list_keyboard(fallback_list)
            )
        return

    fetched_names = [r["name"] for r in repos_data if r.get("name")]
    current_names = set(fetched_names)
    known_names, initialized = load_known_repos()

    # Первый старт: запоминаем текущие репозитории
    if not initialized:
        save_known_repos(current_names)
        logger.info(f"Инициализирован known_repos.json: запомнено {len(current_names)} существующих репозиториев.")
        if manual_trigger_chat_id:
            await bot.send_message(
                manual_trigger_chat_id,
                f"✅ База репозиториев инициализирована (<code>known_repos.json</code>).\n"
                f"Найдено ваших репозиториев: <b>{len(fetched_names)}</b>.\n\n"
                f"👇 <b>Выберите любой репозиторий ниже</b> для настройки автосборки APK или запуска билда:",
                reply_markup=get_repos_list_keyboard(fetched_names)
            )
        return

    new_names = current_names - known_names
    if not new_names:
        if manual_trigger_chat_id:
            await bot.send_message(
                manual_trigger_chat_id,
                f"🔍 <b>Новых репозиториев пока не появилось</b> (отслеживается: <b>{len(current_names)}</b>).\n\n"
                f"👇 Вы можете выбрать <b>любой из ваших репозиториев</b> ниже, чтобы подключить ему автосборку APK, включить GitHub Pages или запустить билд:",
                reply_markup=get_repos_list_keyboard(fetched_names)
            )
        return

    # Сохраняем обновленный список, чтобы не присылать карточку повторно
    known_names.update(new_names)
    save_known_repos(known_names)

    # Отправляем карточку по каждому новому репозиторию
    for r in repos_data:
        r_name = r.get("name")
        if r_name not in new_names:
            continue

        desc = r.get("description") or "Без описания"
        lang = r.get("language") or "Не определен"
        html_url = r.get("html_url") or f"https://github.com/{owner}/{r_name}"

        card_text = (
            f"🆕 <b>Обнаружен новый репозиторий на GitHub!</b>\n\n"
            f"• <b>Проект:</b> <a href=\"{html_url}\">{owner}/{r_name}</a>\n"
            f"• <b>Описание:</b> {desc}\n"
            f"• <b>Язык:</b> <code>{lang}</code>\n"
            f"• <b>Ветка по умолчанию:</b> <code>{r.get('default_branch', 'main')}</code>\n\n"
            f"Выберите действие для настройки в 1 клик:"
        )
        kb = get_new_repo_card_keyboard(r_name, is_new_notification=True)

        for chat_id in AUTHORIZED_CHAT_IDS:
            try:
                await bot.send_message(
                    chat_id=chat_id,
                    text=card_text,
                    reply_markup=kb,
                    disable_web_page_preview=True
                )
            except Exception as exc:
                logger.error(f"Ошибка отправки карточки нового репозитория в чат {chat_id}: {exc}")


async def background_repo_watcher():
    """Фоновая асинхронная задача: проверяет новые репозитории каждые 3 минуты (180 сек)."""
    await asyncio.sleep(5)
    logger.info("Фоновый мониторинг новых репозиториев GitHub запущен (интервал: 3 минуты).")
    while True:
        try:
            await check_for_new_repositories()
        except Exception as exc:
            logger.error(f"Ошибка в цикле мониторинга репозиториев: {exc}")
        await asyncio.sleep(180)


# =====================================================================
# 5. КЛАВИАТУРЫ И ИНТЕРАКТИВНАЯ НАСТРОЙКА (/setup, /token, /repos)
# =====================================================================

def get_main_reply_keyboard() -> ReplyKeyboardMarkup:
    """Постоянная нижняя клавиатура с красивыми кнопками."""
    return ReplyKeyboardMarkup(
        keyboard=[
            [
                KeyboardButton(text="🚀 Собрать APK (main)"),
                KeyboardButton(text="📂 Мои репозитории"),
            ],
            [
                KeyboardButton(text="📊 Статус CI/CD"),
                KeyboardButton(text="⚙️ Настройки / Токен"),
            ],
            [
                KeyboardButton(text="📖 Журнал сборок (log)"),
                KeyboardButton(text="ℹ️ О репозитории"),
            ]
        ],
        resize_keyboard=True,
        is_persistent=True
    )


def get_main_menu_text(chat_id: int) -> str:
    """Текст главного меню управления ботом."""
    cfg = load_bot_config()
    known_repos, _ = load_known_repos()
    auth_status = "Доступ разрешен" if is_authorized(chat_id) else "Нет в списке разрешенных"
    return (
        f"<b>CI/CD Панель управления сборкой APK и репозиториями</b>\n\n"
        f"• <b>Профиль GitHub:</b> <code>{cfg.get('github_owner')}</code>\n"
        f"• <b>Активный проект:</b> <code>{cfg.get('github_repo')}</code>\n"
        f"• <b>Всего репозиториев в базе:</b> <code>{len(known_repos)}</code> (автопроверка каждые 3 мин)\n"
        f"• <b>Текущий Chat ID:</b> <code>{chat_id}</code> ({auth_status})\n\n"
        f"Нажмите <b>«📂 Все мои репозитории»</b>, чтобы настроить автосборку APK или запустить билд для любого из ваших проектов:"
    )


def get_start_inline_keyboard() -> InlineKeyboardMarkup:
    """Инлайн-кнопки под приветственным сообщением."""
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    repo = cfg.get("github_repo", "xianxia-sect-maneger")
    known_repos, _ = load_known_repos()
    count_label = f" ({len(known_repos)})" if known_repos else ""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"📂 Все мои репозитории{count_label} — выбор и автосборка",
                    callback_data="cb_repos_list"
                )
            ],
            [
                InlineKeyboardButton(text=f"🚀 Собрать {repo}", callback_data="cb_build"),
                InlineKeyboardButton(text="📊 Статус Actions", callback_data="cb_status"),
            ],
            [
                InlineKeyboardButton(
                    text="🔄 Обновить workflow в репозитории",
                    callback_data=f"repo_update_wf:{repo}"
                )
            ],
            [
                InlineKeyboardButton(text="🔍 Проверить новые репо", callback_data="cb_check_repos"),
                InlineKeyboardButton(text="⚙️ Настроить токен / ключи", callback_data="cb_setup_menu"),
            ],
            [
                InlineKeyboardButton(text="📖 Журнал dev_log.md", callback_data="cb_log"),
                InlineKeyboardButton(
                    text="🌐 GitHub Actions",
                    url=f"https://github.com/{owner}/{repo}/actions"
                ),
            ]
        ]
    )


def get_setup_inline_keyboard() -> InlineKeyboardMarkup:
    """Интерактивное меню настройки токенов и ключей прямо в Telegram + кнопка Назад."""
    cfg = load_bot_config()
    has_pat = "✅" if cfg.get("github_pat") else "❌"
    has_ks = "✅" if cfg.get("keystore_base64") else "➖"
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text=f"{has_pat} Указать GitHub Token (PAT)",
                    callback_data="setup_field:github_pat"
                )
            ],
            [
                InlineKeyboardButton(
                    text=f"{has_ks} Указать Keystore Base64 (.jks)",
                    callback_data="setup_field:keystore_base64"
                ),
                InlineKeyboardButton(
                    text="🔑 Пароли и Alias ключа",
                    callback_data="setup_field:keystore_creds"
                )
            ],
            [
                InlineKeyboardButton(
                    text="👤 Изменить GitHub Owner",
                    callback_data="setup_field:github_owner"
                ),
                InlineKeyboardButton(
                    text="📂 Выбрать репозиторий",
                    callback_data="cb_repos_list"
                )
            ],
            [
                InlineKeyboardButton(
                    text="⬅️ Назад в главное меню",
                    callback_data="cb_back_main"
                )
            ]
        ]
    )


async def prompt_for_missing_token(chat_id: int, pending_action: str = None, repo_name: str = None):
    """Запрашивает у пользователя недостающий GitHub PAT прямо в чате с кнопкой Назад."""
    PENDING_INPUT_STATE[chat_id] = {
        "field": "github_pat",
        "pending_action": pending_action,
        "repo": repo_name
    }
    await bot.send_message(
        chat_id=chat_id,
        text=(
            "🔑 <b>Требуется GitHub Personal Access Token (PAT)</b>\n\n"
            "Отправьте ваш токен (<code>github_pat_...</code> или <code>ghp_...</code>) "
            "прямо сюда следующим сообщением.\n\n"
            "Бот сохранит его в локальный файл <code>bot_config.json</code> "
            "и сразу выполнит действие автоматически!"
        ),
        reply_markup=get_back_to_setup_keyboard(repo_name=repo_name)
    )


async def perform_build(
    chat_id: int,
    sender_label: str,
    branch: str,
    notes: str,
    reply_to_message: Message = None,
    repo_override: str = None
):
    """Выполняет запуск сборки APK для выбранного (или активного) репозитория."""
    if not is_authorized(chat_id):
        text = f"⛔ Chat ID <code>{chat_id}</code> не авторизован для запуска сборки."
        if reply_to_message:
            await reply_to_message.answer(text, reply_markup=get_back_to_main_keyboard())
        else:
            await bot.send_message(chat_id, text, reply_markup=get_back_to_main_keyboard())
        return

    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    repo = repo_override or cfg.get("github_repo", "xianxia-sect-maneger")

    init_text = (
        f"⏳ Запускаю сборку APK в репозитории "
        f"<code>{owner}/{repo}</code> (ветка: <code>{branch}</code>)..."
    )
    if reply_to_message:
        status_msg = await reply_to_message.answer(init_text)
    else:
        status_msg = await bot.send_message(chat_id, init_text)

    success, details = await trigger_github_workflow(
        branch=branch,
        notes=notes,
        initiated_by=sender_label,
        repo_override=repo
    )

    if success:
        append_to_dev_log(f"Сборка APK ({owner}/{repo}) запущена из {sender_label}, ветка `{branch}`: {notes}")
        kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🌐 Открыть GitHub Actions",
                    url=f"https://github.com/{owner}/{repo}/actions"
                ),
                InlineKeyboardButton(
                    text="📊 Статус сборки",
                    callback_data=f"repo_status:{repo}"
                )
            ],
            [
                InlineKeyboardButton(
                    text=f"⬅️ К репозиторию {repo}",
                    callback_data=f"repo_card:{repo}"
                ),
                InlineKeyboardButton(
                    text="🏠 В меню",
                    callback_data="cb_back_main"
                )
            ]
        ])
        await status_msg.edit_text(
            f"✅ <b>Сборка успешно инициирована в GitHub Actions!</b>\n\n"
            f"• <b>Репозиторий:</b> <code>{owner}/{repo}</code>\n"
            f"• <b>Ветка:</b> <code>{branch}</code>\n"
            f"• <b>Инициатор:</b> {sender_label}\n"
            f"• <b>Примечание:</b> {notes}\n\n"
            f"Готовый файл <code>.apk</code> будет отправлен в чат сразу после сборки.",
            reply_markup=kb
        )
    else:
        err_kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📱 Подключить автосборку APK в 1 клик",
                    callback_data=f"repo_apk:{repo}"
                )
            ],
            [
                InlineKeyboardButton(text="⚙️ Настроить токен", callback_data="cb_setup_menu"),
                InlineKeyboardButton(text=f"⬅️ К {repo}", callback_data=f"repo_card:{repo}")
            ],
            [
                InlineKeyboardButton(text="🏠 В главное меню", callback_data="cb_back_main")
            ]
        ])
        await status_msg.edit_text(
            f"❌ <b>Ошибка запуска сборки в <code>{owner}/{repo}</code>:</b>\n<code>{details}</code>",
            reply_markup=err_kb
        )


async def get_status_text(repo_override: str = None) -> tuple[str, InlineKeyboardMarkup]:
    """Запрашивает статус последнего запуска на GitHub Actions для выбранного или активного репозитория."""
    cfg = load_bot_config()
    token = cfg.get("github_pat", "")
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    repo = repo_override or cfg.get("github_repo", "xianxia-sect-maneger")

    refresh_cb = f"repo_status:{repo}" if repo_override else "cb_status"
    back_row = [
        InlineKeyboardButton(text=f"⬅️ К {repo}", callback_data=f"repo_card:{repo}"),
        InlineKeyboardButton(text="📂 Все репо", callback_data="cb_repos_list"),
        InlineKeyboardButton(text="🏠 Меню", callback_data="cb_back_main")
    ]

    fallback_kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(text="⚙️ Настроить токен", callback_data="cb_setup_menu"),
            InlineKeyboardButton(text="🔄 Обновить", callback_data=refresh_cb)
        ],
        back_row
    ])

    if not token:
        return (
            "⚠️ Токен GitHub (GITHUB_PAT) еще не задан. Нажмите «⚙️ Настроить токен» или отправьте /token.",
            fallback_kb
        )

    url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs?per_page=1"
    headers = get_github_headers(token)

    async with aiohttp.ClientSession() as session:
        async with session.get(url, headers=headers) as resp:
            if resp.status != 200:
                return f"⚠️ Не удалось получить статус для <code>{owner}/{repo}</code> (HTTP {resp.status}).", fallback_kb
            data = await resp.json()

    runs = data.get("workflow_runs", [])
    if not runs:
        empty_kb = InlineKeyboardMarkup(inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="📱 Подключить автосборку APK",
                    callback_data=f"repo_apk:{repo}"
                )
            ],
            back_row
        ])
        return f"Сборок в репозитории <code>{owner}/{repo}</code> пока не найдено.", empty_kb

    latest = runs[0]
    kb = InlineKeyboardMarkup(inline_keyboard=[
        [
            InlineKeyboardButton(
                text="🔄 Обновить workflow в репозитории",
                callback_data=f"repo_update_wf:{repo}"
            )
        ],
        [
            InlineKeyboardButton(
                text="🌐 Открыть на GitHub",
                url=latest.get("html_url", f"https://github.com/{owner}/{repo}/actions")
            ),
            InlineKeyboardButton(text="🔄 Обновить статус", callback_data=refresh_cb)
        ],
        back_row
    ])
    text = (
        f"📊 <b>Статус последнего запуска CI/CD:</b>\n\n"
        f"• <b>Репозиторий:</b> <code>{owner}/{repo}</code>\n"
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


def get_log_keyboard() -> InlineKeyboardMarkup:
    """Клавиатура под журналом dev_log.md с кнопкой Назад."""
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(text="🔄 Обновить журнал", callback_data="cb_log"),
                InlineKeyboardButton(text="⬅️ Назад в меню", callback_data="cb_back_main")
            ]
        ]
    )


def get_setup_summary_text() -> str:
    cfg = load_bot_config()
    pat = cfg.get("github_pat", "")
    masked_pat = f"{pat[:12]}...{pat[-4:]}" if len(pat) > 16 else ("Задан" if pat else "❌ Не задан")
    ks = "✅ Загружен" if cfg.get("keystore_base64") else "➖ Не задан (опционально)"
    known_repos, init_flag = load_known_repos()
    return (
        f"⚙️ <b>Настройки бота и автосборки (bot_config.json)</b>\n\n"
        f"• <b>GitHub профиль:</b> <code>{cfg.get('github_owner')}</code>\n"
        f"• <b>Активный проект:</b> <code>{cfg.get('github_repo')}</code>\n"
        f"• <b>GitHub Token (PAT):</b> <code>{masked_pat}</code>\n"
        f"• <b>Keystore (.jks Base64):</b> {ks}\n"
        f"• <b>Key Alias:</b> <code>{cfg.get('key_alias') or 'не задан'}</code>\n"
        f"• <b>Отслеживаемых репозиториев:</b> <code>{len(known_repos)}</code> (проверка каждые 3 мин)\n\n"
        f"Чтобы задать или обновить токен в 1 клик без консоли — нажмите кнопку ниже или отправьте <code>/token ВАШ_ТОКЕН</code>:"
    )


# =====================================================================
# 6. ОБРАБОТЧИКИ КОМАНД, КНОПОК И ИНТЕРАКТИВНОГО ВВОДА СЕКРЕТОВ
# =====================================================================

@router.message(Command("start"))
@router.channel_post(Command("start"))
async def cmd_start(message: Message):
    chat_id = message.chat.id
    PENDING_INPUT_STATE.pop(chat_id, None)
    await message.answer(
        get_main_menu_text(chat_id),
        reply_markup=get_start_inline_keyboard()
    )
    if message.chat.type != "channel":
        await message.answer(
            "Меню быстрых команд активировано 👇",
            reply_markup=get_main_reply_keyboard()
        )


@router.message(Command("repos"))
@router.channel_post(Command("repos"))
@router.message(F.text == "📂 Мои репозитории")
async def cmd_repos_list(message: Message):
    """Открывает интерактивный список ВСЕХ репозиториев пользователя."""
    if not is_authorized(message.chat.id):
        return
    PENDING_INPUT_STATE.pop(message.chat.id, None)
    text, kb = await get_all_tracked_repos_view()
    await message.answer(text, reply_markup=kb)


@router.message(Command("setup"))
@router.channel_post(Command("setup"))
@router.message(F.text == "⚙️ Настройки / Токен")
async def cmd_setup(message: Message):
    if not is_authorized(message.chat.id):
        return
    PENDING_INPUT_STATE.pop(message.chat.id, None)
    await message.answer(
        get_setup_summary_text(),
        reply_markup=get_setup_inline_keyboard()
    )


@router.message(Command("token"))
@router.channel_post(Command("token"))
async def cmd_token(message: Message, command: CommandObject):
    if not is_authorized(message.chat.id):
        return
    if command.args and command.args.strip():
        token_val = command.args.strip()
        save_bot_config({"github_pat": token_val})
        await message.answer(
            "✅ <b>GitHub Personal Access Token сохранен в <code>bot_config.json</code>!</b>\n"
            "Теперь бот будет использовать его автоматически для всех операций с GitHub API.",
            reply_markup=get_setup_inline_keyboard()
        )
    else:
        await prompt_for_missing_token(message.chat.id)


@router.message(Command("check_repos"))
@router.channel_post(Command("check_repos"))
@router.message(F.text == "🔍 Проверить репозитории")
async def cmd_check_repos(message: Message):
    if not is_authorized(message.chat.id):
        return
    await check_for_new_repositories(manual_trigger_chat_id=message.chat.id)


@router.message(Command("build"))
@router.channel_post(Command("build"))
async def cmd_build(message: Message, command: CommandObject):
    cfg = load_bot_config()
    args = (command.args or "").split(maxsplit=1)
    branch = args[0] if len(args) >= 1 else cfg.get("github_branch", "main")
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
    cfg = load_bot_config()
    sender_label = f"@{message.from_user.username}" if message.from_user and message.from_user.username else str(message.chat.id)
    await perform_build(message.chat.id, sender_label, cfg.get("github_branch", "main"), "Запуск через кнопку меню", reply_to_message=message)


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
        await message.answer(
            f"📝 Запись добавлена в <code>dev_log.md</code>.",
            reply_markup=get_log_keyboard()
        )
        return

    await message.answer(get_log_text(), reply_markup=get_log_keyboard())


@router.message(F.text == "📖 Журнал сборок (log)")
async def reply_btn_log(message: Message):
    if not is_authorized(message.chat.id):
        return
    await message.answer(get_log_text(), reply_markup=get_log_keyboard())


@router.message(F.text == "ℹ️ О репозитории")
async def reply_btn_info(message: Message):
    chat_id = message.chat.id
    cfg = load_bot_config()
    known_repos, _ = load_known_repos()
    auth_status = "Доступ разрешен" if is_authorized(chat_id) else "Нет в списке разрешенных"
    await message.answer(
        f"ℹ️ <b>Информация о сборке и мониторинге:</b>\n\n"
        f"• <b>Профиль:</b> <code>{cfg.get('github_owner')}</code>\n"
        f"• <b>Активный репозиторий:</b> <code>{cfg.get('github_repo')}</code>\n"
        f"• <b>Файл воркфлоу:</b> <code>{cfg.get('github_workflow')}</code>\n"
        f"• <b>Ветка:</b> <code>{cfg.get('github_branch')}</code>\n"
        f"• <b>Известных репозиториев в базе:</b> <code>{len(known_repos)}</code>\n"
        f"• <b>Ваш Chat ID:</b> <code>{chat_id}</code> ({auth_status})",
        reply_markup=get_start_inline_keyboard()
    )


# ---------------------------------------------------------------------
# ОБРАБОТЧИКИ НАЖАТИЙ НА ИНЛАЙН-КНОПКИ И НАВИГАЦИИ «НАЗАД» (CALLBACKS)
# ---------------------------------------------------------------------

@router.callback_query(F.data == "cb_back_main")
async def callback_back_main(call: CallbackQuery):
    """Возвращает пользователя в главное меню и отменяет незавершенный ввод."""
    await call.answer("Главное меню")
    chat_id = call.message.chat.id
    PENDING_INPUT_STATE.pop(chat_id, None)
    text = get_main_menu_text(chat_id)
    kb = get_start_inline_keyboard()
    try:
        await call.message.edit_text(text, reply_markup=kb)
    except Exception:
        await call.message.answer(text, reply_markup=kb)


@router.callback_query(F.data == "cb_repos_list")
async def callback_repos_list(call: CallbackQuery):
    """Показывает интерактивный список ВСЕХ репозиториев пользователя."""
    await call.answer("Загружаю список репозиториев...")
    chat_id = call.message.chat.id
    PENDING_INPUT_STATE.pop(chat_id, None)
    text, kb = await get_all_tracked_repos_view()
    try:
        await call.message.edit_text(text, reply_markup=kb)
    except Exception:
        await call.message.answer(text, reply_markup=kb)


@router.callback_query(F.data == "cb_back_setup")
async def callback_back_setup(call: CallbackQuery):
    """Возвращает пользователя из режима ввода поля обратно в меню настроек."""
    await call.answer("Назад к настройкам")
    chat_id = call.message.chat.id
    PENDING_INPUT_STATE.pop(chat_id, None)
    text = get_setup_summary_text()
    kb = get_setup_inline_keyboard()
    try:
        await call.message.edit_text(text, reply_markup=kb)
    except Exception:
        await call.message.answer(text, reply_markup=kb)


@router.callback_query(F.data.startswith("repo_card:"))
async def callback_open_repo_card(call: CallbackQuery):
    """Открывает карточку управления выбранным репозиторием."""
    repo_name = call.data.split(":", 1)[1]
    await call.answer(f"Проект: {repo_name}")
    chat_id = call.message.chat.id
    PENDING_INPUT_STATE.pop(chat_id, None)
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    active_repo = cfg.get("github_repo", "xianxia-sect-maneger")
    status_badge = "⭐ Основной проект бота" if repo_name == active_repo else "📦 Подключенный репозиторий"

    card_text = (
        f"🛠 <b>Управление репозиторием: <code>{owner}/{repo_name}</code></b>\n\n"
        f"• <b>Статус:</b> {status_badge}\n"
        f"• <b>Ссылка:</b> <a href=\"https://github.com/{owner}/{repo_name}\">github.com/{owner}/{repo_name}</a>\n"
        f"• <b>Ветка по умолчанию:</b> <code>main</code>\n\n"
        f"Выберите действие для этого репозитория:"
    )
    kb = get_new_repo_card_keyboard(repo_name)
    try:
        await call.message.edit_text(card_text, reply_markup=kb, disable_web_page_preview=True)
    except Exception:
        await call.message.answer(card_text, reply_markup=kb, disable_web_page_preview=True)


@router.callback_query(F.data.startswith("repo_set_active:"))
async def callback_repo_set_active(call: CallbackQuery):
    """Делает выбранный репозиторий основным по умолчанию для бота."""
    repo_name = call.data.split(":", 1)[1]
    save_bot_config({"github_repo": repo_name})
    await call.answer(f"Проект {repo_name} теперь основной!", show_alert=True)
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    card_text = (
        f"🛠 <b>Управление репозиторием: <code>{owner}/{repo_name}</code></b>\n\n"
        f"• <b>Статус:</b> ⭐ Основной проект бота (сохранено в <code>bot_config.json</code>)\n"
        f"• <b>Ссылка:</b> <a href=\"https://github.com/{owner}/{repo_name}\">github.com/{owner}/{repo_name}</a>\n\n"
        f"Выберите действие для этого репозитория:"
    )
    kb = get_new_repo_card_keyboard(repo_name)
    try:
        await call.message.edit_text(card_text, reply_markup=kb, disable_web_page_preview=True)
    except Exception:
        await call.message.answer(card_text, reply_markup=kb, disable_web_page_preview=True)


@router.callback_query(F.data.startswith("repo_build_now:"))
async def callback_repo_build_now(call: CallbackQuery):
    """Запускает сборку APK в конкретном выбранном репозитории."""
    repo_name = call.data.split(":", 1)[1]
    await call.answer(f"Запускаю сборку в {repo_name}...")
    cfg = load_bot_config()
    sender_label = f"@{call.from_user.username}" if call.from_user and call.from_user.username else str(call.message.chat.id)
    await perform_build(
        call.message.chat.id,
        sender_label,
        cfg.get("github_branch", "main"),
        f"Запуск сборки для {repo_name} из карточки репозитория",
        reply_to_message=call.message,
        repo_override=repo_name
    )


@router.callback_query(F.data.startswith("repo_status:"))
async def callback_repo_status(call: CallbackQuery):
    """Проверяет статус сборок для конкретного выбранного репозитория."""
    repo_name = call.data.split(":", 1)[1]
    await call.answer(f"Статус {repo_name}...")
    text, kb = await get_status_text(repo_override=repo_name)
    try:
        await call.message.edit_text(text, reply_markup=kb)
    except Exception:
        await call.message.answer(text, reply_markup=kb)


@router.callback_query(F.data == "cb_build")
async def callback_build(call: CallbackQuery):
    await call.answer()
    cfg = load_bot_config()
    sender_label = f"@{call.from_user.username}" if call.from_user and call.from_user.username else str(call.message.chat.id)
    await perform_build(call.message.chat.id, sender_label, cfg.get("github_branch", "main"), "Запуск через инлайн-кнопку", reply_to_message=call.message)


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
    await call.answer("Открываю журнал...")
    text = get_log_text()
    kb = get_log_keyboard()
    try:
        await call.message.edit_text(text, reply_markup=kb)
    except Exception:
        await call.message.answer(text, reply_markup=kb)


@router.callback_query(F.data == "cb_check_repos")
async def callback_check_repos(call: CallbackQuery):
    await call.answer("Проверяю GitHub профиль...")
    await check_for_new_repositories(manual_trigger_chat_id=call.message.chat.id)


@router.callback_query(F.data == "cb_setup_menu")
async def callback_setup_menu(call: CallbackQuery):
    await call.answer()
    PENDING_INPUT_STATE.pop(call.message.chat.id, None)
    text = get_setup_summary_text()
    kb = get_setup_inline_keyboard()
    try:
        await call.message.edit_text(text, reply_markup=kb)
    except Exception:
        await call.message.answer(text, reply_markup=kb)


@router.callback_query(F.data == "cb_simulate_new_repo")
async def callback_simulate_new_repo(call: CallbackQuery):
    """Позволяет протестировать карточку нового репозитория на текущем проекте."""
    await call.answer()
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    repo = cfg.get("github_repo", "xianxia-sect-maneger")
    card_text = (
        f"🆕 <b>Обнаружен новый репозиторий на GitHub!</b>\n\n"
        f"• <b>Проект:</b> <a href=\"https://github.com/{owner}/{repo}\">{owner}/{repo}</a>\n"
        f"• <b>Описание:</b> Карточка быстрой настройки CI/CD в 1 клик\n"
        f"• <b>Ветка по умолчанию:</b> <code>main</code>\n\n"
        f"Выберите действие для настройки в 1 клик:"
    )
    try:
        await call.message.edit_text(
            card_text,
            reply_markup=get_new_repo_card_keyboard(repo, is_new_notification=True),
            disable_web_page_preview=True
        )
    except Exception:
        await call.message.answer(
            card_text,
            reply_markup=get_new_repo_card_keyboard(repo, is_new_notification=True),
            disable_web_page_preview=True
        )


@router.callback_query(F.data.startswith("setup_field:"))
async def callback_setup_field(call: CallbackQuery):
    await call.answer()
    field = call.data.split(":", 1)[1]
    chat_id = call.message.chat.id
    PENDING_INPUT_STATE[chat_id] = {"field": field, "pending_action": None, "repo": None}

    prompts = {
        "github_pat": (
            "🔑 Отправьте ваш <b>GitHub Personal Access Token</b> (<code>github_pat_...</code> или <code>ghp_...</code>) "
            "ответным сообщением. Бот сохранит его в <code>bot_config.json</code>:"
        ),
        "keystore_base64": (
            "🔐 Отправьте Base64-строку вашего <code>.jks</code> ключа (или просто перешлите файл <code>.jks</code> "
            "в этот чат — бот сам закодирует его в Base64 и сохранит!).\n"
            "Если подпись релизным ключом не нужна, отправьте <code>-</code>:"
        ),
        "keystore_creds": (
            "🔑 Отправьте данные ключа через пробел в формате:\n"
            "<code>STORE_PASSWORD KEY_ALIAS KEY_PASSWORD</code>"
        ),
        "github_owner": (
            "👤 Отправьте ваш логин на GitHub (например, <code>retrihgtrtyuh-cmd</code>):"
        ),
    }
    prompt_text = prompts.get(field, "Отправьте новое значение:")
    kb = get_back_to_setup_keyboard()
    try:
        await call.message.edit_text(prompt_text, reply_markup=kb)
    except Exception:
        await call.message.answer(prompt_text, reply_markup=kb)


# ---------------------------------------------------------------------
# КНОПКИ КАРТОЧКИ РЕПОЗИТОРИЯ: [📱 APK] [🌐 Pages] [❌ Пропустить]
# ---------------------------------------------------------------------

@router.callback_query(F.data.startswith("repo_update_wf:"))
async def callback_repo_update_wf(call: CallbackQuery):
    """Перезаписывает .github/workflows/build-and-deploy.yml в выбранном репозитории (например, Planer-lesson)."""
    repo_name = call.data.split(":", 1)[1]
    chat_id = call.message.chat.id
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    token = cfg.get("github_pat", "")

    if not token:
        await call.answer("Нужен GitHub токен!", show_alert=True)
        await prompt_for_missing_token(chat_id, pending_action="update_wf", repo_name=repo_name)
        return

    await call.answer(f"Обновляю workflow в {repo_name}...")
    wait_msg = await call.message.answer(
        f"🔄 <b>Перезаписываю workflow в <code>{owner}/{repo_name}</code>...</b>\n"
        f"• Установка <code>actions/setup-java@v5</code> (без <code>cache: 'gradle'</code>)\n"
        f"• Авто-обертка веб-проектов AI Studio через Capacitor (<code>npx cap add android</code>)\n"
        f"• Переименование APK в <code>{repo_name}_v{{run_number}}.apk</code>"
    )

    ok, details = await setup_auto_apk_for_repo(owner, repo_name, chat_id)
    res_kb = get_repo_action_result_keyboard(repo_name)
    if ok:
        await wait_msg.edit_text(
            f"✅ <b>Workflow в репозитории <code>{owner}/{repo_name}</code> успешно обновлен!</b>\n\n"
            f"• <b>Файл:</b> <code>.github/workflows/build-and-deploy.yml</code>\n"
            f"• <b>Исправления:</b> <code>setup-java@v5</code> без кэша Gradle + Capacitor Android-обертка для веб-приложений + переименование <code>{repo_name}_v{{run_number}}.apk</code>\n"
            f"• <b>Секреты:</b> {details}\n\n"
            f"Нажмите кнопку ниже, чтобы сразу запустить новую сборку APK:",
            reply_markup=res_kb
        )
    else:
        await wait_msg.edit_text(
            f"❌ <b>Не удалось обновить workflow в {owner}/{repo_name}:</b>\n<code>{details}</code>",
            reply_markup=res_kb
        )


@router.callback_query(F.data.startswith("repo_apk:"))
async def callback_repo_apk(call: CallbackQuery):
    repo_name = call.data.split(":", 1)[1]
    chat_id = call.message.chat.id
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")

    if not cfg.get("github_pat"):
        await call.answer("Нужен GitHub токен!", show_alert=True)
        await prompt_for_missing_token(chat_id, pending_action="apk", repo_name=repo_name)
        return

    await call.answer("Настраиваю автосборку APK...")
    wait_msg = await call.message.answer(
        f"⏳ Настраиваю CI/CD в репозитории <code>{owner}/{repo_name}</code>:\n"
        f"1. Записываю секреты в Actions Secrets...\n"
        f"2. Создаю <code>.github/workflows/build-and-deploy.yml</code>..."
    )

    ok, details = await setup_auto_apk_for_repo(owner, repo_name, chat_id)
    res_kb = get_repo_action_result_keyboard(repo_name)
    if ok:
        await wait_msg.edit_text(
            f"✅ <b>Автосборка настроена! Следующий пуш соберет APK</b>\n\n"
            f"• <b>Репозиторий:</b> <code>{owner}/{repo_name}</code>\n"
            f"• <b>Воркфлоу:</b> <code>.github/workflows/build-and-deploy.yml</code>\n"
            f"• <b>Статус секретов:</b> {details}\n\n"
            f"Вы также можете запустить сборку прямо сейчас кнопкой ниже:",
            reply_markup=res_kb
        )
    else:
        await wait_msg.edit_text(
            f"❌ <b>Не удалось настроить автосборку для {owner}/{repo_name}:</b>\n<code>{details}</code>",
            reply_markup=res_kb
        )


@router.callback_query(F.data.startswith("repo_pages:"))
async def callback_repo_pages(call: CallbackQuery):
    repo_name = call.data.split(":", 1)[1]
    chat_id = call.message.chat.id
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")

    if not cfg.get("github_pat"):
        await call.answer("Нужен GitHub токен!", show_alert=True)
        await prompt_for_missing_token(chat_id, pending_action="pages", repo_name=repo_name)
        return

    await call.answer("Включаю GitHub Pages...")
    ok, result_url_or_err = await enable_github_pages_for_repo(owner, repo_name)
    res_kb = get_repo_action_result_keyboard(repo_name)
    if ok:
        await call.message.answer(
            f"🌐 <b>GitHub Pages успешно активирован для <code>{owner}/{repo_name}</code>!</b>\n\n"
            f"🔗 Готовая ссылка на сайт:\n{result_url_or_err}",
            reply_markup=res_kb
        )
    else:
        await call.message.answer(
            f"❌ <b>Не удалось включить GitHub Pages для {owner}/{repo_name}:</b>\n<code>{result_url_or_err}</code>",
            reply_markup=res_kb
        )


@router.callback_query(F.data.startswith("repo_skip:"))
async def callback_repo_skip(call: CallbackQuery):
    repo_name = call.data.split(":", 1)[1]
    await call.answer("Репозиторий пропущен")
    res_kb = get_repo_action_result_keyboard(repo_name)
    try:
        await call.message.edit_text(
            f"⏭ Репозиторий <code>{repo_name}</code> пропущен (добавлен в <code>known_repos.json</code>).",
            reply_markup=res_kb
        )
    except Exception:
        pass


# ---------------------------------------------------------------------
# ПЕРЕХВАТ ОТВЕТА ПОЛЬЗОВАТЕЛЯ ПРИ ИНТЕРАКТИВНОЙ НАСТРОЙКЕ В ЧАТЕ
# ---------------------------------------------------------------------

@router.message(F.document)
async def handle_uploaded_keystore_file(message: Message):
    """Если пользователь прислал файл .jks/.keystore во время настройки — кодируем в Base64 автоматически."""
    state = PENDING_INPUT_STATE.get(message.chat.id)
    if not state or state.get("field") != "keystore_base64":
        return

    doc = message.document
    file_info = await bot.get_file(doc.file_id)
    file_bytes_io = await bot.download_file(file_info.file_path)
    raw_bytes = file_bytes_io.read()
    b64_str = base64.b64encode(raw_bytes).decode("utf-8")

    save_bot_config({"keystore_base64": b64_str})
    PENDING_INPUT_STATE.pop(message.chat.id, None)
    await message.answer(
        f"✅ Файл <code>{doc.file_name}</code> автоматически закодирован в Base64 и сохранен в <code>bot_config.json</code>!",
        reply_markup=get_setup_inline_keyboard()
    )


@router.message(F.text & ~F.text.startswith("/"))
async def handle_interactive_input(message: Message):
    """Принимает токен или секрет, отправленный пользователем в чат один раз, и продолжает отложенное действие."""
    chat_id = message.chat.id
    state = PENDING_INPUT_STATE.get(chat_id)
    if not state:
        return

    field = state.get("field")
    pending_action = state.get("pending_action")
    repo_name = state.get("repo")
    val = message.text.strip()

    if field == "github_pat":
        save_bot_config({"github_pat": val})
        await message.answer(
            "✅ <b>GitHub Token (PAT) сохранен в <code>bot_config.json</code>!</b>",
            reply_markup=get_setup_inline_keyboard() if not pending_action else None
        )
    elif field == "keystore_base64":
        save_bot_config({"keystore_base64": val})
        await message.answer(
            "✅ <b>Keystore Base64 сохранен в <code>bot_config.json</code>!</b>",
            reply_markup=get_setup_inline_keyboard()
        )
    elif field == "keystore_creds":
        parts = val.split()
        if len(parts) >= 3:
            save_bot_config({
                "keystore_password": parts[0],
                "key_alias": parts[1],
                "key_password": parts[2]
            })
            await message.answer(
                "✅ <b>Пароли и Alias ключа сохранены в <code>bot_config.json</code>!</b>",
                reply_markup=get_setup_inline_keyboard()
            )
        else:
            await message.answer(
                "⚠️ Укажите 3 значения через пробел: <code>STORE_PASSWORD KEY_ALIAS KEY_PASSWORD</code>",
                reply_markup=get_back_to_setup_keyboard()
            )
            return
    elif field == "github_owner":
        save_bot_config({"github_owner": val})
        await message.answer(
            f"✅ <b>GitHub логин обновлен на <code>{val}</code>!</b>",
            reply_markup=get_setup_inline_keyboard()
        )

    PENDING_INPUT_STATE.pop(chat_id, None)

    # Если ввод токена был запрошен во время нажатия кнопки на карточке нового репозитория — сразу продолжаем!
    cfg = load_bot_config()
    owner = cfg.get("github_owner", "retrihgtrtyuh-cmd")
    if pending_action in ("apk", "update_wf") and repo_name:
        res_kb = get_repo_action_result_keyboard(repo_name)
        wait_msg = await message.answer(f"⏳ Обновляю workflow и секреты автосборки APK для <code>{owner}/{repo_name}</code>...")
        ok, details = await setup_auto_apk_for_repo(owner, repo_name, chat_id)
        if ok:
            await wait_msg.edit_text(
                f"✅ <b>Workflow в репозитории <code>{owner}/{repo_name}</code> обновлен! Следующий пуш соберет APK</b>\n\n"
                f"• <b>Репозиторий:</b> <code>{owner}/{repo_name}</code>\n"
                f"• <b>Воркфлоу:</b> <code>.github/workflows/build-and-deploy.yml</code> (<code>setup-java@v5</code> + Capacitor)\n"
                f"• <b>Статус секретов:</b> {details}",
                reply_markup=res_kb
            )
        else:
            await wait_msg.edit_text(
                f"❌ <b>Ошибка настройки автосборки:</b>\n<code>{details}</code>",
                reply_markup=res_kb
            )
    elif pending_action == "pages" and repo_name:
        res_kb = get_repo_action_result_keyboard(repo_name)
        ok, url_or_err = await enable_github_pages_for_repo(owner, repo_name)
        if ok:
            await message.answer(
                f"🌐 <b>GitHub Pages активирован для <code>{owner}/{repo_name}</code>!</b>\n"
                f"🔗 Ссылка на сайт: {url_or_err}",
                reply_markup=res_kb
            )
        else:
            await message.answer(
                f"❌ <b>Ошибка GitHub Pages:</b>\n<code>{url_or_err}</code>",
                reply_markup=res_kb
            )


# =====================================================================
# 7. ВЕБ-СЕРВЕР AIOHTTP (GET /, GET /health, POST /api/upload-apk)
# =====================================================================

async def handle_root(request: web.Request) -> web.Response:
    """Корневой маршрут GET / для Render (отвечает 200 OK 'Bot is alive')."""
    return web.Response(text="Bot is alive", status=200, content_type="text/plain")


async def handle_health(request: web.Request) -> web.Response:
    """Проверка здоровья GET /health."""
    cfg = load_bot_config()
    known, _ = load_known_repos()
    return web.json_response({
        "status": "ok",
        "bot": "alive",
        "target_repo": f"{cfg.get('github_owner')}/{cfg.get('github_repo')}",
        "workflow": cfg.get("github_workflow"),
        "known_repos_count": len(known)
    })


async def handle_upload_apk(request: web.Request) -> web.Response:
    """Прием собранного APK от GitHub Actions и рассылка в чаты/канал."""
    cfg = load_bot_config()
    webhook_secret = cfg.get("webhook_secret", "")
    secret_header = request.headers.get("X-Webhook-Secret", "")
    if webhook_secret and not hmac.compare_digest(secret_header, webhook_secret):
        return web.json_response({"error": "Forbidden"}, status=403)

    reader = await request.multipart()
    apk_bytes = None
    apk_filename = ""
    meta = {
        "repo_name": cfg.get("github_repo", "xianxia-sect-maneger"),
        "commit_sha": "unknown",
        "commit_msg": "Без описания",
        "author": "unknown",
        "branch": cfg.get("github_branch", "main"),
        "build_number": "1"
    }

    async for field in reader:
        if field.name == "apk_file":
            apk_filename = field.filename or ""
            apk_bytes = await field.read()
        elif field.name in meta:
            meta[field.name] = (await field.read(decode=True)).decode("utf-8", errors="replace")

    if not apk_bytes:
        return web.json_response({"error": "apk_file missing"}, status=400)

    short_sha = meta["commit_sha"][:7]
    repo_name = meta["repo_name"] or cfg.get("github_repo", "xianxia-sect-maneger")
    build_num = meta["build_number"]
    if not apk_filename or apk_filename == "app-release.apk":
        apk_filename = f"{repo_name}_v{build_num}.apk"

    caption = (
        f"📦 <b>Сборка APK готова!</b>\n\n"
        f"• <b>Проект:</b> <code>{repo_name}</code>\n"
        f"• <b>Номер сборки:</b> <code>#{build_num}</code> (<code>v{build_num}</code>)\n"
        f"• <b>Файл:</b> <code>{apk_filename}</code>\n"
        f"• <b>Ветка:</b> <code>{meta['branch']}</code>\n"
        f"• <b>Автор:</b> {meta['author']}\n"
        f"• <b>Коммит:</b> <code>{short_sha}</code> — {meta['commit_msg']}"
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
    app.router.add_get("/", handle_root)
    app.router.add_get("/health", handle_health)
    app.router.add_post("/api/upload-apk", handle_upload_apk)

    runner = web.AppRunner(app)
    await runner.setup()
    site = web.TCPSite(runner, host="0.0.0.0", port=PORT)
    await site.start()
    logger.info(f"Веб-сервер запущен на порту {PORT} (GET /, GET /health, POST /api/upload-apk)")

    # Запускаем фоновую задачу отслеживания новых репозиториев каждые 3 минуты
    watcher_task = asyncio.create_task(background_repo_watcher())

    try:
        logger.info("Сброс активного вебхука...")
        await bot.delete_webhook(drop_pending_updates=True)

        cfg = load_bot_config()
        logger.info(f"Запуск Long Polling (профиль: {cfg.get('github_owner')})...")
        await dp.start_polling(
            bot,
            allowed_updates=["message", "channel_post", "callback_query"]
        )
    finally:
        watcher_task.cancel()
        await runner.cleanup()
        await bot.session.close()


if __name__ == "__main__":
    asyncio.run(main())
