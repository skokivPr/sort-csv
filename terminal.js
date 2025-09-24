/**
 * CSV Analyzer Terminal Module
 * Provides terminal functionality for the CSV Analyzer application
 */

class CSVTerminal {
    constructor() {
        this.history = [];
        this.historyIndex = -1;
        this.commands = this.initializeCommands();
        this.isInitialized = false;
        this.notifications = [];
        this.maxNotifications = 100; // Limit notifications to prevent memory issues

        // Autocomplete system
        this.suggestions = [];
        this.suggestionIndex = -1;
        this.input = null;
        this.suggestionsContainer = null;

        // Quick actions system
        this.quickActions = [
            { key: 'h', label: 'Help', description: 'Show all commands', command: 'help' },
            { key: 'c', label: 'Clear', description: 'Clear terminal', command: 'clear' },
            { key: 's', label: 'Status', description: 'Show app status', command: 'status' },
            { key: 'd', label: 'Data', description: 'Show data statistics', command: 'data' },
            { key: 'b', label: 'Buffers', description: 'List saved buffers', command: 'buffers' },
            { key: 't', label: 'Theme', description: 'Toggle theme', command: 'theme' },
            { key: 'v', label: 'Version', description: 'Show version', command: 'version' },
            { key: 'n', label: 'Notifications', description: 'Show notifications', command: 'notifications' },
            { key: 'o', label: 'Colors', description: 'Show color examples', command: 'colors' },
            { key: 'r', label: 'Rainbow', description: 'Rainbow text demo', command: 'rainbow' },
            { key: 'e', label: 'Export', description: 'Export current data', command: 'export' },
            { key: 'i', label: 'Time', description: 'Show current time', command: 'time' }
        ];
        this.quickActionsVisible = false;
        this.selectedActionIndex = 0;

        // Commands panel system
        this.currentContext = 'default';
        this.commandsPanel = null;
        this.contextualCommands = {
            default: [
                { command: 'help', description: 'Show all commands', icon: 'fas fa-question-circle', type: 'info' },
                { command: 'status', description: 'App status', icon: 'fas fa-chart-bar', type: 'info' },
                { command: 'data', description: 'Data statistics', icon: 'fas fa-chart-line', type: 'info' },
                { command: 'clear', description: 'Clear terminal', icon: 'fas fa-broom', type: 'undo' },
                { command: 'colors', description: 'Show colors', icon: 'fas fa-palette', type: 'action' }
            ],
            data_loaded: [
                { command: 'data', description: 'Data statistics', icon: 'fas fa-chart-line', type: 'info' },
                { command: 'buffers', description: 'Saved buffers', icon: 'fas fa-save', type: 'info' },
                { command: 'export', description: 'Export data', icon: 'fas fa-download', type: 'action' },
                { command: 'driver list', description: 'List drivers', icon: 'fas fa-users', type: 'info' },
                { command: 'theme', description: 'Toggle theme', icon: 'fas fa-adjust', type: 'toggle' }
            ],
            driver_mode: [
                { command: 'driver list', description: 'List all drivers', icon: 'fas fa-users', type: 'info' },
                { command: 'driver add', description: 'Add new driver', icon: 'fas fa-user-plus', type: 'action' },
                { command: 'driver sample', description: 'Add sample data', icon: 'fas fa-dice', type: 'action' },
                { command: 'drivers off', description: 'Disable columns', icon: 'fas fa-times-circle', type: 'undo' },
                { command: 'data', description: 'Back to data', icon: 'fas fa-arrow-left', type: 'back' }
            ],
            notifications: [
                { command: 'notifications', description: 'Show notifications', icon: 'fas fa-bell', type: 'info' },
                { command: 'clearnotifications', description: 'Clear all', icon: 'fas fa-trash', type: 'undo' },
                { command: 'notify info', description: 'Test notification', icon: 'fas fa-comment', type: 'action' },
                { command: 'status', description: 'App status', icon: 'fas fa-chart-bar', type: 'info' },
                { command: 'help', description: 'Show help', icon: 'fas fa-arrow-left', type: 'back' }
            ],
            colors: [
                { command: 'colors', description: 'Show colors', icon: 'fas fa-palette', type: 'info' },
                { command: 'rainbow', description: 'Rainbow text', icon: 'fas fa-rainbow', type: 'action' },
                { command: 'colortest', description: 'Color test', icon: 'fas fa-flask', type: 'action' },
                { command: 'clear', description: 'Clear terminal', icon: 'fas fa-broom', type: 'undo' },
                { command: 'help', description: 'All commands', icon: 'fas fa-arrow-left', type: 'back' }
            ]
        };

        // Terminal color system
        this.colors = {
            reset: '\x1b[0m',
            bright: '\x1b[1m',
            dim: '\x1b[2m',
            underscore: '\x1b[4m',
            blink: '\x1b[5m',
            reverse: '\x1b[7m',
            hidden: '\x1b[8m',

            // Foreground colors
            black: '\x1b[30m',
            red: '\x1b[31m',
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            blue: '\x1b[34m',
            magenta: '\x1b[35m',
            cyan: '\x1b[36m',
            white: '\x1b[37m',
            gray: '\x1b[90m',

            // Bright foreground colors
            brightRed: '\x1b[91m',
            brightGreen: '\x1b[92m',
            brightYellow: '\x1b[93m',
            brightBlue: '\x1b[94m',
            brightMagenta: '\x1b[95m',
            brightCyan: '\x1b[96m',
            brightWhite: '\x1b[97m',

            // Background colors
            bgBlack: '\x1b[40m',
            bgRed: '\x1b[41m',
            bgGreen: '\x1b[42m',
            bgYellow: '\x1b[43m',
            bgBlue: '\x1b[44m',
            bgMagenta: '\x1b[45m',
            bgCyan: '\x1b[46m',
            bgWhite: '\x1b[47m'
        };

        // Color name mappings for CSS classes
        this.colorMap = {
            '\x1b[30m': 'terminal-black',
            '\x1b[31m': 'terminal-red',
            '\x1b[32m': 'terminal-green',
            '\x1b[33m': 'terminal-yellow',
            '\x1b[34m': 'terminal-blue',
            '\x1b[35m': 'terminal-magenta',
            '\x1b[36m': 'terminal-cyan',
            '\x1b[37m': 'terminal-white',
            '\x1b[90m': 'terminal-gray',
            '\x1b[91m': 'terminal-bright-red',
            '\x1b[92m': 'terminal-bright-green',
            '\x1b[93m': 'terminal-bright-yellow',
            '\x1b[94m': 'terminal-bright-blue',
            '\x1b[95m': 'terminal-bright-magenta',
            '\x1b[96m': 'terminal-bright-cyan',
            '\x1b[97m': 'terminal-bright-white',
            '\x1b[1m': 'terminal-bold',
            '\x1b[2m': 'terminal-dim',
            '\x1b[4m': 'terminal-underline'
        };
    }

