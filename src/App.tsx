import React, { useState, useEffect } from 'react';
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
  Key,
  ChevronDown,
  Globe,
  Smartphone,
  ArrowLeft,
  Home
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

interface DevLogEntry {
  date: string;
  tag: string;
  content: string;
}

interface ActionsRunStatus {
  label: 'Success' | 'Failed' | 'In Progress' | 'No Runs';
  runNumber?: number;
  workflowName?: string;
  branch?: string;
  sha?: string;
  updatedAt?: string;
  htmlUrl?: string;
  source: 'github_api' | 'cached';
  loading?: boolean;
}

interface RepositoryProject {
  id: string;
  owner: string;
  repo: string;
  description: string;
  defaultBranch: string;
  workflowFile: string;
  dispatchEvent: string;
  autoApkEnabled: boolean;
  githubPagesEnabled: boolean;
  pagesUrl: string;
  builds: BuildRun[];
  messages: ChatMessage[];
  devLogEntries: DevLogEntry[];
}

export default function App() {
  // Multi-Repository State (all 3 tracked repositories + ability to add more)
  const [repositories, setRepositories] = useState<RepositoryProject[]>([
    {
      id: 'xianxia-sect-maneger',
      owner: 'retrihgtrtyuh-cmd',
      repo: 'xianxia-sect-maneger',
      description: 'Основной проект: симулятор управления сектой культиваторов (Android Gradle)',
      defaultBranch: 'main',
      workflowFile: 'build-apk.yml',
      dispatchEvent: 'build_apk',
      autoApkEnabled: true,
      githubPagesEnabled: true,
      pagesUrl: 'https://retrihgtrtyuh-cmd.github.io/xianxia-sect-maneger/',
      builds: [
        {
          id: 42,
          sha: '8f4d2a1',
          branch: 'main',
          author: 'retrihgtrtyuh-cmd',
          message: 'feat(combat): оптимизация рендера частиц и подпись релизного APK',
          trigger: 'workflow_dispatch',
          status: 'completed',
          apkName: 'xianxia-sect-maneger_v42_8f4d2a1.apk',
          apkSize: '64.8 MB',
          backupName: 'backup_8f4d2a1_20261026_1420.tar.gz',
          timestamp: '2026-10-26 14:20 UTC',
        },
        {
          id: 41,
          sha: '3c9e11b',
          branch: 'main',
          author: 'retrihgtrtyuh-cmd',
          message: 'fix(audio): устранен краш при смене сцены в главном меню',
          trigger: 'push',
          status: 'completed',
          apkName: 'xianxia-sect-maneger_v41_3c9e11b.apk',
          apkSize: '64.5 MB',
          backupName: 'backup_3c9e11b_20261026_1105.tar.gz',
          timestamp: '2026-10-26 11:05 UTC',
        },
      ],
      messages: [
        {
          id: 'm1',
          sender: 'user',
          text: '/start',
          time: '14:18',
        },
        {
          id: 'm2',
          sender: 'bot',
          text: `CI/CD Панель управления сборкой APK и репозиториями\n• Профиль GitHub: retrihgtrtyuh-cmd\n• Активный проект: xianxia-sect-maneger\n• Всего репозиториев в базе: 3 (автопроверка каждые 3 мин)\n• Текущий Chat ID: -1003962969725 (Доступ разрешен)`,
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
          text: `✅ Сборка успешно инициирована в GitHub Actions!\n• Репозиторий: retrihgtrtyuh-cmd/xianxia-sect-maneger\n• Воркфлоу: build-apk.yml\n• Ветка: main`,
          time: '14:19',
        },
        {
          id: 'm5',
          sender: 'bot',
          text: `📦 Сборка APK готова!\n• Проект: xianxia-sect-maneger\n• Номер сборки: #42 (v42)\n• Коммит: 8f4d2a1 — feat(combat): оптимизация рендера частиц и подпись релизного APK`,
          time: '14:20',
          attachment: {
            filename: 'xianxia-sect-maneger_v42_8f4d2a1.apk',
            size: '64.8 MB',
            backupArchive: 'backup_8f4d2a1_20261026_1420.tar.gz',
            sha: '8f4d2a1',
            branch: 'main',
            author: 'retrihgtrtyuh-cmd',
          },
        },
      ],
      devLogEntries: [
        {
          date: '2026-10-26 14:20 UTC',
          tag: 'CI/CD Release #42',
          content: '[xianxia-sect-maneger] Сборка #42 (8f4d2a1): xianxia-sect-maneger_v42_8f4d2a1.apk и архив backup_8f4d2a1_20261026_1420.tar.gz доставлены в Telegram.',
        },
        {
          date: '2026-10-26 14:19 UTC',
          tag: 'Telegram Trigger',
          content: '[xianxia-sect-maneger] Запущена сборка APK по команде /build из Telegram, ветка main.',
        },
      ],
    },
    {
      id: 'cultivation-idle-rpg',
      owner: 'retrihgtrtyuh-cmd',
      repo: 'cultivation-idle-rpg',
      description: 'Второй репозиторий: мобильная Idle-RPG с автосборкой через build-and-deploy.yml',
      defaultBranch: 'main',
      workflowFile: 'build-and-deploy.yml',
      dispatchEvent: 'build_apk',
      autoApkEnabled: true,
      githubPagesEnabled: false,
      pagesUrl: 'https://retrihgtrtyuh-cmd.github.io/cultivation-idle-rpg/',
      builds: [
        {
          id: 12,
          sha: '9a1c4f0',
          branch: 'main',
          author: 'retrihgtrtyuh-cmd',
          message: 'feat(inventory): система артефактов и баланс духовных камней',
          trigger: 'push',
          status: 'completed',
          apkName: 'cultivation-idle-rpg_v12_9a1c4f0.apk',
          apkSize: '48.2 MB',
          backupName: 'backup_9a1c4f0_20261026_1210.tar.gz',
          timestamp: '2026-10-26 12:10 UTC',
        },
      ],
      messages: [
        {
          id: 'c1',
          sender: 'bot',
          text: `🛠 Управление репозиторием: retrihgtrtyuh-cmd/cultivation-idle-rpg\n• Статус: Автосборка APK подключена (.github/workflows/build-and-deploy.yml)\n• Секреты записаны: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, KEYSTORE_BASE64`,
          time: '12:08',
        },
        {
          id: 'c2',
          sender: 'bot',
          text: `📦 Сборка APK готова!\n• Проект: cultivation-idle-rpg\n• Номер сборки: #12 (v12)\n• Коммит: 9a1c4f0 — feat(inventory): система артефактов и баланс духовных камней`,
          time: '12:10',
          attachment: {
            filename: 'cultivation-idle-rpg_v12_9a1c4f0.apk',
            size: '48.2 MB',
            backupArchive: 'backup_9a1c4f0_20261026_1210.tar.gz',
            sha: '9a1c4f0',
            branch: 'main',
            author: 'retrihgtrtyuh-cmd',
          },
        },
      ],
      devLogEntries: [
        {
          date: '2026-10-26 12:10 UTC',
          tag: 'CI/CD Release #12',
          content: '[cultivation-idle-rpg] Автоматическая сборка при push в main: доставлен файл cultivation-idle-rpg_v12_9a1c4f0.apk.',
        },
        {
          date: '2026-10-26 12:05 UTC',
          tag: '1-Click Auto APK',
          content: '[cultivation-idle-rpg] Через Telegram-бота автоматически создан .github/workflows/build-and-deploy.yml и прописаны Actions Secrets.',
        },
      ],
    },
    {
      id: 'sect-alchemy-sim',
      owner: 'retrihgtrtyuh-cmd',
      repo: 'sect-alchemy-sim',
      description: 'Третий отслеживаемый репозиторий: симулятор алхимии (готов к настройке CI/CD в 1 клик)',
      defaultBranch: 'main',
      workflowFile: 'build-and-deploy.yml',
      dispatchEvent: 'build_apk',
      autoApkEnabled: false,
      githubPagesEnabled: false,
      pagesUrl: 'https://retrihgtrtyuh-cmd.github.io/sect-alchemy-sim/',
      builds: [],
      messages: [
        {
          id: 's1',
          sender: 'bot',
          text: `🆕 Обнаружен репозиторий в профиле: retrihgtrtyuh-cmd/sect-alchemy-sim\n• Ветка по умолчанию: main\n• Автосборка APK: еще не подключена\n\nНажмите «📱 Подключить автосборку APK» или выберите действие в панели проекта, чтобы создать .github/workflows/build-and-deploy.yml и прописать секреты в 1 клик!`,
          time: '14:30',
        },
      ],
      devLogEntries: [
        {
          date: '2026-10-26 14:30 UTC',
          tag: 'Repo Watcher',
          content: '[sect-alchemy-sim] Репозиторий добавлен в known_repos.json. Ожидает подключения автосборки APK в 1 клик.',
        },
      ],
    },
    {
      id: 'Planer-lesson',
      owner: 'retrihgtrtyuh-cmd',
      repo: 'Planer-lesson',
      description: 'Веб-проект из AI Studio (Node.js / Vite / React / HTML) с автоматической оберткой в Android через Capacitor',
      defaultBranch: 'main',
      workflowFile: 'build-and-deploy.yml',
      dispatchEvent: 'build_apk',
      autoApkEnabled: true,
      githubPagesEnabled: true,
      pagesUrl: 'https://retrihgtrtyuh-cmd.github.io/Planer-lesson/',
      builds: [
        {
          id: 2,
          sha: '7b3e91a',
          branch: 'main',
          author: 'retrihgtrtyuh-cmd',
          message: 'ci: update build-and-deploy.yml (setup-java@v5 without gradle cache + Capacitor Android wrapper)',
          trigger: 'workflow_dispatch',
          status: 'completed',
          apkName: 'Planer-lesson_v2.apk',
          apkSize: '18.6 MB',
          backupName: 'backup_7b3e91a_20261027_1130.tar.gz',
          timestamp: '2026-10-27 11:30 UTC',
        },
      ],
      messages: [
        {
          id: 'p1',
          sender: 'bot',
          text: `🔄 Workflow в репозитории retrihgtrtyuh-cmd/Planer-lesson успешно обновлен!\n• Файл: .github/workflows/build-and-deploy.yml\n• Set up JDK 17: actions/setup-java@v5 (без cache: 'gradle')\n• Авто-обертка веб-проекта: npm install && npm run build → capacitor.config.json → npx cap add android → cd android && local.properties (sdk.dir=/usr/local/lib/android/sdk) && ./gradlew assembleRelease -x lint\n• Формат APK: Planer-lesson_v{run_number}.apk`,
          time: '11:29',
        },
        {
          id: 'p2',
          sender: 'bot',
          text: `📦 Сборка APK готова!\n• Проект: Planer-lesson\n• Номер сборки: #2 (v2)\n• Файл: Planer-lesson_v2.apk\n• Коммит: 7b3e91a — ci: update build-and-deploy.yml (setup-java@v5 + Capacitor)`,
          time: '11:30',
          attachment: {
            filename: 'Planer-lesson_v2.apk',
            size: '18.6 MB',
            backupArchive: 'backup_7b3e91a_20261027_1130.tar.gz',
            sha: '7b3e91a',
            branch: 'main',
            author: 'retrihgtrtyuh-cmd',
          },
        },
      ],
      devLogEntries: [
        {
          date: '2026-10-27 11:30 UTC',
          tag: 'Workflow Updated',
          content: '[Planer-lesson] Перезаписан .github/workflows/build-and-deploy.yml: actions/setup-java@v5 без cache: gradle, авто-обертка Capacitor (npx cap add android) и сборка Planer-lesson_v2.apk.',
        },
      ],
    },
  ]);

  const [selectedRepoId, setSelectedRepoId] = useState<string>('xianxia-sect-maneger');
  const [repoHistory, setRepoHistory] = useState<string[]>([]);
  const [repoSettingsView, setRepoSettingsView] = useState<'overview' | 'params' | 'all_repos'>('overview');
  const [repoSettingsHistory, setRepoSettingsHistory] = useState<Array<'overview' | 'params' | 'all_repos'>>([]);
  const [isRepoDropdownOpen, setIsRepoDropdownOpen] = useState(false);
  const [newRepoNameInput, setNewRepoNameInput] = useState('');

  const currentRepo = repositories.find((r) => r.id === selectedRepoId) || repositories[0];
  const builds = currentRepo.builds;
  const messages = currentRepo.messages;
  const devLogEntries = currentRepo.devLogEntries;

  // Interactive Configuration State synced with selected repository
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

  // Helper to update the active repository's state
  const updateCurrentRepo = (updater: (repo: RepositoryProject) => RepositoryProject) => {
    setRepositories((prev) =>
      prev.map((r) => (r.id === currentRepo.id ? updater(r) : r))
    );
  };

  // Switch active repository from top bar selector or bot simulator
  const handleSelectRepository = (repoId: string, skipHistory = false) => {
    const target = repositories.find((r) => r.id === repoId);
    if (!target) return;
    if (!skipHistory && target.id !== selectedRepoId) {
      setRepoHistory((prev) => [...prev, selectedRepoId]);
    }
    setSelectedRepoId(target.id);
    setConfig((prev) => ({
      ...prev,
      githubOwner: target.owner,
      githubRepo: target.repo,
      defaultBranch: target.defaultBranch,
      dispatchEvent: target.dispatchEvent,
    }));
    setIsRepoDropdownOpen(false);
    setIsBuilding(false);
    setPipelineStep(0);
  };

  // Navigate inside Repository Settings sub-screens with history
  const handleNavigateRepoSettings = (nextView: 'overview' | 'params' | 'all_repos') => {
    if (nextView === repoSettingsView) return;
    setRepoSettingsHistory((prev) => [...prev, repoSettingsView]);
    setRepoSettingsView(nextView);
  };

  // Back button handler for Repository Settings
  const handleRepoSettingsBack = () => {
    if (repoSettingsHistory.length > 0) {
      const prevView = repoSettingsHistory[repoSettingsHistory.length - 1];
      setRepoSettingsHistory((prev) => prev.slice(0, -1));
      setRepoSettingsView(prevView);
      return;
    }
    if (repoHistory.length > 0) {
      const prevRepoId = repoHistory[repoHistory.length - 1];
      setRepoHistory((prev) => prev.slice(0, -1));
      handleSelectRepository(prevRepoId, true);
      return;
    }
    if (selectedRepoId !== repositories[0].id) {
      handleSelectRepository(repositories[0].id, true);
    } else {
      setRepoSettingsView('overview');
    }
  };

  // Add a new repository to the selector list
  const handleAddRepository = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = newRepoNameInput.trim().replace(/^\/+|\/+$/g, '');
    if (!cleanName) return;
    const existing = repositories.find((r) => r.repo.toLowerCase() === cleanName.toLowerCase());
    if (existing) {
      handleSelectRepository(existing.id);
      setNewRepoNameInput('');
      return;
    }
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    const newProj: RepositoryProject = {
      id: cleanName,
      owner: config.githubOwner,
      repo: cleanName,
      description: 'Подключенный репозиторий профиля GitHub',
      defaultBranch: 'main',
      workflowFile: 'build-and-deploy.yml',
      dispatchEvent: 'build_apk',
      autoApkEnabled: false,
      githubPagesEnabled: false,
      pagesUrl: `https://${config.githubOwner}.github.io/${cleanName}/`,
      builds: [],
      messages: [
        {
          id: `init-${Date.now()}`,
          sender: 'bot',
          text: `🆕 Обнаружен новый репозиторий на GitHub: ${config.githubOwner}/${cleanName}\nВыберите действие для настройки в 1 клик:\n• [ 📱 Подключить автосборку APK ]\n• [ 🌐 Включить GitHub Pages ]`,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
        },
      ],
      devLogEntries: [
        {
          date: ts,
          tag: 'New Repo Tracked',
          content: `[${cleanName}] Репозиторий обнаружен фоновой задачей и добавлен в known_repos.json.`,
        },
      ],
    };
    setRepositories((prev) => [...prev, newProj]);
    setSelectedRepoId(newProj.id);
    setConfig((prev) => ({
      ...prev,
      githubRepo: newProj.repo,
      defaultBranch: newProj.defaultBranch,
    }));
    setNewRepoNameInput('');
    setIsRepoDropdownOpen(false);
  };

  // 1-Click Auto APK CI/CD setup for current repository
  const handleEnableAutoApkForCurrentRepo = () => {
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    updateCurrentRepo((r) => ({
      ...r,
      autoApkEnabled: true,
      workflowFile: r.workflowFile || 'build-and-deploy.yml',
      messages: [
        ...r.messages,
        {
          id: `apk-setup-${Date.now()}`,
          sender: 'bot',
          text: `✅ Автосборка настроена! Следующий пуш соберет APK\n\n• Репозиторий: ${r.owner}/${r.repo}\n• Воркфлоу: .github/workflows/${r.workflowFile}\n• Секреты записаны в Actions Secrets: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, KEYSTORE_BASE64`,
          time: nowTime,
        },
      ],
      devLogEntries: [
        {
          date: ts,
          tag: '1-Click CI/CD Setup',
          content: `[${r.repo}] Автоматически создан .github/workflows/${r.workflowFile} и зашифрованы секреты Actions Secrets через PyNaCl.`,
        },
        ...r.devLogEntries,
      ],
    }));
  };

  // 1-Click Overwrite/Update workflow in current repository (e.g., Planer-lesson)
  const handleUpdateWorkflowInCurrentRepo = () => {
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    updateCurrentRepo((r) => ({
      ...r,
      autoApkEnabled: true,
      workflowFile: 'build-and-deploy.yml',
      messages: [
        ...r.messages,
        {
          id: `wf-upd-${Date.now()}`,
          sender: 'bot',
          text: `✅ Workflow и секреты в репозитории ${r.owner}/${r.repo} успешно обновлены!\n\n• GitHub Secrets (/repos/${r.owner}/${r.repo}/actions/secrets/*): записаны TELEGRAM_BOT_TOKEN, BOT_TOKEN, TELEGRAM_CHAT_ID (${config.chatId}), CHAT_ID\n• Файл: .github/workflows/build-and-deploy.yml (перезаписан через GitHub API)\n• Шаг JDK 17: actions/setup-java@v5 (удален cache: 'gradle')\n• Авто-обертка AI Studio Web → Android: npm install → npm run build → capacitor.config.json → npx cap add android → cd android → local.properties (sdk.dir=/usr/local/lib/android/sdk) → ./gradlew assembleRelease -x lint\n• Переименование и доставка APK: ${r.repo}_v{github.run_number}.apk → Telegram (${config.chatId})`,
          time: nowTime,
        },
      ],
      devLogEntries: [
        {
          date: ts,
          tag: 'Workflow Overwritten',
          content: `[${r.repo}] Перезаписан .github/workflows/build-and-deploy.yml (setup-java@v5 без cache: 'gradle' + обертка Capacitor для веб-проектов AI Studio).`,
        },
        ...r.devLogEntries,
      ],
    }));
    setRepoActionsStatus((prev) => ({
      ...prev,
      [currentRepo.id]: {
        ...getEffectiveActionsStatus(currentRepo),
        label: 'Success',
        workflowName: 'build-and-deploy.yml',
        updatedAt: ts,
      },
    }));
  };

  // 1-Click Enable GitHub Pages for current repository
  const handleEnablePagesForCurrentRepo = () => {
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    const siteUrl = `https://${currentRepo.owner}.github.io/${currentRepo.repo}/`;
    updateCurrentRepo((r) => ({
      ...r,
      githubPagesEnabled: true,
      pagesUrl: siteUrl,
      messages: [
        ...r.messages,
        {
          id: `pages-setup-${Date.now()}`,
          sender: 'bot',
          text: `🌐 GitHub Pages успешно активирован для ${r.owner}/${r.repo}!\n🔗 Готовая ссылка на сайт: ${siteUrl}`,
          time: nowTime,
        },
      ],
      devLogEntries: [
        {
          date: ts,
          tag: 'GitHub Pages Active',
          content: `[${r.repo}] Включен GitHub Pages для ветки ${r.defaultBranch}: ${siteUrl}`,
        },
        ...r.devLogEntries,
      ],
    }));
  };

  // Modal State for GitHub Token Replacement
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const [tempTokenInput, setTempTokenInput] = useState('github_pat_11ABCDEFG_sample_token_here');
  const [showTokenText, setShowTokenText] = useState(false);
  const [tokenSaveSuccess, setTokenSaveSuccess] = useState(false);

  // Active Navigation Section & History
  type AppTab = 'code' | 'simulator' | 'secrets' | 'devlog' | 'concept';
  const [activeTab, setActiveTabState] = useState<AppTab>('code');
  const [tabHistory, setTabHistory] = useState<AppTab[]>([]);

  const setActiveTab = (nextTab: AppTab) => {
    if (nextTab === activeTab) return;
    setTabHistory((prev) => [...prev, activeTab]);
    setActiveTabState(nextTab);
  };

  const handleGlobalTabBack = () => {
    if (tabHistory.length > 0) {
      const prevTab = tabHistory[tabHistory.length - 1];
      setTabHistory((prev) => prev.slice(0, -1));
      setActiveTabState(prevTab);
    } else {
      setActiveTabState('code');
    }
  };

  const [selectedFile, setSelectedFile] = useState<'build-apk' | 'bot' | 'requirements' | 'render' | 'workflow' | 'env' | 'dockerfile' | 'tree'>('build-apk');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Simulator State & Interactive Menu Navigation History
  type SimScreen = 'main' | 'repos' | 'repo_card' | 'setup' | 'status' | 'log';
  const [simScreen, setSimScreen] = useState<SimScreen>('main');
  const [simScreenHistory, setSimScreenHistory] = useState<SimScreen[]>([]);
  const [chatInput, setChatInput] = useState('/build main Хотфикс шейдеров и баланса');
  const [isBuilding, setIsBuilding] = useState(false);
  const [pipelineStep, setPipelineStep] = useState<number>(0);
  const [newLogText, setNewLogText] = useState('');

  const navigateSimScreen = (nextScreen: SimScreen) => {
    if (nextScreen === simScreen) return;
    setSimScreenHistory((prev) => [...prev, simScreen]);
    setSimScreen(nextScreen);
  };

  const handleSimBack = () => {
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    let targetScreen: SimScreen = 'main';
    if (simScreenHistory.length > 0) {
      targetScreen = simScreenHistory[simScreenHistory.length - 1];
      setSimScreenHistory((prev) => prev.slice(0, -1));
    } else {
      targetScreen = 'main';
    }
    setSimScreen(targetScreen);

    const screenTitles: Record<SimScreen, string> = {
      main: `🏠 Главное меню управления CI/CD\nАктивный проект: ${currentRepo.owner}/${currentRepo.repo}`,
      repos: `📂 Список отслеживаемых репозиториев (${repositories.length} шт.)`,
      repo_card: `🛠 Карточка репозитория: ${currentRepo.owner}/${currentRepo.repo}`,
      setup: `⚙️ Настройки токена и секретов GitHub API`,
      status: `📊 Статус сборок проекта ${currentRepo.owner}/${currentRepo.repo}`,
      log: `📖 Журнал dev_log.md (${currentRepo.repo})`,
    };

    updateCurrentRepo((r) => ({
      ...r,
      messages: [
        ...r.messages,
        {
          id: `sim-back-${Date.now()}`,
          sender: 'bot',
          text: `⬅️ Возврат на предыдущий экран:\n${screenTitles[targetScreen]}`,
          time: nowTime,
        },
      ],
    }));
  };

  const handleSimMainMenu = () => {
    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    setSimScreenHistory([]);
    setSimScreen('main');
    updateCurrentRepo((r) => ({
      ...r,
      messages: [
        ...r.messages,
        {
          id: `sim-home-${Date.now()}`,
          sender: 'bot',
          text: `🏠 Главное меню CI/CD Бота\n• Профиль GitHub: ${r.owner}\n• Активный проект: ${r.repo}\n• Воркфлоу: ${r.workflowFile}\n• Отслеживаемых репозиториев: ${repositories.length}`,
          time: nowTime,
        },
      ],
    }));
  };

  // GitHub Actions Live Status State (fetched via GitHub REST API /repos/{owner}/{repo}/actions/runs)
  const [repoActionsStatus, setRepoActionsStatus] = useState<Record<string, ActionsRunStatus>>({
    'xianxia-sect-maneger': {
      label: 'Success',
      runNumber: 42,
      workflowName: 'Build & Send APK to Telegram',
      branch: 'main',
      sha: '8f4d2a1',
      updatedAt: '2026-10-26 14:20 UTC',
      htmlUrl: 'https://github.com/retrihgtrtyuh-cmd/xianxia-sect-maneger/actions',
      source: 'cached',
    },
    'cultivation-idle-rpg': {
      label: 'Success',
      runNumber: 12,
      workflowName: 'Auto Build Android APK & Send to Telegram',
      branch: 'main',
      sha: '9a1c4f0',
      updatedAt: '2026-10-26 12:10 UTC',
      htmlUrl: 'https://github.com/retrihgtrtyuh-cmd/cultivation-idle-rpg/actions',
      source: 'cached',
    },
    'sect-alchemy-sim': {
      label: 'No Runs',
      workflowName: 'build-and-deploy.yml',
      branch: 'main',
      htmlUrl: 'https://github.com/retrihgtrtyuh-cmd/sect-alchemy-sim/actions',
      source: 'cached',
    },
  });

  // Fetch latest GitHub Actions workflow run for a repository via GitHub REST API
  const fetchRepoActionsStatusFromGitHub = async (repoItem: RepositoryProject) => {
    setRepoActionsStatus((prev) => ({
      ...prev,
      [repoItem.id]: {
        ...(prev[repoItem.id] || {
          label: repoItem.builds.length > 0 ? 'Success' : 'No Runs',
          source: 'cached',
        }),
        loading: true,
      },
    }));

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github+json',
      };
      const cleanToken = config.githubToken.trim();
      if (
        cleanToken &&
        !cleanToken.includes('sample_token_here') &&
        !cleanToken.includes('ВАШ_')
      ) {
        headers.Authorization = `Bearer ${cleanToken}`;
      }

      const response = await fetch(
        `https://api.github.com/repos/${encodeURIComponent(repoItem.owner)}/${encodeURIComponent(repoItem.repo)}/actions/runs?per_page=1`,
        { headers }
      );

      if (response.ok) {
        const data = await response.json();
        const latestRun = Array.isArray(data?.workflow_runs) ? data.workflow_runs[0] : null;

        if (latestRun) {
          let label: ActionsRunStatus['label'] = 'Success';
          if (
            latestRun.status === 'in_progress' ||
            latestRun.status === 'queued' ||
            latestRun.status === 'waiting' ||
            latestRun.status === 'requested'
          ) {
            label = 'In Progress';
          } else if (latestRun.conclusion === 'success') {
            label = 'Success';
          } else if (
            latestRun.conclusion === 'failure' ||
            latestRun.conclusion === 'cancelled' ||
            latestRun.conclusion === 'timed_out' ||
            latestRun.conclusion === 'action_required'
          ) {
            label = 'Failed';
          }

          setRepoActionsStatus((prev) => ({
            ...prev,
            [repoItem.id]: {
              label,
              runNumber: latestRun.run_number,
              workflowName: latestRun.name || repoItem.workflowFile,
              branch: latestRun.head_branch || repoItem.defaultBranch,
              sha: typeof latestRun.head_sha === 'string' ? latestRun.head_sha.slice(0, 7) : undefined,
              updatedAt: latestRun.updated_at
                ? new Date(latestRun.updated_at).toISOString().slice(0, 16).replace('T', ' ') + ' UTC'
                : undefined,
              htmlUrl:
                latestRun.html_url ||
                `https://github.com/${repoItem.owner}/${repoItem.repo}/actions`,
              source: 'github_api',
              loading: false,
            },
          }));
          return;
        }
      }
    } catch {
      // Fallback to local build state if offline or rate-limited
    }

    const latestLocal = repoItem.builds[0];
    setRepoActionsStatus((prev) => ({
      ...prev,
      [repoItem.id]: {
        label:
          prev[repoItem.id]?.label && prev[repoItem.id]?.label !== 'No Runs'
            ? prev[repoItem.id].label
            : latestLocal
            ? latestLocal.status === 'building'
              ? 'In Progress'
              : 'Success'
            : 'No Runs',
        runNumber: latestLocal?.id ?? prev[repoItem.id]?.runNumber,
        workflowName: repoItem.workflowFile,
        branch: latestLocal?.branch ?? repoItem.defaultBranch,
        sha: latestLocal?.sha ?? prev[repoItem.id]?.sha,
        updatedAt: latestLocal?.timestamp ?? prev[repoItem.id]?.updatedAt,
        htmlUrl: `https://github.com/${repoItem.owner}/${repoItem.repo}/actions`,
        source: prev[repoItem.id]?.source || 'cached',
        loading: false,
      },
    }));
  };

  // Query GitHub Actions API on mount and when switching repositories
  useEffect(() => {
    repositories.forEach((r) => {
      fetchRepoActionsStatusFromGitHub(r);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRepoId]);

  const getEffectiveActionsStatus = (repoItem: RepositoryProject): ActionsRunStatus => {
    if (isBuilding && repoItem.id === currentRepo.id) {
      return {
        label: 'In Progress',
        runNumber: (repoItem.builds[0]?.id || 0) + 1,
        workflowName: repoItem.workflowFile,
        branch: repoItem.defaultBranch,
        sha: 'building',
        updatedAt: 'Выполняется сейчас...',
        htmlUrl: `https://github.com/${repoItem.owner}/${repoItem.repo}/actions`,
        source: 'github_api',
        loading: true,
      };
    }
    return (
      repoActionsStatus[repoItem.id] || {
        label: repoItem.builds.length > 0 ? 'Success' : 'No Runs',
        runNumber: repoItem.builds[0]?.id,
        workflowName: repoItem.workflowFile,
        branch: repoItem.defaultBranch,
        sha: repoItem.builds[0]?.sha,
        updatedAt: repoItem.builds[0]?.timestamp,
        htmlUrl: `https://github.com/${repoItem.owner}/${repoItem.repo}/actions`,
        source: 'cached',
      }
    );
  };

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


from nacl import encoding, public
import base64


def encrypt_github_secret(public_key_b64: str, secret_value: str) -> str:
    """Шифрует секрет публичным ключом репозитория (LibSodium / PyNaCl)."""
    pk = public.PublicKey(public_key_b64.encode("utf-8"), encoding.Base64Encoder())
    sealed_box = public.SealedBox(pk)
    encrypted = sealed_box.encrypt(str(secret_value).encode("utf-8"))
    return base64.b64encode(encrypted).decode("utf-8")


async def set_repo_actions_secret(
    session: aiohttp.ClientSession,
    owner: str,
    repo: str,
    token: str,
    secret_name: str,
    secret_value: str,
    cached_pk: dict = None
) -> tuple[bool, str]:
    """Записывает секрет через GitHub API: PUT /repos/{owner}/{repo}/actions/secrets/{secret_name}."""
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {token}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/2.0"
    }
    if cached_pk and "key_id" in cached_pk and "key" in cached_pk:
        pk_data = cached_pk
    else:
        pk_url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/public-key"
        async with session.get(pk_url, headers=headers) as resp:
            if resp.status != 200:
                return False, f"Ошибка получения public-key (HTTP {resp.status})"
            pk_data = await resp.json()

    encrypted_value = encrypt_github_secret(pk_data["key"], secret_value)
    secret_url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/{secret_name}"
    payload = {"encrypted_value": encrypted_value, "key_id": pk_data["key_id"]}
    async with session.put(secret_url, json=payload, headers=headers) as resp:
        if resp.status in (201, 204):
            return True, "OK"
        err = await resp.text()
        return False, f"HTTP {resp.status}: {err}"


async def ensure_repo_telegram_secrets(
    session: aiohttp.ClientSession,
    owner: str,
    repo: str,
    chat_id: int | str = None
) -> tuple[bool, str]:
    """Автоматически записывает TELEGRAM_BOT_TOKEN/BOT_TOKEN и TELEGRAM_CHAT_ID/CHAT_ID в GitHub Actions Secrets."""
    if not GITHUB_TOKEN:
        return False, "В .env не задан GITHUB_PAT"
    target_chat_id = str(
        chat_id
        or os.getenv("TELEGRAM_CHAT_ID")
        or os.getenv("CHAT_ID")
        or next(iter(AUTHORIZED_CHAT_IDS), "-1003962969725")
    )
    secrets_to_set = {
        "TELEGRAM_BOT_TOKEN": TELEGRAM_BOT_TOKEN,
        "BOT_TOKEN": TELEGRAM_BOT_TOKEN,
        "TELEGRAM_CHAT_ID": target_chat_id,
        "CHAT_ID": target_chat_id,
    }
    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/2.0"
    }
    pk_url = f"https://api.github.com/repos/{owner}/{repo}/actions/secrets/public-key"
    async with session.get(pk_url, headers=headers) as pk_resp:
        if pk_resp.status != 200:
            return False, f"Ошибка получения public-key (HTTP {pk_resp.status})"
        cached_pk = await pk_resp.json()

    for s_name, s_val in secrets_to_set.items():
        if not s_val:
            continue
        ok, msg = await set_repo_actions_secret(
            session, owner, repo, GITHUB_TOKEN, s_name, s_val, cached_pk=cached_pk
        )
        if not ok:
            return False, msg
    return True, f"Секреты {', '.join(secrets_to_set.keys())} записаны (chat_id={target_chat_id})"


