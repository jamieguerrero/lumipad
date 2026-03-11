# ✈️ Lumilipad

> Scaffold and deploy static sites to Netlify in one command

**Lumilipad** (Tagalog for "flying") takes your static site from zero to deployed in seconds.

## Installation

```bash
npm install -g @jamieguerrero/lumilipad
```

## Quick Start

```bash
# First time setup
lumilipad init

# Deploy a new project
lumilipad sa my-awesome-project
```

## Configuration

Lumilipad stores configuration in `~/.lumilipad/config.json`.

### Interactive Setup

```bash
lumilipad init
```

This prompts you for:
- **GitHub username** — where repos are created
- **Custom domain** — optional base domain for subdomains (e.g. `yourdomain.com`)
- **Git email** — fallback email for commits

### Manual Configuration

```bash
# Set GitHub username (required)
lumilipad config github.username your-username

# Set custom domain base (optional)
lumilipad config netlify.customDomain yourdomain.com

# Set git email (optional)
lumilipad config git.email you@example.com

# View all config
lumilipad config
```

### Config Options

| Key | Description | Example |
|-----|-------------|---------|
| `github.username` | GitHub account for new repos | `jamieguerrero` |
| `netlify.customDomain` | Base domain for subdomains | `jamieguerrero.com` |
| `git.email` | Fallback git email | `me@example.com` |
| `git.name` | Fallback git name | `Lumilipad` |

## Usage

### Commands

| Tagalog | English alias | What it does |
|---|---|---|
| `lumilipad sa <name>` | `lumilipad deploy <name>` | Scaffold, create GitHub repo, deploy to Netlify |
| `lumilipad tanggalin <name>` | `lumilipad remove <name>` | Remove custom subdomain (site stays live on `.netlify.app`) |
| `lumilipad patay <name>` | `lumilipad destroy <name>` | Remove subdomain + delete Netlify site + delete GitHub repo |
| `lumilipad config [key] [value]` | — | View or set configuration |
| `lumilipad init` | — | Interactive setup |

### Deploy a new project

```bash
lumilipad sa my-awesome-project
```

This will:
1. ✨ Scaffold a new project with TokyoNight-themed starter template
2. 📦 Initialize git and create a GitHub repo under your account
3. 🚀 Deploy to Netlify (with optional custom subdomain)
4. ✓ Give you a live URL

## Requirements

- Node.js >= 18
- GitHub CLI (`gh`) installed and authenticated
- Netlify authentication — one of:
  - Run `npx netlify login` once (stores credentials locally)
  - Or set `NETLIFY_AUTH_TOKEN` environment variable (required for containers/CI)

## Authentication Setup

### GitHub
```bash
# Option 1: Interactive login (developer machines)
gh auth login

# Option 2: Personal access token (containers/CI/agents)
export GH_TOKEN="your-token-here"
```

Get a GitHub token at: https://github.com/settings/tokens — requires `repo`, `delete_repo` scopes

### Netlify
```bash
# Option 1: Interactive login (developer machines)
npx netlify login

# Option 2: Personal access token (containers/CI/agents)
export NETLIFY_AUTH_TOKEN="your-token-here"
```

Get a Netlify token at: https://app.netlify.com/user/applications#personal-access-tokens

## What You Get

Each lumilipad project includes:
- Clean HTML/CSS/JS starter with TokyoNight theme
- Responsive design out of the box
- Netlify configuration with security headers
- Git repo with initial commit
- GitHub repo under your username
- Live Netlify deployment

If you configure a custom domain (e.g. `yourdomain.com`), projects deploy to `<name>.yourdomain.com`.

## Example

```bash
$ lumilipad init
✈️  Lumilipad Setup

? GitHub username: jamieguerrero
? Custom domain base: jamieguerrero.com
? Git email: jamie@example.com

✓ Configuration saved!

$ lumilipad sa sunset-vibes

✈️  Lumilipad launching: sunset-vibes

✓ Project scaffolded
✓ Git initialized
✓ GitHub repo created: jamieguerrero/sunset-vibes
✓ Netlify site created
✓ Custom domain set: https://sunset-vibes.jamieguerrero.com
✓ Deployed to https://sunset-vibes.jamieguerrero.com

✓ sunset-vibes is live! 🚀
  https://sunset-vibes.jamieguerrero.com

$ lumilipad tanggalin sunset-vibes
✓ Removed sunset-vibes.jamieguerrero.com — site still live at https://xyz.netlify.app

$ lumilipad patay sunset-vibes
✓ Netlify site deleted: xyz
✓ GitHub repo deleted: jamieguerrero/sunset-vibes
✓ sunset-vibes has been fully removed
```

## License

MIT © Jamie Guerrero
