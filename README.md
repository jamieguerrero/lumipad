# ✈️ Lumilipad

> Deploy sites to Netlify in one command

**Lumilipad** (Tagalog for "flying") — scaffold new sites or deploy existing ones to Netlify.

## Installation

```bash
npm install -g @jamieguerrero/lumilipad
```

## Quick Start

```bash
# First time setup
lumilipad init

# Deploy a new project (scaffolds from template)
lumilipad sa my-new-site

# Deploy an existing project
lumilipad sa my-existing-site --dir ./dist

# Deploy an SSR app (React Router, Next.js, etc.)
lumilipad sa --ssr
```

## Commands

| Command | Alias | What it does |
|---------|-------|--------------|
| `lumilipad sa <name>` | `deploy` | Deploy project (scaffolds if new, deploys if exists) |
| `lumilipad sa --ssr` | `deploy --ssr` | Deploy SSR app (runs `netlify deploy --prod`) |
| `lumilipad tanggalin <name>` | `remove` | Remove custom subdomain (site stays on `.netlify.app`) |
| `lumilipad patay <name>` | `destroy` | Delete subdomain + Netlify site + GitHub repo |
| `lumilipad config [key] [val]` | — | View/set configuration |
| `lumilipad init` | — | Interactive setup wizard |

## Usage Examples

### New static site from template
```bash
lumilipad sa my-cool-site
```
Creates `./my-cool-site`, scaffolds template, creates GitHub repo, deploys to Netlify.

### Deploy existing static directory
```bash
# Directory exists at ./my-app
lumilipad sa my-app

# Or specify a different directory
lumilipad sa my-app --dir ./dist

# Skip GitHub repo creation
lumilipad sa my-app --dir ./build --no-github
```

### Deploy SSR app (React Router, Next.js, etc.)
```bash
cd ~/src/dragonboat-manager

# Production deploy
lumilipad sa --ssr

# Preview deploy
lumilipad sa --ssr --preview
```

### Remove/destroy
```bash
# Remove subdomain only (site stays alive on .netlify.app)
lumilipad tanggalin my-app

# Nuke everything (subdomain + site + repo)
lumilipad patay my-app
```

## Configuration

Config stored in `~/.lumilipad/config.json`.

### Interactive Setup
```bash
lumilipad init
```

### Manual Configuration
```bash
# Required: GitHub username
lumilipad config github.username your-username

# Optional: Custom domain base (for subdomains)
lumilipad config netlify.customDomain yourdomain.com

# Optional: Git email for commits
lumilipad config git.email you@example.com

# View all config
lumilipad config
```

### Config Options

| Key | Required | Description |
|-----|----------|-------------|
| `github.username` | ✅ Yes | GitHub account for new repos |
| `netlify.customDomain` | No | Base domain (e.g. `jamieguerrero.com`) |
| `git.email` | No | Fallback git email |
| `git.name` | No | Fallback git name |

## Auth Requirements

- **GitHub**: `gh auth login` or `GH_TOKEN` env var
- **Netlify**: `npx netlify login` or `NETLIFY_AUTH_TOKEN` env var

## Which command for what?

| Scenario | Command |
|----------|---------|
| Brand new static site | `lumilipad sa my-site` |
| Existing HTML/CSS/JS | `lumilipad sa my-site --dir .` |
| Built React/Vue SPA | `npm run build && lumilipad sa my-app --dir ./dist` |
| SSR app (dragonboat-manager) | `lumilipad sa --ssr` |
| Preview deploy (SSR) | `lumilipad sa --ssr --preview` |

## License

MIT © Jamie Guerrero