    /**
     * Initialize terminal commands
     */
    initializeCommands() {
        return {
            help: {
                description: "Show available commands",
                execute: () => {
                    const commands = Object.keys(this.commands).map(cmd =>
                        `  ${this.cyan(cmd.padEnd(15))} - ${this.commands[cmd].description}`
                    ).join('\n');
                    return `${this.bold(this.brightBlue('Available commands:'))}\n${commands}`;
                }
            },
            clear: {
                description: "Clear terminal output",
                execute: () => {
                    this.clearTerminal();
                    return null;
                }
            },
            status: {
                description: "Show application status",
                execute: () => {
                    if (typeof appState === 'undefined') {
                        return this.red("Application state not available");
                    }
                    const bufferCount = appState.buffers?.length || 0;
                    const dataCount = appState.allData?.length || 0;
                    const theme = appState.theme || 'unknown';
                    const currentView = appState.currentView || 'unknown';

                    const statusLines = [
                        `${this.bold(this.brightGreen('Application Status:'))}`,
                        `  ${this.cyan('Theme:')} ${this.yellow(theme)}`,
                        `  ${this.cyan('Data Records:')} ${this.brightWhite(dataCount)}`,
                        `  ${this.cyan('Saved Buffers:')} ${this.brightWhite(bufferCount)}`,
                        `  ${this.cyan('Current View:')} ${this.magenta(currentView)}`
                    ];

                    return statusLines.join('\n');
                }
            },
            buffers: {
                description: "List all saved buffers",
                execute: () => {
                    if (typeof appState === 'undefined' || !appState.buffers) {
                        return "Buffers not available";
                    }
                    if (appState.buffers.length === 0) {
                        return "No buffers saved.";
                    }
                    const bufferList = appState.buffers.map((buffer, index) =>
                        `  ${(index + 1).toString().padEnd(3)} ${buffer.name.padEnd(20)} ${buffer.recordCount} records`
                    ).join('\n');
                    return `Saved Buffers:\n${bufferList}`;
                }
            },
            data: {
                description: "Show current data statistics",
                execute: () => {
                    if (typeof appState === 'undefined' || !appState.allData) {
                        return "Data not available";
                    }
                    if (appState.allData.length === 0) {
                        return "No data loaded.";
                    }
                    const categories = appState.categorizedData || {};
                    return `Data Statistics:
  Total Records: ${appState.allData.length}
  IB Records: ${categories.ib?.length || 0}
  OB Records: ${categories.ob?.length || 0}
  ATSEU Records: ${categories.atseu?.length || 0}
  Other Records: ${categories.other?.length || 0}`;
                }
            },
            theme: {
                description: "Toggle dark/light theme or set specific theme",
                execute: (args) => {
                    if (typeof appState === 'undefined') {
                        return "Theme control not available";
                    }

                    if (args.length > 0 && (args[0] === 'dark' || args[0] === 'light')) {
                        appState.theme = args[0];
                        document.documentElement.setAttribute("theme", appState.theme);
                        localStorage.setItem("theme", appState.theme);
                        this.updateThemeButton();
                        return `Theme changed to ${args[0]}`;
                    } else {
                        if (typeof toggleTheme === 'function') {
                            toggleTheme();
                            return `Theme toggled to ${appState.theme}`;
                        } else {
                            return "Theme toggle function not available";
                        }
                    }
                }
            },
            export: {
                description: "Export current data as CSV",
                execute: (args) => {
                    if (typeof appState === 'undefined' || !appState.allData) {
                        return "Data not available for export";
                    }
                    if (appState.allData.length === 0) {
                        return "No data to export.";
                    }

                    const filename = args.length > 0 ? args[0] : 'csv_export.csv';

                    if (typeof exportToCSV === 'function') {
                        exportToCSV(appState.allData, filename);
                        return `Data exported to ${filename}`;
                    } else {
                        return "Export function not available";
                    }
                }
            },
            version: {
                description: "Show application version",
                execute: () => {
                    return `${this.bold(this.brightCyan('CSV Analyzer'))} ${this.yellow('v1.0.0')} - ${this.gray('Terminal Module')}`;
                }
            },
            time: {
                description: "Show current date and time",
                execute: () => {
                    const now = new Date();
                    const date = this.cyan(now.toLocaleDateString());
                    const time = this.brightYellow(now.toLocaleTimeString());
                    return `${this.bold('Current time:')} ${date} ${time}`;
                }
            },
            echo: {
                description: "Echo back the provided text",
                execute: (args) => {
                    return args.join(' ') || '';
                }
            },
            notifications: {
                description: "Show recent notifications",
                execute: (args) => {
                    const count = parseInt(args[0]) || 10;
                    if (this.notifications.length === 0) {
                        return "No notifications available.";
                    }

                    const recent = this.notifications.slice(-count);
                    const notificationList = recent.map(notif => {
                        const timestamp = new Date(notif.timestamp).toLocaleTimeString();
                        const typeIcon = this.getNotificationIcon(notif.type);
                        return `[${timestamp}] ${typeIcon} ${notif.message}`;
                    }).join('\n');

                    return `Recent Notifications (${recent.length}):\n${notificationList}`;
                }
            },
            notify: {
                description: "Send a custom notification (usage: notify [type] [message])",
                execute: (args) => {
                    if (args.length < 2) {
                        return "Usage: notify [info|warning|error|success] [message]";
                    }

                    const type = args[0].toLowerCase();
                    const message = args.slice(1).join(' ');

                    if (!['info', 'warning', 'error', 'success'].includes(type)) {
                        return "Invalid notification type. Use: info, warning, error, or success";
                    }

                    this.addNotification(type, `Custom: ${message}`);
                    return `Notification sent: ${message}`;
                }
            },
            clearnotifications: {
                description: "Clear all notifications",
                execute: () => {
                    const count = this.notifications.length;
                    this.notifications = [];
                    return `Cleared ${count} notifications.`;
                }
            },
            colors: {
                description: "Display available terminal colors and examples",
                execute: () => {
                    const examples = [
                        `${this.red('Red text')} - Error messages`,
                        `${this.green('Green text')} - Success messages`,
                        `${this.yellow('Yellow text')} - Warning messages`,
                        `${this.blue('Blue text')} - Information`,
                        `${this.magenta('Magenta text')} - Special notices`,
                        `${this.cyan('Cyan text')} - Commands and links`,
                        `${this.white('White text')} - Default text`,
                        `${this.gray('Gray text')} - Muted information`,
                        `${this.brightRed('Bright Red')} - Critical errors`,
                        `${this.brightGreen('Bright Green')} - Important success`,
                        `${this.brightYellow('Bright Yellow')} - Highlights`,
                        `${this.brightBlue('Bright Blue')} - Headers`,
                        `${this.brightMagenta('Bright Magenta')} - Special`,
                        `${this.brightCyan('Bright Cyan')} - Links`,
                        `${this.brightWhite('Bright White')} - Emphasis`,
                        `${this.bold('Bold text')} - Strong emphasis`,
                        `${this.dim('Dim text')} - Less important`,
                        `${this.underline('Underlined text')} - Emphasis`
                    ];

                    return `Terminal Color Examples:\n${examples.join('\n')}`;
                }
            },
            rainbow: {
                description: "Display rainbow text example",
                execute: (args) => {
                    const text = args.length > 0 ? args.join(' ') : 'Rainbow Text Example!';
                    const colors = ['red', 'yellow', 'green', 'cyan', 'blue', 'magenta'];
                    let result = '';

                    for (let i = 0; i < text.length; i++) {
                        const char = text[i];
                        if (char === ' ') {
                            result += char;
                        } else {
                            const color = colors[i % colors.length];
                            result += this.colorText(char, color);
                        }
                    }

                    return result;
                }
            },
            colortest: {
                description: "Test color functionality with sample text",
                execute: () => {
                    const testLines = [
                        `${this.bold(this.brightCyan('=== Terminal Color Test ==='))}`,
                        '',
                        `${this.green('✓')} ${this.bold('Success:')} Operation completed successfully`,
                        `${this.yellow('⚠')} ${this.bold('Warning:')} This is a warning message`,
                        `${this.red('✗')} ${this.bold('Error:')} Something went wrong`,
                        `${this.blue('ℹ')} ${this.bold('Info:')} Additional information`,
                        '',
                        `${this.cyan('Command:')} ${this.underline('help')}`,
                        `${this.gray('Timestamp:')} ${new Date().toLocaleTimeString()}`,
                        `${this.magenta('Status:')} ${this.brightGreen('ONLINE')}`,
                        '',
                        `${this.dim('This text is dimmed for less importance')}`,
                        `${this.bold('This text is bold for emphasis')}`,
                        `${this.underline('This text is underlined')}`
                    ];

                    return testLines.join('\n');
                }
            },
            quickactions: {
                description: "Show quick actions menu (same as Ctrl+Space)",
                execute: () => {
                    this.showQuickActions();
                    return `${this.brightCyan('Quick Actions menu opened!')} ${this.gray('Use Ctrl+Space anytime to access it.')}`;
                }
            },
            panel: {
                description: "Toggle commands panel visibility",
                execute: (args) => {
                    if (args.length > 0) {
                        const action = args[0].toLowerCase();
                        if (action === 'show') {
                            this.showCommandsPanel();
                            return `${this.green('Commands panel shown')}`;
                        } else if (action === 'hide') {
                            this.hideCommandsPanel();
                            return `${this.yellow('Commands panel hidden')}`;
                        }
                    }

                    this.toggleCommandsPanel();
                    const isVisible = this.commandsPanel && this.commandsPanel.style.display !== 'none';
                    return `Commands panel ${isVisible ? this.green('shown') : this.yellow('hidden')}`;
                }
            },
            drivers: {
                description: "Toggle driver columns on/off",
                execute: (args) => {
                    if (typeof toggleDriverColumns === 'function') {
                        if (args.length > 0) {
                            const action = args[0].toLowerCase();
                            if (action === 'on' || action === 'enable') {
                                toggleDriverColumns(true);
                                this.addNotification('success', 'Driver columns enabled');
                                return `${this.green('✅ Driver columns enabled')}`;
                            } else if (action === 'off' || action === 'disable') {
                                toggleDriverColumns(false);
                                this.addNotification('info', 'Driver columns disabled');
                                return `${this.yellow('❌ Driver columns disabled')}`;
                            }
                        }

                        // Toggle current state
                        const currentState = typeof appState !== 'undefined' ? appState.driversEnabled : false;
                        toggleDriverColumns(!currentState);
                        const newState = !currentState;
                        const status = newState ? this.green('✅ ENABLED') : this.yellow('❌ DISABLED');
                        this.addNotification(newState ? 'success' : 'info', `Driver columns ${newState ? 'enabled' : 'disabled'}`);
                        return `Driver columns ${status}`;
                    }
                    return this.red("Driver toggle function not available.");
                }
            },
            driver: {
                description: "Manage driver data - add, list, or assign drivers",
                execute: (args) => {
                    // Activate driver columns when driver command is used
                    if (typeof toggleDriverColumns === 'function') {
                        toggleDriverColumns(true);
                        if (!this.driversActivatedNotified) {
                            this.addNotification('success', 'Driver columns activated in CSV editor');
                            this.driversActivatedNotified = true;
                        }
                    }

                    if (args.length === 0) {
                        return `Driver Management Commands:
  driver list                    - Show all available drivers
  driver add [name] [license]    - Add new driver
  driver assign [rowIndex] [driverName] - Assign driver to specific row
  driver remove [name]           - Remove driver from system
  driver info [name]             - Show driver details
  driver sample                  - Assign random drivers to all empty rows
  driver enable                  - Enable driver columns
  driver disable                 - Disable driver columns
  driver status                  - Check driver columns status`;
                    }

                    const command = args[0].toLowerCase();

                    switch (command) {
                        case 'list':
                            return this.listDrivers();
                        case 'add':
                            if (args.length < 3) {
                                return "Usage: driver add [name] [license] [phone (optional)]";
                            }
                            const name = args[1];
                            const license = args[2];
                            const phone = args[3] || '';
                            return this.addDriver(name, license, phone);
                        case 'assign':
                            if (args.length < 3) {
                                return "Usage: driver assign [rowIndex] [driverName]";
                            }
                            const rowIndex = parseInt(args[1]);
                            const driverName = args.slice(2).join(' ');
                            return this.assignDriver(rowIndex, driverName);
                        case 'remove':
                            if (args.length < 2) {
                                return "Usage: driver remove [name]";
                            }
                            const driverToRemove = args.slice(1).join(' ');
                            return this.removeDriver(driverToRemove);
                        case 'info':
                            if (args.length < 2) {
                                return "Usage: driver info [name]";
                            }
                            const driverToShow = args.slice(1).join(' ');
                            return this.showDriverInfo(driverToShow);
                        case 'sample':
                            return this.addSampleDriverData();
                        case 'enable':
                            if (typeof toggleDriverColumns === 'function') {
                                toggleDriverColumns(true);
                                this.addNotification('success', 'Driver columns enabled');
                                return `${this.green('Driver columns enabled')} in CSV editor.`;
                            }
                            return this.red("Driver toggle function not available.");
                        case 'disable':
                            if (typeof toggleDriverColumns === 'function') {
                                toggleDriverColumns(false);
                                this.addNotification('info', 'Driver columns disabled');
                                return `${this.yellow('Driver columns disabled')} in CSV editor.`;
                            }
                            return this.red("Driver toggle function not available.");
                        case 'status':
                            if (typeof appState !== 'undefined' && appState.driversEnabled !== undefined) {
                                const status = appState.driversEnabled ? this.green('ENABLED') : this.yellow('DISABLED');
                                const statusIcon = appState.driversEnabled ? '✅' : '❌';
                                return `${statusIcon} Driver columns are currently ${status}`;
                            }
                            return this.gray("Driver status unavailable");
                        default:
                            return `Unknown driver command: ${command}. Type 'driver' for help.`;
                    }
                }
            }
        };
    }

