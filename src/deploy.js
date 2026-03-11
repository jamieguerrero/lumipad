import { execa } from 'execa';
import chalk from 'chalk';
import ora from 'ora';
import { getGitHubUsername, getCustomDomainBase, getGitEmail, getGitName } from './config.js';

async function findSite(projectName, token, customDomainBase) {
  const { stdout } = await execa('curl', [
    '-s',
    'https://api.netlify.com/api/v1/sites',
    '-H', `Authorization: Bearer ${token}`
  ]);
  const sites = JSON.parse(stdout);
  
  // Try to find by custom domain first, then by name
  if (customDomainBase) {
    const customDomain = `${projectName}.${customDomainBase}`;
    const byDomain = sites.find(s => s.custom_domain === customDomain);
    if (byDomain) return byDomain;
  }
  
  return sites.find(s => s.name === projectName);
}

export async function removeCustomDomain(projectName) {
  const customDomainBase = await getCustomDomainBase();
  
  if (!customDomainBase) {
    throw new Error('No custom domain configured. Nothing to remove.');
  }
  
  const customDomain = `${projectName}.${customDomainBase}`;
  const spinner = ora(`Looking up site for ${customDomain}`).start();

  const token = await getNetlifyToken();
  const site = await findSite(projectName, token, customDomainBase);

  if (!site) {
    spinner.fail(chalk.red(`No site found for: ${projectName}`));
    throw new Error(`Site not found for ${projectName}`);
  }

  spinner.text = `Removing custom domain from ${site.name}`;

  await execa('curl', [
    '-s', '-X', 'PUT',
    `https://api.netlify.com/api/v1/sites/${site.id}`,
    '-H', 'Content-Type: application/json',
    '-H', `Authorization: Bearer ${token}`,
    '-d', JSON.stringify({ custom_domain: null })
  ]);

  spinner.succeed(chalk.green(`Removed ${customDomain} — site still live at https://${site.name}.netlify.app`));
}

export async function destroyProject(projectName) {
  const token = await getNetlifyToken();
  const customDomainBase = await getCustomDomainBase();
  const githubUsername = await getGitHubUsername();

  // Step 1: Find and delete the Netlify site (also removes the custom domain)
  const spinner = ora(`Looking up Netlify site for ${projectName}`).start();
  const site = await findSite(projectName, token, customDomainBase);

  if (!site) {
    spinner.fail(chalk.red(`No Netlify site found for: ${projectName}`));
    throw new Error(`Site not found for ${projectName}`);
  }

  spinner.text = `Deleting Netlify site: ${site.name}`;
  await execa('curl', [
    '-s', '-X', 'DELETE',
    `https://api.netlify.com/api/v1/sites/${site.id}`,
    '-H', `Authorization: Bearer ${token}`
  ]);
  spinner.succeed(chalk.green(`Netlify site deleted: ${site.name}`));

  // Step 2: Delete the GitHub repo
  if (githubUsername) {
    const repoSpinner = ora(`Deleting GitHub repo: ${githubUsername}/${projectName}`).start();
    try {
      await execa('gh', ['repo', 'delete', `${githubUsername}/${projectName}`, '--yes']);
      repoSpinner.succeed(chalk.green(`GitHub repo deleted: ${githubUsername}/${projectName}`));
    } catch (error) {
      repoSpinner.warn(chalk.yellow(`Could not delete GitHub repo (${error.message})`));
    }
  }
}

export async function deploy(projectPath, projectName) {
  const customDomainBase = await getCustomDomainBase();
  
  // Step 1: Initialize git repo
  await initGit(projectPath);

  // Step 2: Create GitHub repo and push
  await createGitHubRepo(projectPath, projectName);

  // Step 3: Create Netlify site via API and link
  const { siteId, netlifyUrl } = await createNetlifySite(projectPath, projectName);

  // Step 4: Set custom domain if configured
  let finalUrl = netlifyUrl;
  if (customDomainBase) {
    const customUrl = await setCustomDomain(projectPath, projectName, siteId, customDomainBase);
    if (customUrl) finalUrl = customUrl;
  }

  // Step 5: Trigger initial deploy
  await triggerDeploy(projectPath, projectName, siteId, finalUrl);
  
  return finalUrl;
}

export async function deployExisting(projectPath, projectName, options = {}) {
  const { createGitHubRepo: shouldCreateRepo = true } = options;
  const customDomainBase = await getCustomDomainBase();
  const path = await import('path');
  const resolvedPath = path.resolve(projectPath);
  
  // Step 1: Initialize git if not already a repo
  await initGitIfNeeded(resolvedPath);

  // Step 2: Create GitHub repo and push (optional)
  if (shouldCreateRepo) {
    await createGitHubRepo(resolvedPath, projectName);
  }

  // Step 3: Create Netlify site via API and link
  const { siteId, netlifyUrl } = await createNetlifySite(resolvedPath, projectName);

  // Step 4: Set custom domain if configured
  let finalUrl = netlifyUrl;
  if (customDomainBase) {
    const customUrl = await setCustomDomain(projectPath, projectName, siteId, customDomainBase);
    if (customUrl) finalUrl = customUrl;
  }

  // Step 5: Trigger initial deploy
  await triggerDeploy(projectPath, projectName, siteId, finalUrl);
  
  return finalUrl;
}

export async function getDeployedUrl(projectName) {
  const customDomainBase = await getCustomDomainBase();
  if (customDomainBase) {
    return `https://${projectName}.${customDomainBase}`;
  }
  return `https://${projectName}.netlify.app`;
}

