# Harvest Time Tracker - Safari Extension

A Safari web extension for Harvest time tracking, built with AI-assisted "vibe coding".

## Features

- **One-click time tracking** with project & task selection
- **7 languages** supported (EN, DE, ES, FR, IT, PT, NL)
- **External timer sync** (30-second polling with Harvest desktop app)
- **Project management integration** (GitHub, Trello, Asana, Basecamp)
- **Keyboard shortcut** `Cmd+Shift+H` for quick access
- **Smart suggestions** based on current webpage
- **Client-grouped projects** for better organization
- **Real-time badge** showing timer in toolbar

## 🎨 Vibe Coded

Built with **intuitive iteration** and **AI pair programming**:

- Organic feature evolution from real needs
- AI-assisted (GitHub Copilot) for rapid prototyping
- UX-first approach, structure added retroactively
- Comprehensive tests ensure quality

## Installation

1. Clone or download this repository
2. Open Safari and enable `Develop` menu in `Preferences > Advanced`
3. Go to `Develop > Allow Unsigned Extensions`
4. Open `Safari > Preferences > Extensions`
5. Click `+` button and select the extension folder
6. Enable the Harvest Time Tracker extension

### Configuration

1. Click the extension icon in Safari's toolbar
2. Enter your Harvest subdomain (e.g., "yourcompany")
3. Add your Personal Access Token from `Settings > Developer > Personal Access Tokens` in Harvest
4. Click "Connect to Harvest"

## Usage

1. Click the extension icon
2. Select a project and task
3. Enter a description (optional)
4. Start tracking

**Keyboard shortcut**: `Cmd+Shift+H` for quick access

## Development

```bash
npm install      # Install dependencies
npm test         # Run tests
npm run package  # Create .zip for distribution
```

### Tech Stack

- Vanilla JavaScript (ES6+), no frameworks
- Harvest v2 REST API
- Vitest for testing
- Custom i18n system

## Security

- Secure local storage for tokens
- XSS/SQL injection prevention
- Input validation on all user inputs
- No data collection or third-party tracking

## Troubleshooting

**Connection failed**: Verify subdomain and token validity  
**Timer not syncing**: Check API credentials  
**Buttons not appearing**: Refresh page after installation

For debug logs: `Develop > Web Extension Background Pages > Harvest Time Tracker`

## License

MIT License - See [LICENSE](LICENSE) file for details.

---

**Note**: Unofficial extension, not affiliated with Harvest. Inspired by the official Chrome extension.