    /**
     * Initialize terminal functionality
     */
    initialize() {
        if (this.isInitialized) return;

        // Set up event listeners
        this.setupEventListeners();
        this.isInitialized = true;

        console.log('CSV Terminal initialized');

        // Initialize commands panel
        this.initializeCommandsPanel();

        // Initialize autocomplete system
        this.initializeAutocomplete();
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Terminal input handler is already set in HTML via onkeydown
        // We'll handle it through the global functions
    }

    /**
     * Switch between tabs
     */
    switchTab(tabName) {
        const buffersTab = document.getElementById('buffers-tab');
        const terminalTab = document.getElementById('terminal-tab');
        const buffersContent = document.getElementById('buffers-content');
        const terminalContent = document.getElementById('terminal-content');

        if (!buffersTab || !terminalTab || !buffersContent || !terminalContent) {
            console.error('Terminal tab elements not found');
            return;
        }

        if (tabName === 'buffers') {
            buffersTab.classList.add('active');
            terminalTab.classList.remove('active');
            buffersContent.classList.add('active');
            terminalContent.classList.remove('active');
        } else if (tabName === 'terminal') {
            buffersTab.classList.remove('active');
            terminalTab.classList.add('active');
            buffersContent.classList.remove('active');
            terminalContent.classList.add('active');

            // Focus terminal input when switching to terminal
            setTimeout(() => {
                const terminalInput = document.getElementById('terminal-input');
                if (terminalInput) terminalInput.focus();
            }, 100);
        }
    }

