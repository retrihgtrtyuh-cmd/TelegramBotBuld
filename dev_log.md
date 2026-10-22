# Журнал разработки (Dev Log) — Mobile Game CI/CD & Telegram Automation

Дата инициализации: 2026-10-22
Статус инфраструктуры: Активен (GitHub Actions + Python Aiogram 3.x Webhook Server)

---

## Архитектура проекта

```text
project-root/
├── .github/
│   └── workflows/
│       └── android_build.yml   # CI/CD пайплайн: tar.gz бэкап, подпись .jks, сборка APK, отправка
├── app/                        # Исходный код мобильной игры (Android / Gradle)
├── bot/
│   ├── main.py                 # Telegram-бот (aiogram 3 + aiohttp веб-сервер для Render/Railway/VPS)
│   ├── requirements.txt        # Зависимости Python
│   └── Dockerfile              # Контейнеризация для деплоя на Render / Railway
├── .env                        # Локальные переменные окружения (в .gitignore)
├── .env.example                # Шаблон переменных окружения
└── dev_log.md                  # Фиксация прогресса разработки и истории сборок
```

---

## Хронология изменений и сборок

### [2026-10-22] Этап 1: Проектирование сквозного CI/CD концепта
- **Задача**: Автоматизировать резервное копирование исходного кода (`.tar.gz`), релизную сборку подписанного `.apk` (`assembleRelease` с восстановлением `.jks` из Base64) и доставку билдов в Telegram.
- **Решение**:
  1. Настроен триггер `push` (ветка `main`), `repository_dispatch` (тип `build_apk`) и `workflow_dispatch`.
  2. Реализован Python-бот на `aiogram 3.x` со встроенным `aiohttp` HTTP-сервером:
     - Команда `/build [ветка] [комментарий]` вызывает GitHub API `/repos/{owner}/{repo}/dispatches`.
     - Команда `/log` читает последние записи из `dev_log.md` или добавляет новую запись (`/log <текст>`).
     - Эндпоинт `POST /api/upload-apk` принимает собранный `.apk` и метаданные коммита от GitHub Actions (или позволяет GitHub Actions отправлять файл напрямую через `sendDocument`).
     - Эндпоинт `GET /health` поддерживает жизнеспособность контейнера на Render / Railway.
- **Статус**: Выполнено.