async def setup_auto_apk_for_repo(owner: str, repo: str, chat_id: int) -> tuple[bool, str]:
    """Настраивает новый репозиторий: прописывает секреты через PyNaCl в GitHub Actions Secrets и создает workflow."""
    async with aiohttp.ClientSession() as session:
        ok, msg = await ensure_repo_telegram_secrets(session, owner, repo, chat_id=chat_id)
        if not ok:
            return False, msg
    return True, msg


async def trigger_github_workflow(branch: str, notes: str, initiated_by: str, chat_id: int = None) -> tuple[bool, str]:
    if not GITHUB_TOKEN:
        return False, "В .env не задан GITHUB_PAT"

    headers = {
        "Accept": "application/vnd.github+json",
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "Telegram-APK-Build-Bot/1.0"
    }

    # 1. Перед запуском сборки гарантированно записываем секреты TELEGRAM_BOT_TOKEN и TELEGRAM_CHAT_ID
    url = f"https://api.github.com/repos/{GITHUB_OWNER}/{GITHUB_REPO}/actions/workflows/{GITHUB_WORKFLOW}/dispatches"
    payload = {"ref": branch, "inputs": {"notes": f"{notes} ({initiated_by})"}}

    async with aiohttp.ClientSession() as session:
        await ensure_repo_telegram_secrets(session, GITHUB_OWNER, GITHUB_REPO, chat_id=chat_id)

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

    ok, info = await trigger_github_workflow(
        branch=branch,
        notes=notes,
        initiated_by=author,
        chat_id=message.chat.id
    )
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
    apk_filename = ""
    meta = {
        "repo_name": GITHUB_REPO,
        "commit_sha": "unknown",
        "commit_msg": "Без описания",
        "author": "unknown",
        "branch": GITHUB_DEFAULT_BRANCH,
        "build_number": "1",
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
    repo_name = meta["repo_name"] or GITHUB_REPO
    build_num = meta["build_number"]
    if not apk_filename or apk_filename == "app-release.apk":
        apk_filename = f"{repo_name}_v{build_num}_{short_sha}.apk"

    caption = (
        f"📦 <b>Сборка APK готова!</b>\\n\\n"
        f"• <b>Проект:</b> <code>{repo_name}</code>\\n"
        f"• <b>Номер сборки:</b> <code>#{build_num}</code> (<code>v{build_num}</code>)\\n"
        f"• <b>Файл:</b> <code>{apk_filename}</code>\\n"
        f"• <b>Ветка:</b> <code>{meta['branch']}</code>\\n"
        f"• <b>Коммит:</b> <code>{short_sha}</code> — {meta['commit_msg']}"
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

      - name: Set up JDK 17 (actions/setup-java@v5 без cache: 'gradle')
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Set up Node.js 20
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
          yes | sudo \${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null || true
          echo "y" | sudo \${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --install "platforms;android-34" "build-tools;34.0.0" "platform-tools"

      - name: Авто-обертка веб-проекта AI Studio в Android через Capacitor (если нет папки android и gradlew)
        run: |
          if [ -d "android" ] || [ -f "gradlew" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
            echo "Обнаружен Android/Gradle проект — собираем напрямую."
          else
            echo "Папка android и gradlew не найдены (веб-проект из AI Studio). Сборка бандла и инициализация Capacitor..."
            if [ ! -f "package.json" ]; then
              npm init -y
            else
              npm install --legacy-peer-deps || npm install
            fi
            WEB_DIR="www_bundle"
            if node -e "const p=require('./package.json'); process.exit(p.scripts && p.scripts.build ? 0 : 1)" 2>/dev/null; then
              npm run build
            fi
            if [ -d "dist" ] && [ -f "dist/index.html" ]; then WEB_DIR="dist";
            elif [ -d "build" ] && [ -f "build/index.html" ]; then WEB_DIR="build";
            else
              mkdir -p "\$WEB_DIR"
              for item in index.html *.html *.js *.css assets public src; do
                [ -e "\$item" ] && cp -r "\$item" "\$WEB_DIR/" 2>/dev/null || true
              done
            fi
            npm install @capacitor/core@^6.0.0 @capacitor/cli@^6.0.0 @capacitor/android@^6.0.0 --no-save --legacy-peer-deps || npm install @capacitor/core@^6.0.0 @capacitor/cli@^6.0.0 @capacitor/android@^6.0.0 --no-save
            RAW_NAME=\$(echo "\${{ github.event.repository.name }}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
            SAFE_PKG=\$(echo "\${RAW_NAME:-app}" | sed 's/^[0-9]/app&/')
            cat <<EOF > capacitor.config.json
          {
            "appId": "com.aistudio.\${SAFE_PKG}",
            "appName": "\${{ github.event.repository.name }}",
            "webDir": "\${WEB_DIR}"
          }
          EOF
            npx cap add android
            npx cap sync android
            echo "sdk.dir=/usr/local/lib/android/sdk" > android/local.properties
          fi

      - name: 2. Восстановление или генерация ключа подписи (.jks)
        id: keystore
        env:
          KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: |
          if [ -n "\$KEYSTORE_BASE64" ] && [ "\$KEYSTORE_BASE64" != "-" ] && [ -n "\$KEYSTORE_PASSWORD" ]; then
            echo "\$KEYSTORE_BASE64" | base64 --decode > "\$RUNNER_TEMP/release-key.jks"
            echo "store_file=\$RUNNER_TEMP/release-key.jks" >> \$GITHUB_OUTPUT
            echo "store_password=\$KEYSTORE_PASSWORD" >> \$GITHUB_OUTPUT
            echo "key_alias=\$KEY_ALIAS" >> \$GITHUB_OUTPUT
            echo "key_password=\$KEY_PASSWORD" >> \$GITHUB_OUTPUT
          else
            keytool -genkeypair -v -keystore "\$RUNNER_TEMP/release-key.jks" -alias release_key -keyalg RSA -keysize 2048 -validity 10000 -storepass android123 -keypass android123 -dname "CN=AIStudio, OU=Mobile, O=AIStudio, L=City, S=State, C=US"
            echo "store_file=\$RUNNER_TEMP/release-key.jks" >> \$GITHUB_OUTPUT
            echo "store_password=android123" >> \$GITHUB_OUTPUT
            echo "key_alias=release_key" >> \$GITHUB_OUTPUT
            echo "key_password=android123" >> \$GITHUB_OUTPUT
          fi

      - name: Build Release APK with Gradle
        env:
          ANDROID_SDK_ROOT: /usr/local/lib/android/sdk
          ANDROID_HOME: /usr/local/lib/android/sdk
        run: |
          if [ -d "android" ]; then
            cd android
          fi
          echo "sdk.dir=/usr/local/lib/android/sdk" > local.properties
          chmod +x gradlew
          ./gradlew assembleRelease -x lint -x lintVitalRelease \\
            -Pandroid.injected.signing.store.file="\${{ steps.keystore.outputs.store_file }}" \\
            -Pandroid.injected.signing.store.password="\${{ steps.keystore.outputs.store_password }}" \\
            -Pandroid.injected.signing.key.alias="\${{ steps.keystore.outputs.key_alias }}" \\
            -Pandroid.injected.signing.key.password="\${{ steps.keystore.outputs.key_password }}" || ./gradlew assembleDebug -x lint

      - name: Извлечение информации о коммите и переименование APK ({имя_репозитория}_v{github.run_number}.apk)
        id: meta
        run: |
          COMMIT_SHA=\$(git rev-parse HEAD)
          SHORT_SHA=\$(git rev-parse --short HEAD)
          COMMIT_AUTHOR=\$(git log -1 --pretty=format:'%an (%ae)')
          COMMIT_MSG=\$(git log -1 --pretty=format:'%s')
          ORIG_APK=\$(find . -path "*/build/outputs/apk/*" -name "*.apk" ! -name "*-unsigned.apk" | head -n 1)
          # Переименование под формат {имя_репозитория}_v{github.run_number}.apk
          RENAMED_APK="\${{ github.event.repository.name }}_v\${{ github.run_number }}.apk"
          cp "\${ORIG_APK}" "./\${RENAMED_APK}"
          echo "commit_sha=\${COMMIT_SHA}" >> \$GITHUB_OUTPUT
          echo "short_sha=\${SHORT_SHA}" >> \$GITHUB_OUTPUT
          echo "author=\${COMMIT_AUTHOR}" >> \$GITHUB_OUTPUT
          echo "commit_msg=\${COMMIT_MSG}" >> \$GITHUB_OUTPUT
          echo "apk_path=./\${RENAMED_APK}" >> \$GITHUB_OUTPUT
          echo "apk_filename=\${RENAMED_APK}" >> \$GITHUB_OUTPUT

      - name: 3A. Отправка APK на эндпоинт бота (Render / Railway / VPS)
        if: \${{ secrets.BOT_WEBHOOK_URL != '' }}
        run: |
          RENAMED_APK="\${{ github.event.repository.name }}_v\${{ github.run_number }}.apk"
          curl -sS -X POST "\${{ secrets.BOT_WEBHOOK_URL }}/api/upload-apk" \\
            -H "X-Webhook-Secret: \${{ secrets.WEBHOOK_SECRET }}" \\
            -F "apk_file=@./\${RENAMED_APK}" \\
            -F "repo_name=\${{ github.event.repository.name }}" \\
            -F "commit_sha=\${{ steps.meta.outputs.commit_sha }}" \\
            -F "commit_msg=\${{ steps.meta.outputs.commit_msg }}" \\
            -F "author=\${{ steps.meta.outputs.author }}" \\
            -F "branch=\${{ github.event.client_payload.branch || github.ref_name }}" \\
            -F "build_number=\${{ github.run_number }}" \\
            -F "backup_archive=\${{ steps.backup.outputs.archive_name }}"

      - name: 3B. Прямая доставка в Telegram через Bot API (sendDocument)
        if: \${{ secrets.BOT_WEBHOOK_URL == '' }}
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          BOT_TOKEN: \${{ secrets.BOT_TOKEN }}
          TELEGRAM_CHAT_ID: \${{ secrets.TELEGRAM_CHAT_ID }}
          CHAT_ID: \${{ secrets.CHAT_ID }}
        run: |
          TOKEN="\${TELEGRAM_BOT_TOKEN:-\$BOT_TOKEN}"
          TARGET_CHAT_ID="\${TELEGRAM_CHAT_ID:-\$CHAT_ID}"
          RENAMED_APK="\${{ github.event.repository.name }}_v\${{ github.run_number }}.apk"
          CAPTION="📦 <b>Сборка APK готова!</b>%0A• <b>Проект:</b> <code>\${{ github.event.repository.name }}</code>%0A• <b>Номер сборки:</b> <code>#\${{ github.run_number }}</code> (<code>v\${{ github.run_number }}</code>)%0A• <b>Файл:</b> <code>\${RENAMED_APK}</code>%0A• <b>Ветка:</b> <code>\${{ github.event.client_payload.branch || github.ref_name }}</code>%0A• <b>Автор:</b> \${{ steps.meta.outputs.author }}%0A• <b>Коммит:</b> <code>\${{ steps.meta.outputs.short_sha }}</code> — \${{ steps.meta.outputs.commit_msg }}%0A• <b>Бэкап:</b> <code>\${{ steps.backup.outputs.archive_name }}</code>"
          curl -sS -X POST "https://api.telegram.org/bot\${TOKEN}/sendDocument" \\
            -F "chat_id=\${TARGET_CHAT_ID}" \\
            -F "parse_mode=HTML" \\
            -F "caption=\${CAPTION}" \\
            -F "document=@./\${RENAMED_APK}"

      - name: Удаление ключа подписи (.jks) и временного APK с раннера
        if: always()
        run: rm -f app/release-key.jks ./*_v*_*.apk`;

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

  // Interactive Simulation of Telegram Bot + GitHub Actions Pipeline (per selected repository)
  const handleSendCommand = (cmdText?: string) => {
    const input = (cmdText ?? chatInput).trim();
    if (!input || isBuilding) return;

    const activeRepoId = currentRepo.id;
    const activeOwner = currentRepo.owner;
    const activeRepoName = currentRepo.repo;
    const activeWorkflow = currentRepo.workflowFile;

    const nowTime = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: input,
      time: nowTime,
    };

    const appendMessagesToRepo = (repoId: string, newMsgs: ChatMessage[]) => {
      setRepositories((prev) =>
        prev.map((r) => (r.id === repoId ? { ...r, messages: [...r.messages, ...newMsgs] } : r))
      );
    };

    appendMessagesToRepo(activeRepoId, [userMsg]);
    if (!cmdText) setChatInput('');

    if (input.startsWith('/build')) {
      const parts = input.replace('/build', '').trim().split(/\s+/);
      const branch = parts[0] || currentRepo.defaultBranch;
      const comment = parts.slice(1).join(' ') || `Сборка APK для ${activeRepoName}`;

      const botAck: ChatMessage = {
        id: `b-ack-${Date.now()}`,
        sender: 'bot',
        text: `⏳ Запускаю воркфлоу ${activeWorkflow} в репозитории ${activeOwner}/${activeRepoName} (ветка: "${branch}")...\n✅ HTTP 204 No Content — пайплайн запущен!`,
        time: nowTime,
      };
      appendMessagesToRepo(activeRepoId, [botAck]);

      // Start simulated CI/CD pipeline steps
      setIsBuilding(true);
      setPipelineStep(1);

      setTimeout(() => setPipelineStep(2), 700);
      setTimeout(() => setPipelineStep(3), 1500);
      setTimeout(() => setPipelineStep(4), 2300);
      setTimeout(() => {
        const nextBuildNum = (currentRepo.builds[0]?.id || 0) + 1;
        const randomSha = Math.random().toString(16).substring(2, 9);
        const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
        const apkFile = `${activeRepoName}_v${nextBuildNum}_${randomSha}.apk`;
        const backupFile = `backup_${randomSha}_${new Date().toISOString().slice(0, 10).replace(/-/g, '')}.tar.gz`;

        const newBuild: BuildRun = {
          id: nextBuildNum,
          sha: randomSha,
          branch,
          author: activeOwner,
          message: comment,
          trigger: 'workflow_dispatch',
          status: 'completed',
          apkName: apkFile,
          apkSize: '58.4 MB',
          backupName: backupFile,
          timestamp: ts,
        };

        const botApkMsg: ChatMessage = {
          id: `b-apk-${Date.now()}`,
          sender: 'bot',
          text: `📦 Сборка APK готова!\n• Проект: ${activeRepoName}\n• Номер сборки: #${nextBuildNum} (v${nextBuildNum})\n• Коммит: ${randomSha} — ${comment}`,
          time: new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }),
          attachment: {
            filename: apkFile,
            size: '58.4 MB',
            backupArchive: backupFile,
            sha: randomSha,
            branch,
            author: activeOwner,
          },
        };

        setRepositories((prev) =>
          prev.map((r) =>
            r.id === activeRepoId
              ? {
                  ...r,
                  autoApkEnabled: true,
                  builds: [newBuild, ...r.builds],
                  messages: [...r.messages, botApkMsg],
                  devLogEntries: [
                    {
                      date: ts,
                      tag: `CI/CD Release #${nextBuildNum}`,
                      content: `[${activeRepoName}] Сборка #${nextBuildNum} (${randomSha}, ветка ${branch}): ${apkFile} + бэкап ${backupFile} доставлены через бот. Комментарий: ${comment}`,
                    },
                    ...r.devLogEntries,
                  ],
                }
              : r
          )
        );
        setIsBuilding(false);
        setPipelineStep(0);
      }, 3100);
    } else if (input.startsWith('/repos')) {
      navigateSimScreen('repos');
      const repoListText = repositories
        .map((r, i) => `${i + 1}. ${r.id === activeRepoId ? '⭐' : '📦'} ${r.owner}/${r.repo} (${r.autoApkEnabled ? 'CI/CD активен' : 'ожидает настройки'})`)
        .join('\n');
      appendMessagesToRepo(activeRepoId, [
        {
          id: `b-repos-${Date.now()}`,
          sender: 'bot',
          text: `📂 Ваши отслеживаемые репозитории (${repositories.length} шт.):\n${repoListText}\n\nВыберите репозиторий в меню ниже для настройки автосборки APK и GitHub Pages или нажмите «⬅️ Назад».`,
          time: nowTime,
        },
      ]);
    } else if (
      input === '/back' ||
      input.toLowerCase() === 'назад' ||
      input === '⬅️ Назад'
    ) {
      handleSimBack();
    } else if (input === '/start' || input === '/menu' || input === '🏠 Главное меню') {
      handleSimMainMenu();
    } else if (input.startsWith('/setup') || input.startsWith('/token')) {
      navigateSimScreen('setup');
      appendMessagesToRepo(activeRepoId, [
        {
          id: `b-setup-${Date.now()}`,
          sender: 'bot',
          text: `⚙️ Интерактивная настройка бота (/setup):\n• GITHUB_OWNER: ${activeOwner}\n• GITHUB_TOKEN: ✅ Сохранен\n• Активный проект: ${activeOwner}/${activeRepoName}\n\nИспользуйте кнопки меню ниже или нажмите «⬅️ Назад» для возврата.`,
          time: nowTime,
        },
      ]);
    } else if (input.startsWith('/status')) {
      navigateSimScreen('status');
      const latest = currentRepo.builds[0];
      appendMessagesToRepo(activeRepoId, [
        {
          id: `b-stat-${Date.now()}`,
          sender: 'bot',
          text: latest
            ? `📊 Статус CI/CD (${activeOwner}/${activeRepoName}):\n• Сборка: #${latest.id} (completed / success)\n• Воркфлоу: ${activeWorkflow}\n• Ветка: ${latest.branch}\n• Коммит: ${latest.sha} — ${latest.message}\n• Артефакт: ${latest.apkName} (${latest.apkSize})`
            : `📊 Репозиторий ${activeOwner}/${activeRepoName}: сборок пока не найдено. Нажмите «Подключить автосборку APK» или вызовите /build.`,
          time: nowTime,
        },
      ]);
    } else if (input.startsWith('/log')) {
      navigateSimScreen('log');
      const note = input.replace('/log', '').trim();
      if (note) {
        const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
        setRepositories((prev) =>
          prev.map((r) =>
            r.id === activeRepoId
              ? {
                  ...r,
                  devLogEntries: [{ date: ts, tag: 'Dev Log Запись', content: `[${activeRepoName}] ${note}` }, ...r.devLogEntries],
                  messages: [
                    ...r.messages,
                    {
                      id: `b-log-${Date.now()}`,
                      sender: 'bot',
                      text: `📝 Запись для ${activeRepoName} добавлена в корневой dev_log.md:\n"${note}"`,
                      time: nowTime,
                    },
                  ],
                }
              : r
          )
        );
      } else {
        const topLogs = currentRepo.devLogEntries
          .slice(0, 3)
          .map((e) => `[${e.date}] ${e.content}`)
          .join('\n\n');
        appendMessagesToRepo(activeRepoId, [
          {
            id: `b-log-${Date.now()}`,
            sender: 'bot',
            text: `📖 Последние записи dev_log.md (${activeRepoName}):\n\n${topLogs || 'Записей пока нет.'}`,
            time: nowTime,
          },
        ]);
      }
    } else {
      appendMessagesToRepo(activeRepoId, [
        {
          id: `b-help-${Date.now()}`,
          sender: 'bot',
          text: `Активный проект: ${activeOwner}/${activeRepoName}.\nКоманды: /start (главное меню), /back (назад), /build [ветка] [комментарий], /repos (список всех проектов), /status, /log [текст].`,
          time: nowTime,
        },
      ]);
    }
  };

  const handleAddDevLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLogText.trim()) return;
    const ts = new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC';
    updateCurrentRepo((r) => ({
      ...r,
      devLogEntries: [
        {
          date: ts,
          tag: 'Ручная запись',
          content: `[${r.repo}] ${newLogText.trim()}`,
        },
        ...r.devLogEntries,
      ],
    }));
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

      # 2. Настройка рабочей среды Java (JDK 17, actions/setup-java@v5 БЕЗ cache: 'gradle')
      - name: Set up JDK 17
        uses: actions/setup-java@v5
        with:
          distribution: 'temurin'
          java-version: '17'

      # 3. Настройка Node.js (для веб-проектов AI Studio и Capacitor)
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # 4. Настройка Android SDK (без стороннего экшена android-actions/setup-android)
      - name: Set up Android SDK
        env:
          ANDROID_SDK_ROOT: /usr/local/lib/android/sdk
          ANDROID_HOME: /usr/local/lib/android/sdk
        run: |
          echo "ANDROID_SDK_ROOT=/usr/local/lib/android/sdk" >> $GITHUB_ENV
          echo "ANDROID_HOME=/usr/local/lib/android/sdk" >> $GITHUB_ENV
          yes | sudo \${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --licenses > /dev/null || true
          echo "y" | sudo \${ANDROID_SDK_ROOT}/cmdline-tools/latest/bin/sdkmanager --install "platforms;android-34" "build-tools;34.0.0" "platform-tools"

      # 5. Автоматическая обертка веб-проекта в Android (если папки android и gradlew еще нет)
      - name: Prepare Web Project & Wrap with Capacitor
        run: |
          if [ -d "android" ] || [ -f "gradlew" ] || [ -f "build.gradle" ] || [ -f "build.gradle.kts" ]; then
            echo "Обнаружен нативный Android/Gradle проект. Сборка напрямую через Gradle."
          else
            echo "Папка android и gradlew не найдены — это веб-проект из AI Studio. Сборка веб-бандла и обертка в Capacitor..."
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
            else
              mkdir -p "\$WEB_DIR"
              for item in index.html *.html *.js *.css *.json *.png *.svg *.ico assets public src styles; do
                if [ -e "\$item" ] && [ "\$item" != "package.json" ] && [ "\$item" != "package-lock.json" ]; then
                  cp -r "\$item" "\$WEB_DIR/" 2>/dev/null || true
                fi
              done
            fi

            npm install @capacitor/core@^6.0.0 @capacitor/cli@^6.0.0 @capacitor/android@^6.0.0 --no-save --legacy-peer-deps || npm install @capacitor/core@^6.0.0 @capacitor/cli@^6.0.0 @capacitor/android@^6.0.0 --no-save

            RAW_NAME=\$(echo "\${{ github.event.repository.name }}" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]//g')
            SAFE_PKG=\$(echo "\${RAW_NAME:-app}" | sed 's/^[0-9]/app&/')
            APP_ID="com.aistudio.\${SAFE_PKG}"

            cat <<EOF > capacitor.config.json
          {
            "appId": "\${APP_ID}",
            "appName": "\${{ github.event.repository.name }}",
            "webDir": "\${WEB_DIR}"
          }
          EOF

            npx cap add android
            npx cap sync android
            echo "sdk.dir=/usr/local/lib/android/sdk" > android/local.properties
          fi

      # 6. Подготовка Keystore (.jks) для подписи assembleRelease
      - name: Prepare Signing Keystore (.jks)
        id: keystore
        env:
          KEYSTORE_BASE64: \${{ secrets.KEYSTORE_BASE64 }}
          KEYSTORE_PASSWORD: \${{ secrets.KEYSTORE_PASSWORD }}
          KEY_ALIAS: \${{ secrets.KEY_ALIAS }}
          KEY_PASSWORD: \${{ secrets.KEY_PASSWORD }}
        run: |
          if [ -n "\$KEYSTORE_BASE64" ] && [ "\$KEYSTORE_BASE64" != "-" ] && [ -n "\$KEYSTORE_PASSWORD" ]; then
            echo "\$KEYSTORE_BASE64" | base64 --decode > "\$RUNNER_TEMP/release-key.jks"
            echo "store_file=\$RUNNER_TEMP/release-key.jks" >> \$GITHUB_OUTPUT
            echo "store_password=\$KEYSTORE_PASSWORD" >> \$GITHUB_OUTPUT
            echo "key_alias=\$KEY_ALIAS" >> \$GITHUB_OUTPUT
            echo "key_password=\$KEY_PASSWORD" >> \$GITHUB_OUTPUT
          else
            keytool -genkeypair -v \\
              -keystore "\$RUNNER_TEMP/release-key.jks" \\
              -alias release_key \\
              -keyalg RSA -keysize 2048 -validity 10000 \\
              -storepass android123 -keypass android123 \\
              -dname "CN=AIStudio, OU=Mobile, O=AIStudio, L=City, S=State, C=US"
            echo "store_file=\$RUNNER_TEMP/release-key.jks" >> \$GITHUB_OUTPUT
            echo "store_password=android123" >> \$GITHUB_OUTPUT
            echo "key_alias=release_key" >> \$GITHUB_OUTPUT
            echo "key_password=android123" >> \$GITHUB_OUTPUT
          fi

      # 7. Переход в созданную папку android, прописывание sdk.dir в local.properties и сборка ./gradlew assembleRelease -x lint
      - name: Build Release APK with Gradle
        env:
          ANDROID_SDK_ROOT: /usr/local/lib/android/sdk
          ANDROID_HOME: /usr/local/lib/android/sdk
        run: |
          if [ -d "android" ]; then
            cd android
          fi
          echo "sdk.dir=/usr/local/lib/android/sdk" > local.properties
          chmod +x gradlew
          ./gradlew assembleRelease -x lint -x lintVitalRelease \\
            -Pandroid.injected.signing.store.file="\${{ steps.keystore.outputs.store_file }}" \\
            -Pandroid.injected.signing.store.password="\${{ steps.keystore.outputs.store_password }}" \\
            -Pandroid.injected.signing.key.alias="\${{ steps.keystore.outputs.key_alias }}" \\
            -Pandroid.injected.signing.key.password="\${{ steps.keystore.outputs.key_password }}" || ./gradlew assembleDebug -x lint

      # 8. Поиск собранного файла APK и переименование в формат {имя_репозитория}_v{github.run_number}.apk
      - name: Locate & Rename compiled APK
        id: locate_apk
        run: |
          APK_FILE=\$(find . -path "*/build/outputs/apk/*" -name "*.apk" ! -name "*-unsigned.apk" | head -n 1)
          if [ -z "\$APK_FILE" ]; then
            APK_FILE=\$(find . -path "*/build/outputs/apk/*" -name "*.apk" | head -n 1)
          fi
          if [ -z "\$APK_FILE" ]; then
            echo "::error::APK файл не найден в директориях build/outputs/apk/"
            exit 1
          fi
          echo "Found APK: \$APK_FILE"
          
          SHORT_SHA=\$(git rev-parse --short HEAD)
          COMMIT_MSG=\$(git log -1 --pretty=format:'%s')
          AUTHOR=\$(git log -1 --pretty=format:'%an')
          
          # Автоматическое переименование под формат {имя_репозитория}_v{github.run_number}.apk
          RENAMED_APK="\${{ github.event.repository.name }}_v\${{ github.run_number }}.apk"
          cp "\$APK_FILE" "./\$RENAMED_APK"
          
          echo "apk_path=./\$RENAMED_APK" >> \$GITHUB_OUTPUT
          echo "apk_filename=\$RENAMED_APK" >> \$GITHUB_OUTPUT
          echo "short_sha=\$SHORT_SHA" >> \$GITHUB_OUTPUT
          echo "commit_msg=\$COMMIT_MSG" >> \$GITHUB_OUTPUT
          echo "author=\$AUTHOR" >> \$GITHUB_OUTPUT

      # 9. Отправка переименованного APK в Telegram-чат через Telegram Bot API (sendDocument)
      - name: Send APK to Telegram
        if: success()
        env:
          TELEGRAM_BOT_TOKEN: \${{ secrets.TELEGRAM_BOT_TOKEN }}
          BOT_TOKEN: \${{ secrets.BOT_TOKEN }}
          TELEGRAM_CHAT_ID: \${{ secrets.TELEGRAM_CHAT_ID }}
          CHAT_ID: \${{ secrets.CHAT_ID }}
          REPO_NAME: \${{ github.event.repository.name }}
          RUN_NUM: \${{ github.run_number }}
          APK_PATH: \${{ steps.locate_apk.outputs.apk_path }}
          SHORT_SHA: \${{ steps.locate_apk.outputs.short_sha }}
          COMMIT_MSG: \${{ steps.locate_apk.outputs.commit_msg }}
          AUTHOR: \${{ steps.locate_apk.outputs.author }}
          NOTES: \${{ github.event.inputs.notes || 'Сборка через GitHub Actions' }}
        run: |
          TOKEN="\${TELEGRAM_BOT_TOKEN:-\$BOT_TOKEN}"
          TARGET_CHAT_ID="\${TELEGRAM_CHAT_ID:-\$CHAT_ID}"
          if [ -z "\$TOKEN" ]; then
            echo "::error::Секрет TELEGRAM_BOT_TOKEN (или BOT_TOKEN) не задан в GitHub Actions Secrets!"
            exit 1
          fi
          if [ -z "\$TARGET_CHAT_ID" ]; then
            echo "::error::Секрет TELEGRAM_CHAT_ID (или CHAT_ID) не задан в GitHub Actions Secrets!"
            exit 1
          fi

          RENAMED_APK="\${REPO_NAME}_v\${RUN_NUM}.apk"
          if [ "\$APK_PATH" != "./\$RENAMED_APK" ] && [ -f "\$APK_PATH" ]; then
            cp "\$APK_PATH" "./\$RENAMED_APK"
          fi

          CAPTION="📦 <b>Сборка APK готова!</b>%0A%0A• <b>Проект:</b> <code>\${REPO_NAME}</code>%0A• <b>Номер сборки:</b> <code>#\${RUN_NUM}</code> (<code>v\${RUN_NUM}</code>)%0A• <b>Файл:</b> <code>\${RENAMED_APK}</code>%0A• <b>Ветка:</b> <code>\${{ github.ref_name }}</code>%0A• <b>Коммит:</b> <code>\${SHORT_SHA}</code> — \${COMMIT_MSG}%0A• <b>Автор:</b> \${AUTHOR}%0A• <b>Примечание:</b> \${NOTES}"

          RESPONSE=\$(curl -s -w "\\n%{http_code}" -X POST "https://api.telegram.org/bot\${TOKEN}/sendDocument" \\
            -F "chat_id=\${TARGET_CHAT_ID}" \\
            -F "parse_mode=HTML" \\
            -F "caption=\${CAPTION}" \\
            -F "document=@./\${RENAMED_APK}")

          HTTP_CODE=\$(echo "\$RESPONSE" | tail -n 1)
          BODY=\$(echo "\$RESPONSE" | sed '\$d')

          echo "Telegram API Response HTTP code: \$HTTP_CODE"
          if [ "\$HTTP_CODE" -ne 200 ]; then
            echo "::error::Не удалось отправить файл в Telegram (chat_id=\${TARGET_CHAT_ID}). Ответ: \$BODY"
            exit 1
          else
            echo "APK (\${RENAMED_APK}) успешно отправлен в Telegram!"
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
      {/* Top Bar with Multi-Repository Selector */}
      <header className="flex items-center justify-between gap-4 px-6 py-3.5 border-b border-slate-800/80 bg-[#0B0F17]/95 sticky top-0 z-30">
        <div className="flex items-center gap-4 min-w-0">
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

          <span className="text-slate-700 hidden sm:inline" aria-hidden="true">/</span>

          {/* Repository Switcher Dropdown in Top Header */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsRepoDropdownOpen((prev) => !prev)}
              className="px-3 py-1.5 text-xs font-mono font-medium text-slate-100 bg-[#131C2E] hover:bg-slate-800 border border-slate-700/80 rounded-lg transition-colors flex items-center gap-2 cursor-pointer"
              title="Переключить активный репозиторий"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span className="truncate max-w-[200px] sm:max-w-[260px]">
                {currentRepo.owner}/{currentRepo.repo}
              </span>
              <span className="text-[11px] font-sans text-slate-400 hidden sm:inline">
                ({currentRepo.autoApkEnabled ? currentRepo.workflowFile : 'не настроен'})
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {isRepoDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-[#111827] border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between">
                  <span className="text-xs font-semibold text-white">
                    Отслеживаемые репозитории ({repositories.length})
                  </span>
                  <span className="text-[11px] font-mono text-slate-400">known_repos.json</span>
                </div>

                <div className="divide-y divide-slate-800/80 max-h-72 overflow-y-auto">
                  {repositories.map((repoItem) => {
                    const isSelected = repoItem.id === currentRepo.id;
                    const itemStatus = getEffectiveActionsStatus(repoItem);
                    return (
                      <button
                        key={repoItem.id}
                        type="button"
                        onClick={() => handleSelectRepository(repoItem.id)}
                        className={`w-full text-left px-4 py-3 transition-colors flex items-start justify-between gap-3 cursor-pointer ${
                          isSelected ? 'bg-sky-500/15' : 'hover:bg-slate-800/60'
                        }`}
                      >
                        <div className="min-w-0 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-semibold text-white truncate">
                              {repoItem.owner}/{repoItem.repo}
                            </span>
                            <span
                              className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono font-semibold rounded border ${
                                itemStatus.label === 'Success'
                                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                  : itemStatus.label === 'Failed'
                                  ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                  : itemStatus.label === 'In Progress'
                                  ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                  : 'bg-slate-800 text-slate-400 border-slate-700'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  itemStatus.label === 'Success'
                                    ? 'bg-emerald-400'
                                    : itemStatus.label === 'Failed'
                                    ? 'bg-rose-400'
                                    : itemStatus.label === 'In Progress'
                                    ? 'bg-amber-400 animate-pulse'
                                    : 'bg-slate-500'
                                }`}
                              />
                              {itemStatus.label}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 line-clamp-1">{repoItem.description}</p>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono">
                            <span>{repoItem.workflowFile}</span>
                            <span aria-hidden="true">·</span>
                            <span>Сборок: {repoItem.builds.length}</span>
                            <span aria-hidden="true">·</span>
                            <span className={repoItem.autoApkEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                              {repoItem.autoApkEnabled ? 'CI/CD активен' : 'Ожидает настройки'}
                            </span>
                          </div>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />}
                      </button>
                    );
                  })}
                </div>

                <form
                  onSubmit={handleAddRepository}
                  className="p-3 bg-[#0B0F17] border-t border-slate-800 flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={newRepoNameInput}
                    onChange={(e) => setNewRepoNameInput(e.target.value)}
                    placeholder="Имя нового репозитория..."
                    className="flex-1 px-2.5 py-1.5 text-xs font-mono bg-[#111827] border border-slate-700 rounded-md text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 text-xs font-semibold bg-sky-400 text-slate-950 hover:bg-sky-300 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    + Добавить
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('code')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'code' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Код и Конфигурация
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'simulator' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Симулятор ({currentRepo.repo})
          </button>
          <button
            onClick={() => setActiveTab('secrets')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'secrets' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            .env и Keystore Base64
          </button>
          <button
            onClick={() => setActiveTab('devlog')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'devlog' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Журнал dev_log.md ({devLogEntries.length})
          </button>
          <button
            onClick={() => setActiveTab('concept')}
            className={`hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 border-b-2 cursor-pointer ${
              activeTab === 'concept' ? 'text-white border-sky-500' : 'border-transparent'
            }`}
          >
            Концепт CI/CD
          </button>
        </nav>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => {
              setTempTokenInput(config.githubToken);
              setTokenSaveSuccess(false);
              setIsTokenModalOpen(true);
            }}
            className="px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-sky-400" />
            <span className="hidden sm:inline">Токен GitHub</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('simulator');
              handleSendCommand(`/build ${currentRepo.defaultBranch} Сборка APK для ${currentRepo.repo}`);
            }}
            className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 rounded-lg hover:bg-sky-300 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            Собрать {currentRepo.repo}
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

          {/* Active Repository Status, Navigation ('Назад' / 'Главное меню') & 1-Click Automation Controls */}
          <div className="pt-5 pb-4 border-b border-slate-800/80 flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* Navigation Bar inside Repository Settings */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleRepoSettingsBack}
                  className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Вернуться к предыдущему экрану настроек или предыдущему репозиторию"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
                  Назад
                  {repoSettingsHistory.length > 0 ? (
                    <span className="text-[11px] text-slate-400">
                      (к пред. экрану)
                    </span>
                  ) : repoHistory.length > 0 ? (
                    <span className="text-[11px] text-slate-400 font-mono">
                      ({repoHistory[repoHistory.length - 1]})
                    </span>
                  ) : null}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setRepoSettingsHistory([]);
                    setRepoSettingsView('overview');
                    setActiveTabState('code');
                  }}
                  className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#0B0F17] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Вернуться в главное меню настроек"
                >
                  <Home className="w-3.5 h-3.5 text-slate-400" />
                  Главное меню
                </button>

                {activeTab !== 'code' && (
                  <button
                    type="button"
                    onClick={handleGlobalTabBack}
                    className="px-3 py-1.5 text-xs font-medium text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Назад к пред. вкладке
                  </button>
                )}

                <div className="h-4 w-[1px] bg-slate-800 mx-1 hidden sm:block" />

                {/* Sub-screen switcher for Repository Settings */}
                <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-lg border border-slate-800">
                  {[
                    { id: 'overview', label: 'Карточка репозитория' },
                    { id: 'params', label: 'Параметры и ветка' },
                    { id: 'all_repos', label: `Все репозитории (${repositories.length})` },
                  ].map((tabItem) => (
                    <button
                      key={tabItem.id}
                      type="button"
                      onClick={() => handleNavigateRepoSettings(tabItem.id as 'overview' | 'params' | 'all_repos')}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                        repoSettingsView === tabItem.id
                          ? 'bg-sky-500/20 text-sky-300'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {tabItem.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={handleUpdateWorkflowInCurrentRepo}
                  className="px-3.5 py-2 text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  title="Перезаписать .github/workflows/build-and-deploy.yml в репозитории (setup-java@v5 без cache: gradle + Capacitor)"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  🔄 Обновить workflow в репозитории
                </button>
                <button
                  type="button"
                  onClick={handleEnableAutoApkForCurrentRepo}
                  className="px-3.5 py-2 text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  {currentRepo.autoApkEnabled ? 'Обновить автосборку APK (CI/CD)' : 'Подключить автосборку APK в 1 клик'}
                </button>
                <button
                  type="button"
                  onClick={handleEnablePagesForCurrentRepo}
                  className="px-3.5 py-2 text-xs font-medium bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/30 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                >
                  <Globe className="w-3.5 h-3.5" />
                  {currentRepo.githubPagesEnabled ? 'GitHub Pages активен' : 'Включить GitHub Pages'}
                </button>
              </div>
            </div>

            {/* Active Repository Card with Live GitHub Actions Status Indicator */}
            {(() => {
              const liveStatus = getEffectiveActionsStatus(currentRepo);
              return (
                <div className="p-4 rounded-xl bg-[#0B0F17] border border-slate-800/90 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2.5 text-xs font-mono">
                      <span className="text-white font-semibold text-sm">
                        {currentRepo.owner}/{currentRepo.repo}
                      </span>

                      {/* GitHub Actions Visual Status Indicator */}
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-semibold rounded-md border ${
                          liveStatus.label === 'Success'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/35'
                            : liveStatus.label === 'Failed'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/35'
                            : liveStatus.label === 'In Progress'
                            ? 'bg-amber-500/15 text-amber-300 border-amber-500/35'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}
                        title="Последний статус GitHub Actions (/repos/{owner}/{repo}/actions/runs)"
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            liveStatus.label === 'Success'
                              ? 'bg-emerald-400'
                              : liveStatus.label === 'Failed'
                              ? 'bg-rose-400'
                              : liveStatus.label === 'In Progress'
                              ? 'bg-amber-400 animate-pulse'
                              : 'bg-slate-400'
                          }`}
                        />
                        GitHub Actions: {liveStatus.label}
                        {liveStatus.runNumber ? ` #${liveStatus.runNumber}` : ''}
                      </span>

                      {liveStatus.sha && (
                        <span className="text-slate-400">
                          SHA: <code className="text-slate-200">{liveStatus.sha}</code>
                        </span>
                      )}
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className="text-slate-400">
                        Воркфлоу: <code className="text-slate-200">.github/workflows/{currentRepo.workflowFile}</code>
                      </span>
                      <span aria-hidden="true" className="text-slate-600">·</span>
                      <span className={currentRepo.autoApkEnabled ? 'text-emerald-400' : 'text-amber-400'}>
                        {currentRepo.autoApkEnabled ? 'Автосборка APK подключена' : 'Автосборка APK не подключена'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{currentRepo.description}</p>
                  </div>

                  {/* Live API Refresh & Quick Status Switcher without opening simulator */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 bg-[#111827] p-1 rounded-lg border border-slate-800">
                      {(['Success', 'In Progress', 'Failed'] as const).map((st) => (
                        <button
                          key={st}
                          type="button"
                          onClick={() =>
                            setRepoActionsStatus((prev) => ({
                              ...prev,
                              [currentRepo.id]: {
                                ...getEffectiveActionsStatus(currentRepo),
                                label: st,
                                updatedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') + ' UTC',
                              },
                            }))
                          }
                          className={`px-2 py-1 text-[11px] font-mono rounded transition-colors cursor-pointer ${
                            liveStatus.label === st
                              ? st === 'Success'
                                ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                                : st === 'Failed'
                                ? 'bg-rose-500/20 text-rose-300 font-semibold'
                                : 'bg-amber-500/20 text-amber-300 font-semibold'
                              : 'text-slate-400 hover:text-slate-200'
                          }`}
                          title={`Установить статус ${st} для проверки индикатора`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      onClick={() => fetchRepoActionsStatusFromGitHub(currentRepo)}
                      disabled={liveStatus.loading}
                      className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      title="Запросить актуальный статус из GitHub Actions API"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-sky-400 ${liveStatus.loading ? 'animate-spin' : ''}`} />
                      Обновить API
                    </button>

                    <a
                      href={liveStatus.htmlUrl || `https://github.com/${currentRepo.owner}/${currentRepo.repo}/actions`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 text-xs font-medium text-slate-300 bg-[#111827] hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors flex items-center gap-1.5"
                    >
                      Actions
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Repository Settings Sub-screens */}
          {repoSettingsView === 'all_repos' ? (
            <div className="pt-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Все подключенные репозитории ({repositories.length})
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => repositories.forEach((r) => fetchRepoActionsStatusFromGitHub(r))}
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
                    Обновить статусы GitHub API
                  </button>
                  <button
                    type="button"
                    onClick={handleRepoSettingsBack}
                    className="px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
                    Назад к карточке проекта
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {repositories.map((r) => {
                  const isCurrent = r.id === currentRepo.id;
                  const cardStatus = getEffectiveActionsStatus(r);
                  return (
                    <div
                      key={r.id}
                      className={`p-4 rounded-xl border transition-colors flex flex-col justify-between gap-3 ${
                        isCurrent
                          ? 'bg-sky-500/10 border-sky-500/40'
                          : 'bg-[#0B0F17] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono font-bold text-white truncate">
                            {r.owner}/{r.repo}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-mono font-semibold rounded border shrink-0 ${
                              cardStatus.label === 'Success'
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : cardStatus.label === 'Failed'
                                ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                                : cardStatus.label === 'In Progress'
                                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                cardStatus.label === 'Success'
                                  ? 'bg-emerald-400'
                                  : cardStatus.label === 'Failed'
                                  ? 'bg-rose-400'
                                  : cardStatus.label === 'In Progress'
                                  ? 'bg-amber-400 animate-pulse'
                                  : 'bg-slate-500'
                              }`}
                            />
                            {cardStatus.label}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 line-clamp-2">{r.description}</p>
                        <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
                          <span>{r.workflowFile}</span>
                          <span>{cardStatus.runNumber ? `Run #${cardStatus.runNumber}` : 'Нет запусков'}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 pt-2 border-t border-slate-800/80">
                        <button
                          type="button"
                          onClick={() => {
                            handleSelectRepository(r.id);
                            handleNavigateRepoSettings('overview');
                          }}
                          className="flex-1 px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors cursor-pointer"
                        >
                          {isCurrent ? 'Открыта карточка' : 'Выбрать проект'}
                        </button>
                        <button
                          type="button"
                          onClick={() => fetchRepoActionsStatusFromGitHub(r)}
                          className="px-2.5 py-1.5 text-xs font-medium bg-slate-800/80 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
                          title="Запросить статус этого репозитория из GitHub API"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${cardStatus.loading ? 'animate-spin text-sky-400' : ''}`} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="pt-5 space-y-3">
              {repoSettingsView === 'params' && (
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-semibold text-slate-300">
                    Редактирование параметров репозитория {currentRepo.owner}/{currentRepo.repo}
                  </span>
                  <button
                    type="button"
                    onClick={handleRepoSettingsBack}
                    className="px-3 py-1 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
                    Назад
                  </button>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Владелец GitHub (GITHUB_OWNER)</label>
                  <input
                    type="text"
                    value={config.githubOwner}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfig({ ...config, githubOwner: val });
                      updateCurrentRepo((r) => ({ ...r, owner: val }));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Выбранный репозиторий (GITHUB_REPO)</label>
                  <select
                    value={currentRepo.id}
                    onChange={(e) => handleSelectRepository(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500 cursor-pointer"
                  >
                    {repositories.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.repo} ({r.autoApkEnabled ? 'CI/CD ON' : 'CI/CD OFF'})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Основная ветка (GITHUB_BRANCH)</label>
                  <input
                    type="text"
                    value={config.defaultBranch}
                    onChange={(e) => {
                      const val = e.target.value;
                      setConfig({ ...config, defaultBranch: val });
                      updateCurrentRepo((r) => ({ ...r, defaultBranch: val }));
                    }}
                    className="w-full px-3 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1.5">Файл Workflow в репо</label>
                  <input
                    type="text"
                    value={currentRepo.workflowFile}
                    onChange={(e) => {
                      const val = e.target.value;
                      updateCurrentRepo((r) => ({ ...r, workflowFile: val }));
                    }}
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
            </div>
          )}
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
            <div className="lg:col-span-6 border border-slate-800 bg-[#111827] rounded-xl flex flex-col h-[700px]">
              {/* Simulator Top Header with 'Назад' & 'Главное меню' */}
              <div className="px-5 py-3.5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold text-white truncate">
                      Telegram Чат — {currentRepo.owner}/{currentRepo.repo}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                    <span>Экран бота: {simScreen === 'main' ? 'Главное меню' : simScreen === 'repos' ? 'Мои репозитории' : simScreen === 'repo_card' ? `Проект ${currentRepo.repo}` : simScreen === 'setup' ? 'Настройки /setup' : simScreen === 'status' ? 'Статус CI/CD' : 'Лог dev_log.md'}</span>
                    <span aria-hidden="true">·</span>
                    <span>{currentRepo.autoApkEnabled ? `CI/CD: ${currentRepo.workflowFile}` : 'CI/CD ожидает подключения'}</span>
                  </div>
                </div>

                {/* Always-visible Back & Main Menu buttons in Simulator Header */}
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={handleSimBack}
                    disabled={isBuilding}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-100 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    title="Вернуться на предыдущий экран меню бота"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 text-sky-400" />
                    ⬅️ Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleSimMainMenu}
                    disabled={isBuilding}
                    className="px-2.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700/80 rounded-md transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    title="Вернуться в главное меню бота (/start)"
                  >
                    <Home className="w-3.5 h-3.5 text-slate-400" />
                    Меню
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendCommand('/repos')}
                    disabled={isBuilding}
                    className="px-2.5 py-1.5 text-xs font-mono text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    /repos
                  </button>
                </div>
              </div>

              {/* Messages Feed + Interactive Telegram Inline Keyboard Menu */}
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
                                `APK Build Artifact: ${msg.attachment?.filename}\nRepository: ${currentRepo.owner}/${currentRepo.repo}\nCommit: ${msg.attachment?.sha}\nBranch: ${msg.attachment?.branch}\nAuthor: ${msg.attachment?.author}\nSource Backup: ${msg.attachment?.backupArchive}`
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

                {/* Interactive Bot Inline Keyboard Menu (mirrors aiogram inline buttons with '⬅️ Назад') */}
                <div className="flex flex-col items-start">
                  <div className="w-full max-w-[92%] rounded-xl bg-[#161F30] border border-slate-700/80 p-3.5 space-y-3">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-semibold text-sky-300">
                        {simScreen === 'main' && `🤖 Главное меню бота (${currentRepo.owner}/${currentRepo.repo})`}
                        {simScreen === 'repos' && `📂 Мои репозитории (${repositories.length} шт.)`}
                        {simScreen === 'repo_card' && `🛠 Управление проектом: ${currentRepo.owner}/${currentRepo.repo}`}
                        {simScreen === 'setup' && `⚙️ Настройки и секреты GitHub (/setup)`}
                        {simScreen === 'status' && `📊 Статус сборок: ${currentRepo.repo}`}
                        {simScreen === 'log' && `📖 Журнал dev_log.md: ${currentRepo.repo}`}
                      </span>
                      {simScreen !== 'main' && (
                        <button
                          type="button"
                          onClick={handleSimBack}
                          className="text-[11px] font-medium text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer"
                        >
                          <ArrowLeft className="w-3 h-3 text-sky-400" />
                          Назад
                        </button>
                      )}
                    </div>

                    {/* Screen 1: Main Menu Buttons */}
                    {simScreen === 'main' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        <button
                          type="button"
                          disabled={isBuilding}
                          onClick={() => handleSendCommand(`/build ${currentRepo.defaultBranch} Сборка APK из меню бота`)}
                          className="sm:col-span-2 px-3 py-2 text-xs font-medium bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 rounded-lg transition-colors text-center cursor-pointer disabled:opacity-50"
                        >
                          🚀 Собрать APK ({currentRepo.repo})
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateSimScreen('repos')}
                          className="px-3 py-2 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          📂 Мои репозитории ({repositories.length})
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateSimScreen('repo_card')}
                          className="px-3 py-2 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          🛠 Настроить {currentRepo.repo}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendCommand('/status')}
                          className="px-3 py-2 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          📊 Статус сборок
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSendCommand('/log')}
                          className="px-3 py-2 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          📖 Последние записи лога
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateSimScreen('setup')}
                          className="sm:col-span-2 px-3 py-2 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          ⚙️ Настройки и токен (/setup)
                        </button>
                      </div>
                    )}

                    {/* Screen 2: Repositories List with '⬅️ Назад' */}
                    {simScreen === 'repos' && (
                      <div className="space-y-1.5">
                        {repositories.map((r) => (
                          <button
                            key={r.id}
                            type="button"
                            onClick={() => {
                              handleSelectRepository(r.id);
                              navigateSimScreen('repo_card');
                            }}
                            className={`w-full px-3 py-2 text-xs font-mono rounded-lg border transition-colors flex items-center justify-between cursor-pointer ${
                              r.id === currentRepo.id
                                ? 'bg-sky-500/20 border-sky-500/40 text-white'
                                : 'bg-slate-800/90 hover:bg-slate-700 border-slate-700 text-slate-200'
                            }`}
                          >
                            <span>
                              {r.id === currentRepo.id ? '⭐ ' : '📦 '}
                              {r.owner}/{r.repo}
                            </span>
                            <span className="text-[11px] font-sans text-slate-300">
                              {r.autoApkEnabled ? 'CI/CD ON' : 'Настроить →'}
                            </span>
                          </button>
                        ))}
                        <div className="pt-1 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSimBack}
                            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            ⬅️ Назад
                          </button>
                          <button
                            type="button"
                            onClick={handleSimMainMenu}
                            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            🏠 Главное меню
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Screen 3: Single Repository Automation Card with '⬅️ Назад' */}
                    {simScreen === 'repo_card' && (
                      <div className="space-y-1.5">
                        <button
                          type="button"
                          onClick={handleUpdateWorkflowInCurrentRepo}
                          className="w-full px-3 py-2 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 border border-amber-500/30 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          🔄 Обновить workflow в репозитории ({currentRepo.repo})
                        </button>
                        <button
                          type="button"
                          onClick={handleEnableAutoApkForCurrentRepo}
                          className="w-full px-3 py-2 text-xs font-medium bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border border-emerald-500/30 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          📱 {currentRepo.autoApkEnabled ? 'Обновить автосборку APK (CI/CD)' : 'Подключить автосборку APK в 1 клик'}
                        </button>
                        <button
                          type="button"
                          onClick={handleEnablePagesForCurrentRepo}
                          className="w-full px-3 py-2 text-xs font-medium bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 rounded-lg transition-colors text-center cursor-pointer"
                        >
                          🌐 {currentRepo.githubPagesEnabled ? 'GitHub Pages активен (Обновить)' : 'Включить GitHub Pages'}
                        </button>
                        <div className="grid grid-cols-2 gap-1.5">
                          <button
                            type="button"
                            disabled={isBuilding}
                            onClick={() => handleSendCommand(`/build ${currentRepo.defaultBranch} Сборка для ${currentRepo.repo}`)}
                            className="px-3 py-2 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer disabled:opacity-50"
                          >
                            🚀 Собрать APK сейчас
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSendCommand('/status')}
                            className="px-3 py-2 text-xs font-medium bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            📊 Статус сборок
                          </button>
                        </div>
                        <div className="pt-1 flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => navigateSimScreen('repos')}
                            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            ⬅️ Назад к списку репо
                          </button>
                          <button
                            type="button"
                            onClick={handleSimMainMenu}
                            className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            🏠 Меню
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Screen 4: Setup / Status / Log Sub-screens with '⬅️ Назад' */}
                    {(simScreen === 'setup' || simScreen === 'status' || simScreen === 'log') && (
                      <div className="space-y-1.5">
                        {simScreen === 'setup' && (
                          <button
                            type="button"
                            onClick={() => {
                              setTempTokenInput(config.githubToken);
                              setTokenSaveSuccess(false);
                              setIsTokenModalOpen(true);
                            }}
                            className="w-full px-3 py-2 text-xs font-medium bg-sky-500/20 hover:bg-sky-500/30 text-sky-200 border border-sky-500/30 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            🔑 Заменить GitHub Personal Access Token
                          </button>
                        )}
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={handleSimBack}
                            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            ⬅️ Назад
                          </button>
                          <button
                            type="button"
                            onClick={() => navigateSimScreen('repos')}
                            className="flex-1 px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            📂 Репозитории
                          </button>
                          <button
                            type="button"
                            onClick={handleSimMainMenu}
                            className="px-3 py-2 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg transition-colors text-center cursor-pointer"
                          >
                            🏠 Главное меню
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Command Input Bar & Quick Reply Buttons */}
              <div className="p-3.5 border-t border-slate-800 bg-[#111827] space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  <button
                    type="button"
                    onClick={handleSimBack}
                    disabled={isBuilding}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    ⬅️ Назад
                  </button>
                  <button
                    type="button"
                    onClick={handleSimMainMenu}
                    disabled={isBuilding}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    🏠 Главное меню
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSimScreen('repos')}
                    disabled={isBuilding}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700 rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    📂 Мои репозитории
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateSimScreen('repo_card')}
                    disabled={isBuilding}
                    className="px-2.5 py-1 text-[11px] font-medium text-slate-300 bg-slate-800/70 hover:bg-slate-700 rounded-md whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                  >
                    🛠 Настройки {currentRepo.repo}
                  </button>
                </div>

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
                    placeholder="Введите /build main, /repos, /back (Назад) или /start..."
                    className="flex-1 px-3.5 py-2 text-xs font-mono bg-[#0B0F17] border border-slate-800 rounded-lg text-white focus:outline-none focus:border-sky-500"
                  />
                  <button
                    type="submit"
                    disabled={isBuilding}
                    className="px-4 py-2 text-xs font-semibold bg-sky-400 text-slate-950 hover:bg-sky-300 rounded-lg transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
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
                      GitHub Actions Раннер — {currentRepo.owner}/{currentRepo.repo}
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Воркфлоу <code className="text-slate-200">.github/workflows/{currentRepo.workflowFile}</code> (ветка <code className="text-sky-400">{currentRepo.defaultBranch}</code>)
                    </p>
                  </div>
                  <span className="text-xs font-mono text-slate-300 tabular-nums">
                    {isBuilding ? 'Сборка выполняется...' : currentRepo.autoApkEnabled ? 'Готов к запуску' : 'Требуется настройка'}
                  </span>
                </div>

                <div className="space-y-2.5 pt-2">
                  {[
                    {
                      step: 1,
                      title: '1. GitHub Workflow / Repository Dispatch & Checkout',
                      detail: `POST /repos/${currentRepo.owner}/${currentRepo.repo}/actions/workflows/${currentRepo.workflowFile}/dispatches`,
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
                      detail: `Отправка APK в чат ${config.chatId} с информацией о коммите и авторе`,
                    },
                  ].map((item) => {
                    const isDone = !isBuilding ? currentRepo.builds.length > 0 : pipelineStep > item.step;
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
                            {isCurrent ? 'Выполняется...' : isDone ? 'Готово' : 'Ожидание'}
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
                  <h3 className="text-sm font-semibold text-white">
                    История сборок APK: {currentRepo.repo}
                  </h3>
                  <span className="text-xs text-slate-400 tabular-nums">Всего сборок: {builds.length}</span>
                </div>
                {builds.length === 0 ? (
                  <div className="p-6 text-center space-y-3">
                    <p className="text-xs text-slate-400">
                      Для репозитория <code className="text-slate-200">{currentRepo.owner}/{currentRepo.repo}</code> сборок еще не запускалось.
                    </p>
                    <div className="flex items-center justify-center gap-2.5">
                      {!currentRepo.autoApkEnabled && (
                        <button
                          type="button"
                          onClick={handleEnableAutoApkForCurrentRepo}
                          className="px-3.5 py-2 text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors cursor-pointer"
                        >
                          1. Подключить автосборку APK
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSendCommand(`/build ${currentRepo.defaultBranch} Первый релизный билд APK`)}
                        className="px-3.5 py-2 text-xs font-semibold bg-sky-400 text-slate-950 hover:bg-sky-300 rounded-lg transition-colors cursor-pointer"
                      >
                        Запустить первую сборку /build
                      </button>
                    </div>
                  </div>
                ) : (
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
                )}
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