    /**
     * Handle terminal input
     */
    handleInput(event) {
        // Handle Ctrl+Space for quick actions
        if (event.ctrlKey && event.code === 'Space') {
            event.preventDefault();
            this.toggleQuickActions();
            return;
        }

        // Handle quick actions menu navigation
        if (this.quickActionsVisible) {
            if (event.key === 'Escape') {
                event.preventDefault();
                this.hideQuickActions();
                return;
            } else if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.navigateQuickActions(-1);
                return;
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.navigateQuickActions(1);
                return;
            } else if (event.key === 'Enter') {
                event.preventDefault();
                this.executeQuickAction();
                return;
            } else if (event.key.length === 1) {
                // Handle numeric shortcuts for commands panel
                if (/^[1-6]$/.test(event.key)) {
                    event.preventDefault();
                    const commandIndex = parseInt(event.key) - 1;
                    const commands = this.contextualCommands[this.currentContext] || this.contextualCommands.default;
                    if (commands[commandIndex]) {
                        this.executeCommand(commands[commandIndex].command);
                        this.hideCommandsPanel();
                    }
                    return;
                }
            }
        }

        // Handle autocomplete suggestions navigation
        if (this.suggestions.length > 0) {
            if (event.key === 'ArrowUp') {
                event.preventDefault();
                this.navigateSuggestions(-1);
                return;
            } else if (event.key === 'ArrowDown') {
                event.preventDefault();
                this.navigateSuggestions(1);
                return;
            } else if (event.key === 'Tab' || event.key === 'Enter') {
                if (this.suggestionIndex >= 0) {
                    event.preventDefault();
                    this.selectSuggestion();
                    return;
                }
            } else if (event.key === 'Escape') {
                this.hideSuggestions();
                return;
            }
        }

