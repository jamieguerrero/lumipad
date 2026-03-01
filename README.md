# ✈️ Lumipad

> Scaffold and deploy static sites to Netlify in one command

**Lumipad** (Tagalog for "fly") takes your static site from zero to deployed in seconds.

## Installation

```bash
npm install -g @jamieguerrero/lumipad
```

## Usage

### Commands

| Tagalog | English alias | What it does |
|---|---|---|
| `lumipad sa <name>` | `lumipad deploy <name>` | Scaffold, create GitHub repo, deploy to Netlify, set subdomain |
| `lumipad tanggalin <name>` | `lumipad remove <name>` | Remove `<name>.jamieguerrero.com` subdomain (site stays live on `.netlify.app`) |
| `lumipad patay <name>` | `lumipad destroy <name>` | Remove subdomain + delete Netlify site + delete GitHub repo |

### Deploy a new project

```bash
lumipad sa my-awesome-project
```

This will:
1. ✨ Scaffold a new project with TokyoNight-themed starter template
2. 📦 Initialize git and create a GitHub repo under `@jamieguerrero`
3. 🚀 Deploy to Netlify with a custom `my-awesome-project.jamieguerrero.com` domain
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
gh auth login
```

### Netlify
```bash
# Option 1: Interactive login (developer machines)
npx netlify login

# Option 2: Personal access token (containers/CI/agents)
export NETLIFY_AUTH_TOKEN="your-token-here"
```

Get a Netlify token at: https://app.netlify.com/user/applications#personal-access-tokens

## What You Get

Each lumipad project includes:
- Clean HTML/CSS/JS starter with TokyoNight theme
- Responsive design out of the box
- Netlify configuration with security headers
- Git repo with initial commit
- GitHub repo under your username
- Live Netlify deployment at `<name>.jamieguerrero.com`

## Example

```bash
$ lumipad sa sunset-vibes

✈️  Lumipad launching: sunset-vibes

✓ Project scaffolded
✓ Git initialized
✓ GitHub repo created: jamieguerrero/sunset-vibes
✓ Netlify site created
✓ Custom domain set: https://sunset-vibes.jamieguerrero.com
✓ Deployed to https://sunset-vibes.jamieguerrero.com

✓ sunset-vibes is live! 🚀
  https://sunset-vibes.jamieguerrero.com

$ lumipad tanggalin sunset-vibes
✓ Removed sunset-vibes.jamieguerrero.com — site still live at https://xyz.netlify.app

$ lumipad patay sunset-vibes
✓ Netlify site deleted: xyz
✓ GitHub repo deleted: jamieguerrero/sunset-vibes
✓ sunset-vibes has been fully removed
```

## License

MIT © Jamie Guerrero
