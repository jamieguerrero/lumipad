import fs from 'fs/promises';
import path from 'path';
import os from 'os';

const CONFIG_DIR = path.join(os.homedir(), '.lumilipad');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

const DEFAULT_CONFIG = {
  github: {
    username: null,
  },
  netlify: {
    // Netlify account is determined by auth token, but we store domain preferences
    customDomain: null,  // e.g. "jamieguerrero.com" — set to null to skip custom domains
  },
  git: {
    email: null,  // fallback git email if not configured
    name: 'Lumilipad',
  }
};

export async function getConfig() {
  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    return { ...DEFAULT_CONFIG, ...JSON.parse(data) };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export async function setConfig(key, value) {
  const config = await getConfig();
  
  // Handle nested keys like "github.username"
  const keys = key.split('.');
  let obj = config;
  for (let i = 0; i < keys.length - 1; i++) {
    if (!obj[keys[i]]) obj[keys[i]] = {};
    obj = obj[keys[i]];
  }
  obj[keys[keys.length - 1]] = value;
  
  await fs.mkdir(CONFIG_DIR, { recursive: true });
  await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2));
  
  return config;
}

export async function getGitHubUsername() {
  const config = await getConfig();
  return config.github?.username;
}

export async function getCustomDomainBase() {
  const config = await getConfig();
  return config.netlify?.customDomain || null;
}

export async function getGitEmail(fallbackDomain) {
  const config = await getConfig();
  if (config.git?.email) return config.git.email;
  if (fallbackDomain) return `lumilipad@${fallbackDomain}`;
  return 'lumilipad@localhost';
}

export async function getGitName() {
  const config = await getConfig();
  return config.git?.name || 'Lumilipad';
}

export function getConfigPath() {
  return CONFIG_FILE;
}