async function initGit(projectPath) {
  const spinner = ora('Initializing git repository').start();
  const customDomainBase = await getCustomDomainBase();

  try {
    await execa('git', ['init'], { cwd: projectPath });

    // Check if git user is configured
    try {
      await execa('git', ['config', 'user.email'], { cwd: projectPath });
    } catch {
      // Set default git config if not already set
      const email = await getGitEmail(customDomainBase);
      const name = await getGitName();
      await execa('git', ['config', 'user.email', email], { cwd: projectPath });
      await execa('git', ['config', 'user.name', name], { cwd: projectPath });
    }

    await execa('git', ['add', '.'], { cwd: projectPath });
    await execa('git', ['commit', '-m', 'Initial commit via lumilipad'], { cwd: projectPath });
    await execa('git', ['branch', '-M', 'main'], { cwd: projectPath });

    spinner.succeed(chalk.green('Git initialized'));
  } catch (error) {
    spinner.fail(chalk.red('Git initialization failed'));
    throw error;
  }
}

async function initGitIfNeeded(projectPath) {
  const spinner = ora('Checking git repository').start();

  try {
    // Check if already a git repo
    await execa('git', ['rev-parse', '--git-dir'], { cwd: projectPath });
    spinner.succeed(chalk.green('Git repository found'));
  } catch {
    // Not a git repo, initialize it
    spinner.text = 'Initializing git repository';
    await initGit(projectPath);
  }
}

async function createGitHubRepo(projectPath, projectName) {
  const spinner = ora('Creating GitHub repository').start();
  const githubUsername = await getGitHubUsername();

  if (!githubUsername) {
    spinner.fail(chalk.red('GitHub username not configured'));
    throw new Error('GitHub username not configured. Run: lumilipad config github.username <your-username>');
  }

  try {
    await execa('gh', [
      'repo',
      'create',
      `${githubUsername}/${projectName}`,
      '--public',
      '--source=.',
      '--push',
      '--description',
      `Created with lumilipad ✈️`
    ], { cwd: projectPath });

    spinner.succeed(chalk.green(`GitHub repo created: ${githubUsername}/${projectName}`));
  } catch (error) {
    spinner.fail(chalk.red('GitHub repo creation failed'));
    throw error;
  }
}

async function createNetlifySite(projectPath, projectName) {
  const spinner = ora('Creating Netlify site').start();

  try {
    // Create the site via Netlify API (non-interactive, no PATH dependency)
    const { stdout } = await execa('npx', [
      'netlify',
      'api',
      'createSite',
      '--data',
      JSON.stringify({ name: projectName })
    ], { cwd: projectPath });

    const site = JSON.parse(stdout);
    const siteId = site.id;
    const netlifyUrl = site.ssl_url || site.url;

    // Link the local project to this Netlify site
    await execa('npx', ['netlify', 'link', '--id', siteId], { cwd: projectPath });

    spinner.succeed(chalk.green(`Netlify site created: ${netlifyUrl}`));
    return { siteId, netlifyUrl };
  } catch (error) {
    spinner.fail(chalk.red('Netlify site creation failed'));
    throw error;
  }
}

async function setCustomDomain(projectPath, projectName, siteId, customDomainBase) {
  const customDomain = `${projectName}.${customDomainBase}`;
  const spinner = ora(`Setting custom domain: ${customDomain}`).start();

  try {
    // Use curl directly — `npx netlify api updateSite` silently ignores custom_domain
    const { stdout } = await execa('curl', [
      '-s', '-X', 'PUT',
      `https://api.netlify.com/api/v1/sites/${siteId}`,
      '-H', 'Content-Type: application/json',
      '-H', `Authorization: Bearer ${await getNetlifyToken()}`,
      '-d', JSON.stringify({ custom_domain: customDomain })
    ]);

    const site = JSON.parse(stdout);
    if (site.custom_domain === customDomain) {
      spinner.succeed(chalk.green(`Custom domain set: https://${customDomain}`));
      return `https://${customDomain}`;
    } else {
      spinner.warn(chalk.yellow(`Domain may not have applied: ${site.errors || 'unknown'}`));
      return null;
    }
  } catch (error) {
    // Non-fatal: log a warning but continue — the .netlify.app URL still works
    spinner.warn(chalk.yellow(`Could not set custom domain (${error.message})`));
    return null;
  }
}

async function getNetlifyToken() {
  // Prefer env var — required for headless/container environments
  if (process.env.NETLIFY_AUTH_TOKEN) {
    return process.env.NETLIFY_AUTH_TOKEN;
  }

  // Fall back to local CLI config (developer machines with `netlify login`)
  const configPath = `${process.env.HOME}/Library/Preferences/netlify/config.json`;
  const { stdout } = await execa('cat', [configPath]);
  const config = JSON.parse(stdout);
  const user = Object.values(config.users)[0];
  return user.auth.token;
}

async function triggerDeploy(projectPath, projectName, siteId, deployUrl) {
  const spinner = ora('Deploying to Netlify').start();

  try {
    // Deploy to production
    await execa('npx', [
      'netlify',
      'deploy',
      '--prod',
      '--dir', '.',
      '--site', siteId
    ], {
      cwd: projectPath
    });

    spinner.succeed(chalk.green(`Deployed to ${deployUrl}`));
  } catch (error) {
    spinner.fail(chalk.red('Deployment failed'));
    throw error;
  }
}
