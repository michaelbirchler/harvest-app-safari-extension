// Translation strings for the Harvest Time Tracker Extension
const translations = {
  en: {
    // Authentication
    auth_title: "Harvest Login",
    auth_subdomain_label: "Subdomain",
    auth_subdomain_placeholder: "yourcompany",
    auth_token_label: "Personal Access Token",
    auth_token_placeholder: "Your token from Harvest",
    auth_login_button: "Login",
    auth_get_token_link: "Get your token from Harvest",
    auth_help_title: "How to get your token",
    auth_help_step1: "Go to your Harvest account settings",
    auth_help_step2: "Navigate to 'Developers' section",
    auth_help_step3: "Create a 'Personal Access Token'",
    auth_help_step4: "Copy the token and paste it above",

    // Current Task
    current_task_label: "Current Task:",
    current_task_edit: "✏️ Edit in Harvest",

    // New Task
    new_task_title: "New Task",
    new_task_project_placeholder: "Select Project",
    new_task_task_placeholder: "Select Task",
    new_task_description_placeholder: "What are you working on?",
    new_task_start_button: "Start Task",
    new_task_open_harvest: "Open Harvest ▸",

    // Recent Entries
    recent_entries_title: "Recent Entries",
    recent_entries_empty: "No time logged in the last 7 days.",
    recent_entries_today: "Today",
    recent_entries_yesterday: "Yesterday",

    // Daily Total
    daily_total_label: "Today's Total:",

    // User Info
    user_logged_in_as: "Logged in as",
    user_logout: "Logout",
    user_tracked_label: " tracked",
    user_for_label: " for «",
    user_today_label: "» today.",

    // Error Messages
    error_auth_failed: "Authentication failed. Please check your credentials.",
    error_invalid_subdomain:
      "Invalid subdomain format. Use only letters, numbers, and hyphens.",
    error_fill_fields: "Please fill in both fields",
    error_start_task: "Failed to start task",
    error_stop_task: "Failed to stop task",
    error_no_project: "Please select a project",
    error_no_task: "Please select a task",
    error_network: "Network error. Please check your connection.",

    // Status Messages
    status_ready: "Ready to start a new task",
    status_running: "Running...",
    status_stopped: "Timer stopped",
    status_syncing: "Syncing with Harvest...",

    // Timer Actions
    timer_stop: "Stop current timer",
    timer_start: "Start timer",

    // Misc
    loading: "Loading...",
    test_open: "Test Open Harvest",
  },

  de: {
    // Authentifizierung
    auth_title: "Harvest Anmeldung",
    auth_subdomain_label: "Subdomain",
    auth_subdomain_placeholder: "ihrefirma",
    auth_token_label: "Persönlicher Zugriffstoken",
    auth_token_placeholder: "Ihr Token von Harvest",
    auth_login_button: "Anmelden",
    auth_get_token_link: "Token von Harvest holen",
    auth_help_title: "So erhalten Sie Ihren Token",
    auth_help_step1: "Gehen Sie zu Ihren Harvest-Kontoeinstellungen",
    auth_help_step2: "Navigieren Sie zum Abschnitt 'Entwickler'",
    auth_help_step3: "Erstellen Sie einen 'Persönlichen Zugriffstoken'",
    auth_help_step4: "Kopieren Sie den Token und fügen Sie ihn oben ein",

    // Aktuelle Aufgabe
    current_task_label: "Aktuelle Aufgabe:",
    current_task_edit: "✏️ In Harvest bearbeiten",

    // Neue Aufgabe
    new_task_title: "Neue Aufgabe",
    new_task_project_placeholder: "Projekt auswählen",
    new_task_task_placeholder: "Aufgabe auswählen",
    new_task_description_placeholder: "Woran arbeiten Sie?",
    new_task_start_button: "Aufgabe starten",
    new_task_open_harvest: "Harvest öffnen ▸",

    // Letzte Einträge
    recent_entries_title: "Letzte Einträge",
    recent_entries_empty: "Keine Zeit in den letzten 7 Tagen erfasst.",
    recent_entries_today: "Heute",
    recent_entries_yesterday: "Gestern",

    // Tagessumme
    daily_total_label: "Heutige Summe:",

    // Benutzerinfo
    user_logged_in_as: "Angemeldet als",
    user_logout: "Abmelden",
    user_tracked_label: " erfasst",
    user_for_label: " für «",
    user_today_label: "» heute.",

    // Fehlermeldungen
    error_auth_failed:
      "Authentifizierung fehlgeschlagen. Bitte überprüfen Sie Ihre Anmeldedaten.",
    error_invalid_subdomain:
      "Ungültiges Subdomain-Format. Verwenden Sie nur Buchstaben, Zahlen und Bindestriche.",
    error_fill_fields: "Bitte füllen Sie beide Felder aus",
    error_start_task: "Aufgabe konnte nicht gestartet werden",
    error_stop_task: "Aufgabe konnte nicht gestoppt werden",
    error_no_project: "Bitte wählen Sie ein Projekt",
    error_no_task: "Bitte wählen Sie eine Aufgabe",
    error_network: "Netzwerkfehler. Bitte überprüfen Sie Ihre Verbindung.",

    // Statusmeldungen
    status_ready: "Bereit, eine neue Aufgabe zu starten",
    status_running: "Läuft...",
    status_stopped: "Timer gestoppt",
    status_syncing: "Synchronisiere mit Harvest...",

    // Timer-Aktionen
    timer_stop: "Aktuellen Timer stoppen",
    timer_start: "Timer starten",

    // Verschiedenes
    loading: "Lädt...",
    test_open: "Harvest öffnen (Test)",
  },

  fr: {
    // Authentification
    auth_title: "Connexion Harvest",
    auth_subdomain_label: "Sous-domaine",
    auth_subdomain_placeholder: "votreentreprise",
    auth_token_label: "Jeton d'accès personnel",
    auth_token_placeholder: "Votre jeton de Harvest",
    auth_login_button: "Se connecter",
    auth_get_token_link: "Obtenir votre jeton de Harvest",
    auth_help_title: "Comment obtenir votre jeton",
    auth_help_step1: "Accédez aux paramètres de votre compte Harvest",
    auth_help_step2: "Naviguez vers la section 'Développeurs'",
    auth_help_step3: "Créez un 'Jeton d'accès personnel'",
    auth_help_step4: "Copiez le jeton et collez-le ci-dessus",

    // Tâche actuelle
    current_task_label: "Tâche actuelle:",
    current_task_edit: "✏️ Modifier dans Harvest",

    // Nouvelle tâche
    new_task_title: "Nouvelle tâche",
    new_task_project_placeholder: "Sélectionner un projet",
    new_task_task_placeholder: "Sélectionner une tâche",
    new_task_description_placeholder: "Sur quoi travaillez-vous?",
    new_task_start_button: "Démarrer la tâche",
    new_task_open_harvest: "Ouvrir Harvest ▸",

    // Entrées récentes
    recent_entries_title: "Entrées récentes",
    recent_entries_empty:
      "Aucun temps enregistré au cours des 7 derniers jours.",
    recent_entries_today: "Aujourd'hui",
    recent_entries_yesterday: "Hier",

    // Total quotidien
    daily_total_label: "Total d'aujourd'hui:",

    // Informations utilisateur
    user_logged_in_as: "Connecté en tant que",
    user_logout: "Se déconnecter",
    user_tracked_label: " enregistré",
    user_for_label: " pour «",
    user_today_label: "» aujourd'hui.",

    // Messages d'erreur
    error_auth_failed:
      "Échec de l'authentification. Veuillez vérifier vos informations d'identification.",
    error_invalid_subdomain:
      "Format de sous-domaine invalide. Utilisez uniquement des lettres, des chiffres et des tirets.",
    error_fill_fields: "Veuillez remplir les deux champs",
    error_start_task: "Impossible de démarrer la tâche",
    error_stop_task: "Impossible d'arrêter la tâche",
    error_no_project: "Veuillez sélectionner un projet",
    error_no_task: "Veuillez sélectionner une tâche",
    error_network: "Erreur réseau. Veuillez vérifier votre connexion.",

    // Messages de statut
    status_ready: "Prêt à démarrer une nouvelle tâche",
    status_running: "En cours...",
    status_stopped: "Minuteur arrêté",
    status_syncing: "Synchronisation avec Harvest...",

    // Actions du minuteur
    timer_stop: "Arrêter le minuteur actuel",
    timer_start: "Démarrer le minuteur",

    // Divers
    loading: "Chargement...",
    test_open: "Test ouverture Harvest",
  },

  it: {
    // Autenticazione
    auth_title: "Accesso a Harvest",
    auth_subdomain_label: "Sottodominio",
    auth_subdomain_placeholder: "tuaazienda",
    auth_token_label: "Token di accesso personale",
    auth_token_placeholder: "Il tuo token da Harvest",
    auth_login_button: "Accedi",
    auth_get_token_link: "Ottieni il tuo token da Harvest",
    auth_help_title: "Come ottenere il tuo token",
    auth_help_step1: "Vai alle impostazioni del tuo account Harvest",
    auth_help_step2: "Naviga nella sezione 'Sviluppatori'",
    auth_help_step3: "Crea un 'Token di accesso personale'",
    auth_help_step4: "Copia il token e incollalo sopra",

    // Attività corrente
    current_task_label: "Attività corrente:",
    current_task_edit: "✏️ Modifica in Harvest",

    // Nuova attività
    new_task_title: "Nuova attività",
    new_task_project_placeholder: "Seleziona progetto",
    new_task_task_placeholder: "Seleziona attività",
    new_task_description_placeholder: "Su cosa stai lavorando?",
    new_task_start_button: "Avvia attività",
    new_task_open_harvest: "Apri Harvest ▸",

    // Voci recenti
    recent_entries_title: "Voci recenti",
    recent_entries_empty: "Nessun tempo registrato negli ultimi 7 giorni.",
    recent_entries_today: "Oggi",
    recent_entries_yesterday: "Ieri",

    // Totale giornaliero
    daily_total_label: "Totale di oggi:",

    // Informazioni utente
    user_logged_in_as: "Connesso come",
    user_logout: "Disconnetti",
    user_tracked_label: " registrato",
    user_for_label: " per «",
    user_today_label: "» oggi.",

    // Messaggi di errore
    error_auth_failed: "Autenticazione fallita. Controlla le tue credenziali.",
    error_invalid_subdomain:
      "Formato del sottodominio non valido. Usa solo lettere, numeri e trattini.",
    error_fill_fields: "Compila entrambi i campi",
    error_start_task: "Impossibile avviare l'attività",
    error_stop_task: "Impossibile fermare l'attività",
    error_no_project: "Seleziona un progetto",
    error_no_task: "Seleziona un'attività",
    error_network: "Errore di rete. Controlla la tua connessione.",

    // Messaggi di stato
    status_ready: "Pronto per avviare una nuova attività",
    status_running: "In corso...",
    status_stopped: "Timer fermato",
    status_syncing: "Sincronizzazione con Harvest...",

    // Azioni del timer
    timer_stop: "Ferma il timer corrente",
    timer_start: "Avvia timer",

    // Varie
    loading: "Caricamento...",
    test_open: "Test apertura Harvest",
  },

  es: {
    // Autenticación
    auth_title: "Inicio de sesión en Harvest",
    auth_subdomain_label: "Subdominio",
    auth_subdomain_placeholder: "tuempresa",
    auth_token_label: "Token de acceso personal",
    auth_token_placeholder: "Tu token de Harvest",
    auth_login_button: "Iniciar sesión",
    auth_get_token_link: "Obtén tu token de Harvest",
    auth_help_title: "Cómo obtener tu token",
    auth_help_step1: "Ve a la configuración de tu cuenta de Harvest",
    auth_help_step2: "Navega a la sección 'Desarrolladores'",
    auth_help_step3: "Crea un 'Token de acceso personal'",
    auth_help_step4: "Copia el token y pégalo arriba",

    // Tarea actual
    current_task_label: "Tarea actual:",
    current_task_edit: "✏️ Editar en Harvest",

    // Nueva tarea
    new_task_title: "Nueva tarea",
    new_task_project_placeholder: "Seleccionar proyecto",
    new_task_task_placeholder: "Seleccionar tarea",
    new_task_description_placeholder: "¿En qué estás trabajando?",
    new_task_start_button: "Iniciar tarea",
    new_task_open_harvest: "Abrir Harvest ▸",

    // Entradas recientes
    recent_entries_title: "Entradas recientes",
    recent_entries_empty: "No se registró tiempo en los últimos 7 días.",
    recent_entries_today: "Hoy",
    recent_entries_yesterday: "Ayer",

    // Total diario
    daily_total_label: "Total de hoy:",

    // Información de usuario
    user_logged_in_as: "Conectado como",
    user_logout: "Cerrar sesión",
    user_tracked_label: " registrado",
    user_for_label: " para «",
    user_today_label: "» hoy.",

    // Mensajes de error
    error_auth_failed:
      "Autenticación fallida. Por favor verifica tus credenciales.",
    error_invalid_subdomain:
      "Formato de subdominio inválido. Usa solo letras, números y guiones.",
    error_fill_fields: "Por favor completa ambos campos",
    error_start_task: "No se pudo iniciar la tarea",
    error_stop_task: "No se pudo detener la tarea",
    error_no_project: "Por favor selecciona un proyecto",
    error_no_task: "Por favor selecciona una tarea",
    error_network: "Error de red. Por favor verifica tu conexión.",

    // Mensajes de estado
    status_ready: "Listo para iniciar una nueva tarea",
    status_running: "En ejecución...",
    status_stopped: "Temporizador detenido",
    status_syncing: "Sincronizando con Harvest...",

    // Acciones del temporizador
    timer_stop: "Detener temporizador actual",
    timer_start: "Iniciar temporizador",

    // Varios
    loading: "Cargando...",
    test_open: "Probar abrir Harvest",
  },

  pt: {
    // Autenticação
    auth_title: "Login no Harvest",
    auth_subdomain_label: "Subdomínio",
    auth_subdomain_placeholder: "suaempresa",
    auth_token_label: "Token de acesso pessoal",
    auth_token_placeholder: "Seu token do Harvest",
    auth_login_button: "Entrar",
    auth_get_token_link: "Obtenha seu token do Harvest",
    auth_help_title: "Como obter seu token",
    auth_help_step1: "Vá para as configurações da sua conta Harvest",
    auth_help_step2: "Navegue até a seção 'Desenvolvedores'",
    auth_help_step3: "Crie um 'Token de acesso pessoal'",
    auth_help_step4: "Copie o token e cole-o acima",

    // Tarefa atual
    current_task_label: "Tarefa atual:",
    current_task_edit: "✏️ Editar no Harvest",

    // Nova tarefa
    new_task_title: "Nova tarefa",
    new_task_project_placeholder: "Selecionar projeto",
    new_task_task_placeholder: "Selecionar tarefa",
    new_task_description_placeholder: "No que você está trabalhando?",
    new_task_start_button: "Iniciar tarefa",
    new_task_open_harvest: "Abrir Harvest ▸",

    // Entradas recentes
    recent_entries_title: "Entradas recentes",
    recent_entries_empty: "Nenhum tempo registrado nos últimos 7 dias.",
    recent_entries_today: "Hoje",
    recent_entries_yesterday: "Ontem",

    // Total diário
    daily_total_label: "Total de hoje:",

    // Informações do usuário
    user_logged_in_as: "Conectado como",
    user_logout: "Sair",
    user_tracked_label: " registrado",
    user_for_label: " para «",
    user_today_label: "» hoje.",

    // Mensagens de erro
    error_auth_failed:
      "Autenticação falhou. Por favor verifique suas credenciais.",
    error_invalid_subdomain:
      "Formato de subdomínio inválido. Use apenas letras, números e hífens.",
    error_fill_fields: "Por favor preencha ambos os campos",
    error_start_task: "Falha ao iniciar a tarefa",
    error_stop_task: "Falha ao parar a tarefa",
    error_no_project: "Por favor selecione um projeto",
    error_no_task: "Por favor selecione uma tarefa",
    error_network: "Erro de rede. Por favor verifique sua conexão.",

    // Mensagens de status
    status_ready: "Pronto para iniciar uma nova tarefa",
    status_running: "Em execução...",
    status_stopped: "Cronômetro parado",
    status_syncing: "Sincronizando com Harvest...",

    // Ações do cronômetro
    timer_stop: "Parar cronômetro atual",
    timer_start: "Iniciar cronômetro",

    // Diversos
    loading: "Carregando...",
    test_open: "Testar abertura do Harvest",
  },

  nl: {
    // Authenticatie
    auth_title: "Harvest inloggen",
    auth_subdomain_label: "Subdomein",
    auth_subdomain_placeholder: "jouwbedrijf",
    auth_token_label: "Persoonlijk toegangstoken",
    auth_token_placeholder: "Jouw token van Harvest",
    auth_login_button: "Inloggen",
    auth_get_token_link: "Haal je token op van Harvest",
    auth_help_title: "Hoe je jouw token verkrijgt",
    auth_help_step1: "Ga naar je Harvest-accountinstellingen",
    auth_help_step2: "Navigeer naar de sectie 'Ontwikkelaars'",
    auth_help_step3: "Maak een 'Persoonlijk toegangstoken'",
    auth_help_step4: "Kopieer het token en plak het hierboven",

    // Huidige taak
    current_task_label: "Huidige taak:",
    current_task_edit: "✏️ Bewerken in Harvest",

    // Nieuwe taak
    new_task_title: "Nieuwe taak",
    new_task_project_placeholder: "Selecteer project",
    new_task_task_placeholder: "Selecteer taak",
    new_task_description_placeholder: "Waar werk je aan?",
    new_task_start_button: "Start taak",
    new_task_open_harvest: "Open Harvest ▸",

    // Recente vermeldingen
    recent_entries_title: "Recente vermeldingen",
    recent_entries_empty: "Geen tijd geregistreerd in de afgelopen 7 dagen.",
    recent_entries_today: "Vandaag",
    recent_entries_yesterday: "Gisteren",

    // Dagtotaal
    daily_total_label: "Totaal vandaag:",

    // Gebruikersinformatie
    user_logged_in_as: "Ingelogd als",
    user_logout: "Uitloggen",
    user_tracked_label: " geregistreerd",
    user_for_label: " voor «",
    user_today_label: "» vandaag.",

    // Foutmeldingen
    error_auth_failed: "Authenticatie mislukt. Controleer je inloggegevens.",
    error_invalid_subdomain:
      "Ongeldig subdomeinformaat. Gebruik alleen letters, cijfers en streepjes.",
    error_fill_fields: "Vul beide velden in",
    error_start_task: "Kan taak niet starten",
    error_stop_task: "Kan taak niet stoppen",
    error_no_project: "Selecteer een project",
    error_no_task: "Selecteer een taak",
    error_network: "Netwerkfout. Controleer je verbinding.",

    // Statusberichten
    status_ready: "Klaar om een nieuwe taak te starten",
    status_running: "Loopt...",
    status_stopped: "Timer gestopt",
    status_syncing: "Synchroniseren met Harvest...",

    // Timer acties
    timer_stop: "Stop huidige timer",
    timer_start: "Start timer",

    // Diversen
    loading: "Laden...",
    test_open: "Test Harvest openen",
  },
};