        if (event.key === 'Enter') {
            const input = event.target;
            const command = input.value.trim();

            if (command) {
                // Add to history
                this.history.push(command);
                this.historyIndex = this.history.length;

                // Execute command
                this.executeCommand(command);
            }

            input.value = '';
            this.hideSuggestions();
        } else if (event.key === 'ArrowUp' && this.suggestions.length === 0) {
            event.preventDefault();
            if (this.historyIndex > 0) {
                this.historyIndex--;
                event.target.value = this.history[this.historyIndex];
            }
        } else if (event.key === 'ArrowDown' && this.suggestions.length === 0) {
            event.preventDefault();
            if (this.historyIndex < this.history.length - 1) {
                this.historyIndex++;
                event.target.value = this.history[this.historyIndex];
            } else {
                this.historyIndex = this.history.length;
                event.target.value = '';
            }
        }
    }

    /**
     * Execute terminal command
     */
    executeCommand(commandLine) {
        const output = document.getElementById('terminal-output');
        if (!output) {
            console.error('Terminal output element not found');
            return;
        }

        // Add command to output
        const commandDiv = document.createElement('div');
        commandDiv.className = 'terminal-line';
        commandDiv.innerHTML = `
            <span class="terminal-prompt">csv-analyzer:~$ </span>
            <span class="terminal-text">${this.escapeHtml(commandLine)}</span>
        `;
        output.appendChild(commandDiv);

        // Parse command and arguments
        const parts = commandLine.split(' ');
        const command = parts[0].toLowerCase();
        const args = parts.slice(1);

        // Execute command
        let result = '';
        let resultClass = 'terminal-text';

        if (this.commands[command]) {
            try {
                result = this.commands[command].execute(args);
                resultClass = 'terminal-success';
            } catch (error) {
                result = `Error executing command: ${error.message}`;
                resultClass = 'terminal-error';
                console.error('Terminal command error:', error);
            }
        } else {
            result = `Command not found: ${command}. Type 'help' for available commands.`;
            resultClass = 'terminal-error';
        }

        // Add result to output
        if (result) {
            const lines = result.split('\n');
            lines.forEach(line => {
                const resultDiv = document.createElement('div');
                resultDiv.className = 'terminal-line';

                // Create a span for the result class
                const resultSpan = document.createElement('span');
                resultSpan.className = resultClass;

                // Parse colors and set innerHTML directly
                const coloredLine = this.parseColorCodes(line);
                resultSpan.innerHTML = coloredLine;

                resultDiv.appendChild(resultSpan);
                output.appendChild(resultDiv);
            });
        }

        // Scroll to bottom
        output.scrollTop = output.scrollHeight;

        // Update context based on executed command
        this.detectContext(command);
    }

    /**
     * Clear terminal output
     */
    clearTerminal() {
        const output = document.getElementById('terminal-output');
        if (output) {
            output.innerHTML = `
                <div class="terminal-line">
                    <span class="terminal-prompt">csv-analyzer:~$ </span>
                    <span class="terminal-text">Terminal cleared</span>
                </div>
            `;
        }
    }

    /**
     * Update theme button
     */
    updateThemeButton() {
        const themeBtn = document.getElementById("theme-btn");
        if (themeBtn && typeof appState !== 'undefined') {
            themeBtn.innerHTML = appState.theme === "dark"
                ? '<i class="fas fa-sun"></i><br>Theme'
                : '<i class="fas fa-moon"></i><br>Theme';
        }
    }

    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Parse ANSI color codes and convert to HTML with CSS classes
     */
    parseColorCodes(text) {
        // First escape HTML to prevent XSS
        let result = this.escapeHtml(text);
        let openTags = [];

        // Handle reset codes first
        result = result.replace(/\x1b\[0m/g, () => {
            const closeTags = openTags.map(() => '</span>').join('');
            openTags = [];
            return closeTags;
        });

        // Handle other color codes
        for (const [ansiCode, cssClass] of Object.entries(this.colorMap)) {
            const regex = new RegExp(this.escapeRegex(ansiCode), 'g');
            result = result.replace(regex, () => {
                openTags.push(cssClass);
                return `<span class="${cssClass}">`;
            });
        }

        // Close any remaining open tags at the end
        if (openTags.length > 0) {
            result += openTags.map(() => '</span>').join('');
        }

        return result;
    }

    /**
     * Escape special regex characters
     */
    escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
     * Helper method to create colored text
     */
    colorText(text, color) {
        if (this.colors[color]) {
            return `${this.colors[color]}${text}${this.colors.reset}`;
        }
        return text;
    }

    /**
     * Helper methods for common colors
     */
    red(text) { return this.colorText(text, 'red'); }
    green(text) { return this.colorText(text, 'green'); }
    yellow(text) { return this.colorText(text, 'yellow'); }
    blue(text) { return this.colorText(text, 'blue'); }
    magenta(text) { return this.colorText(text, 'magenta'); }
    cyan(text) { return this.colorText(text, 'cyan'); }
    white(text) { return this.colorText(text, 'white'); }
    gray(text) { return this.colorText(text, 'gray'); }
    brightRed(text) { return this.colorText(text, 'brightRed'); }
    brightGreen(text) { return this.colorText(text, 'brightGreen'); }
    brightYellow(text) { return this.colorText(text, 'brightYellow'); }
    brightBlue(text) { return this.colorText(text, 'brightBlue'); }
    brightMagenta(text) { return this.colorText(text, 'brightMagenta'); }
    brightCyan(text) { return this.colorText(text, 'brightCyan'); }
    brightWhite(text) { return this.colorText(text, 'brightWhite'); }
    bold(text) { return `${this.colors.bright}${text}${this.colors.reset}`; }
    dim(text) { return `${this.colors.dim}${text}${this.colors.reset}`; }
    underline(text) { return `${this.colors.underscore}${text}${this.colors.reset}`; }

    /**
     * Toggle quick actions menu - now shows commands panel instead
     */
    toggleQuickActions() {
        if (this.quickActionsVisible) {
            this.hideCommandsPanel();
        } else {
            this.showCommandsPanelPopup();
        }
    }

    /**
     * Show quick actions menu
     */
    showQuickActions() {
        this.quickActionsVisible = true;
        this.selectedActionIndex = 0;
        this.renderQuickActions();
    }

    /**
     * Hide quick actions menu
     */
    hideQuickActions() {
        this.quickActionsVisible = false;
        const menu = document.getElementById('quick-actions-menu');
        if (menu) {
            menu.remove();
        }
    }

    /**
     * Navigate quick actions menu
     */
    navigateQuickActions(direction) {
        this.selectedActionIndex += direction;
        if (this.selectedActionIndex < 0) {
            this.selectedActionIndex = this.quickActions.length - 1;
        } else if (this.selectedActionIndex >= this.quickActions.length) {
            this.selectedActionIndex = 0;
        }
        this.renderQuickActions();
    }

    /**
     * Execute selected quick action
     */
    executeQuickAction() {
        const selectedAction = this.quickActions[this.selectedActionIndex];
        if (selectedAction) {
            this.executeCommand(selectedAction.command);
            this.hideQuickActions();
        }
    }

    /**
     * Render quick actions menu
     */
    renderQuickActions() {
        let menu = document.getElementById('quick-actions-menu');
        if (!menu) {
            menu = document.createElement('div');
            menu.id = 'quick-actions-menu';
            menu.className = 'quick-actions-menu';

            const terminalContainer = document.querySelector('.terminal-container') || document.body;
            terminalContainer.appendChild(menu);
        }

        const header = `${this.bold(this.brightCyan('Quick Actions (Ctrl+Space)'))}`;
        const instructions = `${this.gray('Use ↑↓ arrows, Enter to select, or press letter key')}`;

        const actionItems = this.quickActions.map((action, index) => {
            const isSelected = index === this.selectedActionIndex;
            const prefix = isSelected ? this.brightYellow('► ') : '  ';
            const keyHighlight = this.brightMagenta(`[${action.key.toUpperCase()}]`);
            const label = isSelected ? this.brightWhite(action.label) : this.gray(action.label);
            const description = isSelected ? this.brightYellow(action.description) : this.white(action.description);

            return `${prefix}${keyHighlight} ${label} ${this.gray('-')} ${description}`;
        }).join('\n');

        const menuContent = `
            <div class="quick-actions-header">${header}</div>
            <div class="quick-actions-instructions">${instructions}</div>
            <div class="quick-actions-separator">${this.dim('─'.repeat(50))}</div>
            <div class="quick-actions-list">${actionItems}</div>
            <div class="quick-actions-separator">${this.dim('─'.repeat(50))}</div>
            <div class="quick-actions-footer">${this.dim('Press Escape to close')}</div>
        `;

        menu.innerHTML = this.parseColorCodes(menuContent);
    }

    /**
     * Initialize commands panel - now hidden by default
     */
    initializeCommandsPanel() {
        this.commandsPanel = document.createElement('div');
        this.commandsPanel.id = 'commands-panel';
        this.commandsPanel.className = 'commands-panel commands-panel-popup';
        this.commandsPanel.style.display = 'none';

        // Add to body for popup positioning
        document.body.appendChild(this.commandsPanel);

        this.updateCommandsPanel();
    }

    /**
     * Update commands panel based on current context - compact version
     */
    updateCommandsPanel() {
        if (!this.commandsPanel) return;

        const commands = this.contextualCommands[this.currentContext] || this.contextualCommands.default;
        const contextName = this.getContextDisplayName(this.currentContext);

        // Create header element
        const headerDiv = document.createElement('div');
        headerDiv.className = 'commands-panel-header';

        const titleSpan = document.createElement('span');
        titleSpan.className = 'commands-panel-title';
        titleSpan.innerHTML = this.parseColorCodes(this.brightCyan('Quick Commands'));

        const contextSpan = document.createElement('span');
        contextSpan.className = 'commands-panel-context';
        contextSpan.innerHTML = this.parseColorCodes(this.gray(contextName));

        headerDiv.appendChild(titleSpan);
        headerDiv.appendChild(contextSpan);

        // Create command buttons
        const buttonsContainer = document.createElement('div');
        commands.slice(0, 6).forEach((cmd, index) => {
            const shortcut = String(index + 1);
            const button = document.createElement('button');

            // Add type-specific classes
            const baseClass = 'command-btn-compact';
            const typeClass = cmd.type ? `command-type-${cmd.type}` : '';
            button.className = `${baseClass} ${typeClass}`.trim();

            button.title = cmd.description;
            button.onclick = () => this.executeCommandFromPanel(cmd.command);

            const shortcutSpan = document.createElement('span');
            shortcutSpan.className = 'command-shortcut';
            shortcutSpan.textContent = shortcut;

            const iconSpan = document.createElement('span');
            iconSpan.className = 'command-icon';
            if (cmd.icon.startsWith('fas ')) {
                iconSpan.innerHTML = `<i class="${cmd.icon}"></i>`;
            } else {
                iconSpan.textContent = cmd.icon;
            }

            const textSpan = document.createElement('span');
            textSpan.className = 'command-text';
            textSpan.textContent = cmd.command;

            // Add type indicator for undo/back commands
            if (cmd.type === 'undo' || cmd.type === 'back') {
                const typeIndicator = document.createElement('span');
                typeIndicator.className = 'command-type-indicator';
                typeIndicator.textContent = cmd.type === 'undo' ? '↶' : '←';
                button.appendChild(typeIndicator);
            }

            button.appendChild(shortcutSpan);
            button.appendChild(iconSpan);
            button.appendChild(textSpan);
            buttonsContainer.appendChild(button);
        });

        // Create footer element
        const footerDiv = document.createElement('div');
        footerDiv.className = 'commands-panel-footer';
        footerDiv.innerHTML = this.parseColorCodes(this.dim('Press 1-6 • ESC'));

        // Clear panel and add elements
        this.commandsPanel.innerHTML = '';
        this.commandsPanel.appendChild(headerDiv);
        this.commandsPanel.appendChild(buttonsContainer);
        this.commandsPanel.appendChild(footerDiv);
    }

    /**
     * Get display name for context
     */
    getContextDisplayName(context) {
        const names = {
            'default': 'General',
            'data_loaded': 'Data Management',
            'driver_mode': 'Driver Management',
            'notifications': 'Notifications',
            'colors': 'Color System'
        };
        return names[context] || context;
    }

    /**
     * Set current context and update panel
     */
    setContext(context) {
        this.currentContext = context;
        this.updateCommandsPanel();
    }

    /**
     * Detect context based on app state and last command
     */
    detectContext(lastCommand = '') {
        let newContext = 'default';

        // Check if data is loaded
        if (typeof appState !== 'undefined' && appState.allData && appState.allData.length > 0) {
            newContext = 'data_loaded';
        }

        // Check specific command contexts
        if (lastCommand.startsWith('driver')) {
            newContext = 'driver_mode';
        } else if (lastCommand.includes('notification') || lastCommand === 'notify') {
            newContext = 'notifications';
        } else if (['colors', 'rainbow', 'colortest'].includes(lastCommand)) {
            newContext = 'colors';
        }

        // Only update if context changed
        if (newContext !== this.currentContext) {
            this.setContext(newContext);
        }
    }

    /**
     * Execute command from panel button
     */
    executeCommandFromPanel(command) {
        // Focus terminal input
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput) {
            terminalInput.focus();
        }

        // Execute the command
        this.executeCommand(command);
    }

    /**
     * Toggle commands panel visibility
     */
    toggleCommandsPanel() {
        if (!this.commandsPanel) return;

        const isHidden = this.commandsPanel.style.display === 'none';
        this.commandsPanel.style.display = isHidden ? 'block' : 'none';
    }

    /**
     * Show commands panel
     */
    showCommandsPanel() {
        if (this.commandsPanel) {
            this.commandsPanel.style.display = 'block';
        }
    }

    /**
     * Hide commands panel
     */
    hideCommandsPanel() {
        if (this.commandsPanel) {
            this.commandsPanel.style.display = 'none';
            this.quickActionsVisible = false;
        }
    }

    /**
     * Show commands panel as popup (triggered by Ctrl+Space)
     */
    showCommandsPanelPopup() {
        this.quickActionsVisible = true;
        this.updateCommandsPanel();
        if (this.commandsPanel) {
            this.commandsPanel.style.display = 'block';
        }
    }

    /**
     * Add custom command
     */
    addCommand(name, description, executeFunction) {
        this.commands[name] = {
            description: description,
            execute: executeFunction
        };
    }

    /**
     * Remove command
     */
    removeCommand(name) {
        delete this.commands[name];
    }

    /**
     * Get command list
     */
    getCommands() {
        return Object.keys(this.commands);
    }

    /**
     * Add notification to terminal
     */
    addNotification(type, message, autoShow = true) {
        const notification = {
            id: Date.now() + Math.random(),
            type: type,
            message: message,
            timestamp: Date.now()
        };

        this.notifications.push(notification);

        // Limit notifications to prevent memory issues
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(-this.maxNotifications);
        }

        // Auto-show notification in terminal if it's active
        if (autoShow && this.isTerminalActive()) {
            this.showNotificationInTerminal(notification);
        }

        return notification;
    }

    /**
     * Show notification directly in terminal output
     */
    showNotificationInTerminal(notification) {
        const output = document.getElementById('terminal-output');
        if (!output) return;

        const timestamp = new Date(notification.timestamp).toLocaleTimeString();
        const icon = this.getNotificationIcon(notification.type);
        const cssClass = `terminal-${notification.type}`;

        const notificationDiv = document.createElement('div');
        notificationDiv.className = 'terminal-line terminal-notification';
        notificationDiv.innerHTML = `
            <span class="terminal-timestamp">[${timestamp}]</span>
            <span class="${cssClass}">${icon} ${this.escapeHtml(notification.message)}</span>
        `;

        output.appendChild(notificationDiv);
        output.scrollTop = output.scrollHeight;
    }

    /**
     * Get icon for notification type
     */
    getNotificationIcon(type) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅'
        };
        return icons[type] || 'ℹ️';
    }

    /**
     * Check if terminal is currently active
     */
    isTerminalActive() {
        const terminalContent = document.getElementById('terminal-content');
        return terminalContent && terminalContent.classList.contains('active');
    }

    /**
     * Get recent notifications
     */
    getNotifications(count = 10) {
        return this.notifications.slice(-count);
    }

    /**
     * Clear notifications
     */
    clearNotifications() {
        const count = this.notifications.length;
        this.notifications = [];
        return count;
    }

    /**
     * Initialize driver system
     */
    initializeDriverSystem() {
        if (!localStorage.getItem('csv_drivers')) {
            const defaultDrivers = [
                { name: "Jan Kowalski", license: "ABC123456", phone: "+48 123 456 789", id: "driver_1" },
                { name: "Anna Nowak", license: "DEF789012", phone: "+48 987 654 321", id: "driver_2" },
                { name: "Piotr Wiśniewski", license: "GHI345678", phone: "+48 555 666 777", id: "driver_3" },
                { name: "Maria Wójcik", license: "JKL901234", phone: "+48 111 222 333", id: "driver_4" }
            ];
            localStorage.setItem('csv_drivers', JSON.stringify(defaultDrivers));
        }
    }

    /**
     * Get all drivers
     */
    getDrivers() {
        this.initializeDriverSystem();
        return JSON.parse(localStorage.getItem('csv_drivers') || '[]');
    }

    /**
     * Save drivers to localStorage
     */
    saveDrivers(drivers) {
        localStorage.setItem('csv_drivers', JSON.stringify(drivers));
    }

    /**
     * List all drivers
     */
    listDrivers() {
        const drivers = this.getDrivers();
        if (drivers.length === 0) {
            return "No drivers registered in the system.";
        }

        const driverList = drivers.map((driver, index) => {
            const phone = driver.phone ? ` | ${driver.phone}` : '';
            return `  ${(index + 1).toString().padEnd(3)} ${driver.name.padEnd(20)} ${driver.license.padEnd(12)}${phone}`;
        }).join('\n');

        return `Registered Drivers (${drivers.length}):\n  #   Name                 License     Phone\n${driverList}`;
    }

    /**
     * Add new driver
     */
    addDriver(name, license, phone = '') {
        const drivers = this.getDrivers();

        // Check if driver already exists
        if (drivers.some(d => d.name.toLowerCase() === name.toLowerCase())) {
            return `Driver "${name}" already exists.`;
        }

        if (drivers.some(d => d.license === license)) {
            return `License "${license}" is already assigned to another driver.`;
        }

        const newDriver = {
            name: name,
            license: license,
            phone: phone,
            id: `driver_${Date.now()}`
        };

        drivers.push(newDriver);
        this.saveDrivers(drivers);

        this.addNotification('success', `Driver "${name}" added successfully`);
        return `Driver "${name}" added successfully with license ${license}`;
    }

    /**
     * Remove driver
     */
    removeDriver(name) {
        const drivers = this.getDrivers();
        const driverIndex = drivers.findIndex(d => d.name.toLowerCase() === name.toLowerCase());

        if (driverIndex === -1) {
            return `Driver "${name}" not found.`;
        }

        const removedDriver = drivers.splice(driverIndex, 1)[0];
        this.saveDrivers(drivers);

        this.addNotification('info', `Driver "${name}" removed from system`);
        return `Driver "${removedDriver.name}" removed successfully.`;
    }

    /**
     * Show driver info
     */
    showDriverInfo(name) {
        const drivers = this.getDrivers();
        const driver = drivers.find(d => d.name.toLowerCase() === name.toLowerCase());

        if (!driver) {
            return `Driver "${name}" not found.`;
        }

        return `Driver Information:
  Name: ${driver.name}
  License: ${driver.license}
  Phone: ${driver.phone || 'Not provided'}
  ID: ${driver.id}`;
    }

    /**
     * Assign driver to CSV row
     */
    assignDriver(rowIndex, driverName) {
        if (typeof appState === 'undefined' || !appState.allData) {
            return "CSV data not available";
        }

        if (rowIndex < 0 || rowIndex >= appState.allData.length) {
            return `Invalid row index. Available rows: 0-${appState.allData.length - 1}`;
        }

        const drivers = this.getDrivers();
        const driver = drivers.find(d => d.name.toLowerCase() === driverName.toLowerCase());

        if (!driver) {
            return `Driver "${driverName}" not found. Use 'driver list' to see available drivers.`;
        }

        // Update the row data
        appState.allData[rowIndex].driverName = driver.name;
        appState.allData[rowIndex].driverLicense = driver.license;

        // Update the table if it exists
        if (typeof populateInputTable === 'function') {
            populateInputTable();
        }

        // Update other views
        if (typeof updateCategoriesTiles === 'function') {
            updateCategoriesTiles();
        }

        this.addNotification('success', `Driver "${driver.name}" assigned to row ${rowIndex}`);
        return `Driver "${driver.name}" assigned to row ${rowIndex} successfully.`;
    }

    /**
     * Add sample driver data to CSV rows
     */
    addSampleDriverData() {
        if (typeof appState === 'undefined' || !appState.allData) {
            return "CSV data not available";
        }

        if (appState.allData.length === 0) {
            return "No CSV rows available to assign drivers to.";
        }

        const drivers = this.getDrivers();
        if (drivers.length === 0) {
            return "No drivers available. Add drivers first using 'driver add [name] [license]'.";
        }

        let assignedCount = 0;
        appState.allData.forEach((row, index) => {
            // Only assign to rows that don't already have a driver
            if (!row.driverName) {
                const randomDriver = drivers[Math.floor(Math.random() * drivers.length)];
                row.driverName = randomDriver.name;
                row.driverLicense = randomDriver.license;
                assignedCount++;
            }
        });

        // Update the table if it exists
        if (typeof populateInputTable === 'function') {
            populateInputTable();
        }

        // Update other views
        if (typeof updateCategoriesTiles === 'function') {
            updateCategoriesTiles();
        }

        this.addNotification('success', `Assigned random drivers to ${assignedCount} rows`);
        return `Successfully assigned random drivers to ${assignedCount} rows.`;
    }

    /**
     * Update autocomplete suggestions based on current input
     */
    updateSuggestions() {
        const value = this.input.value.trim();

        // Show suggestions even for empty input or single characters
        if (value.length === 0) {
            // Show all global suggestions when input is empty
            this.suggestions = this.getGlobalSuggestions();
        } else {
            const lastDot = value.lastIndexOf('.');

            if (lastDot === -1) {
                // Global suggestions - filter by what user typed
                this.suggestions = this.getGlobalSuggestions().filter(s =>
                    s.toLowerCase().startsWith(value.toLowerCase())
                );
            } else {
                // Property suggestions
                const objectPath = value.substring(0, lastDot);
                const property = value.substring(lastDot + 1);
                this.suggestions = this.getPropertySuggestions(objectPath, property);
            }
        }

        this.suggestionIndex = -1;
        this.renderSuggestions();
    }

    /**
     * Get global suggestions - only custom objects as requested
     */
    getGlobalSuggestions() {
        return [
            'help', 'drivers', 'clear', 'panel', 'theme', 'appState'
        ];
    }

    /**
     * Get property suggestions for an object path
     */
    getPropertySuggestions(objectPath, property) {
        const suggestions = [];

        try {
            // Try to evaluate the object path to get its properties
            const obj = this.evaluateObjectPath(objectPath);
            if (obj && typeof obj === 'object') {
                const props = Object.getOwnPropertyNames(obj);
                const filteredProps = props.filter(prop =>
                    prop.toLowerCase().startsWith(property.toLowerCase())
                );
                suggestions.push(...filteredProps);
            }
        } catch (e) {
            // If evaluation fails, return empty suggestions
        }

        return suggestions;
    }

    /**
     * Safely evaluate object path
     */
    evaluateObjectPath(path) {
        try {
            // Only allow access to specific global objects for security
            const allowedGlobals = {
                'help': this.commands.help || null,
                'drivers': this.commands.driver || null,
                'clear': this.commands.clear || null,
                'panel': this.commands.panel || null,
                'theme': this.commands.theme || null,
                'appState': typeof appState !== 'undefined' ? appState : null,
                'helpers': typeof helpers !== 'undefined' ? helpers : null,
                'utils': typeof utils !== 'undefined' ? utils : null,
                'customModal': typeof customModal !== 'undefined' ? customModal : null,
                'notificationSystem': typeof notificationSystem !== 'undefined' ? notificationSystem : null
            };

            const parts = path.split('.');
            let obj = allowedGlobals[parts[0]];

            for (let i = 1; i < parts.length && obj; i++) {
                obj = obj[parts[i]];
            }

            return obj;
        } catch (e) {
            return null;
        }
    }

    /**
     * Render autocomplete suggestions
     */
    renderSuggestions() {
        if (!this.suggestionsContainer) {
            this.createSuggestionsContainer();
        }

        if (this.suggestions.length === 0) {
            this.hideSuggestions();
            return;
        }

        const suggestionItems = this.suggestions.map((suggestion, index) => {
            const isSelected = index === this.suggestionIndex;
            return `<div class="terminal-suggestion ${isSelected ? 'selected' : ''}" data-index="${index}">
                ${suggestion}
            </div>`;
        }).join('');

        this.suggestionsContainer.innerHTML = suggestionItems;
        this.suggestionsContainer.style.display = 'block';

        // Position the suggestions container
        this.positionSuggestions();
    }

    /**
     * Create suggestions container
     */
    createSuggestionsContainer() {
        this.suggestionsContainer = document.createElement('div');
        this.suggestionsContainer.className = 'terminal-suggestions';
        this.suggestionsContainer.style.display = 'none';

        // Add click handlers for suggestions
        this.suggestionsContainer.addEventListener('click', (e) => {
            const suggestionEl = e.target.closest('.terminal-suggestion');
            if (suggestionEl) {
                const index = parseInt(suggestionEl.dataset.index);
                this.selectSuggestion(index);
            }
        });

        // Add to terminal container
        const terminalContainer = document.querySelector('.terminal-container') || document.body;
        terminalContainer.appendChild(this.suggestionsContainer);
    }

    /**
     * Position suggestions container relative to input
     */
    positionSuggestions() {
        if (!this.input || !this.suggestionsContainer) return;

        const inputRect = this.input.getBoundingClientRect();
        const containerRect = this.input.closest('.terminal-container')?.getBoundingClientRect() || { left: 0, top: 0 };
        const viewportHeight = window.innerHeight;

        // Calculate space below and above input
        const spaceBelow = viewportHeight - inputRect.bottom;
        const spaceAbove = inputRect.top;
        const suggestionsHeight = Math.min(200, this.suggestions.length * 32); // Approximate height

        this.suggestionsContainer.style.position = 'absolute';
        this.suggestionsContainer.style.left = `${inputRect.left - containerRect.left}px`;
        this.suggestionsContainer.style.width = `${Math.max(inputRect.width, 200)}px`;

        // Position above input if not enough space below
        if (spaceBelow < suggestionsHeight && spaceAbove > suggestionsHeight) {
            this.suggestionsContainer.style.top = `${inputRect.top - containerRect.top - suggestionsHeight - 1}px`;
            this.suggestionsContainer.classList.add('suggestions-above');
        } else {
            this.suggestionsContainer.style.top = `${inputRect.bottom - containerRect.top + 1}px`;
            this.suggestionsContainer.classList.remove('suggestions-above');
        }
    }

    /**
     * Hide suggestions
     */
    hideSuggestions() {
        if (this.suggestionsContainer) {
            this.suggestionsContainer.style.display = 'none';
        }
        this.suggestions = [];
        this.suggestionIndex = -1;
    }

    /**
     * Navigate suggestions with arrow keys
     */
    navigateSuggestions(direction) {
        if (this.suggestions.length === 0) return;

        this.suggestionIndex += direction;

        if (this.suggestionIndex < -1) {
            this.suggestionIndex = this.suggestions.length - 1;
        } else if (this.suggestionIndex >= this.suggestions.length) {
            this.suggestionIndex = -1;
        }

        this.renderSuggestions();
    }

    /**
     * Select a suggestion
     */
    selectSuggestion(index = this.suggestionIndex) {
        if (index < 0 || index >= this.suggestions.length) return;

        const suggestion = this.suggestions[index];
        const value = this.input.value;
        const lastDot = value.lastIndexOf('.');

        if (lastDot === -1) {
            this.input.value = suggestion;
        } else {
            this.input.value = value.substring(0, lastDot + 1) + suggestion;
        }

        this.hideSuggestions();
        this.input.focus();
    }

    /**
     * Initialize autocomplete system
     */
    initializeAutocomplete() {
        this.input = document.getElementById('terminal-input');
        if (!this.input) return;

        // Add input event listener for autocomplete
        this.input.addEventListener('input', (e) => {
            this.updateSuggestions();
        });

        // Add focus handler - show suggestions immediately when focused
        this.input.addEventListener('focus', () => {
            // Always show suggestions on focus, even for empty input
            this.updateSuggestions();
        });

        // Add click handler - show suggestions when clicked
        this.input.addEventListener('click', () => {
            this.updateSuggestions();
        });

        this.input.addEventListener('blur', (e) => {
            // Delay hiding to allow clicking on suggestions
            setTimeout(() => {
                if (!this.suggestionsContainer?.contains(document.activeElement)) {
                    this.hideSuggestions();
                }
            }, 150);
        });
    }
}

// Create global terminal instance
const csvTerminal = new CSVTerminal();

// Global functions for HTML event handlers
function switchTab(tabName) {
    csvTerminal.switchTab(tabName);
}

function handleTerminalInput(event) {
    csvTerminal.handleInput(event);
}

function clearTerminal() {
    csvTerminal.clearTerminal();
}

// Global notification functions
function sendNotification(type, message) {
    return csvTerminal.addNotification(type, message);
}

function sendInfoNotification(message) {
    return csvTerminal.addNotification('info', message);
}

function sendSuccessNotification(message) {
    return csvTerminal.addNotification('success', message);
}

function sendWarningNotification(message) {
    return csvTerminal.addNotification('warning', message);
}

function sendErrorNotification(message) {
    return csvTerminal.addNotification('error', message);
}

// Initialize terminal when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    csvTerminal.initialize();

    // Send startup notification after a short delay to ensure all systems are ready
    setTimeout(() => {
        csvTerminal.addNotification('info', 'CSV Analyzer Terminal initialized successfully');
        csvTerminal.addNotification('info', 'Type "help" to see available commands');
    }, 1000);
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CSVTerminal;
}
