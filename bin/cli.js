#!/usr/bin/env node

import { Command } from 'commander';
import { scaffold } from '../src/scaffold.js';
import { deploy, deployExisting, removeCustomDomain, destroyProject, getDeployedUrl } from '../src/deploy.js';
import { getConfig, setConfig, getConfigPath, getGitHubUsername } from '../src/config.js';
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

const program = new Command();

program
  .name('lumilipad')
  .description('Deploy sites to Netlify')
  .version('0.1.0');

// sa = "to/towards" — the one deploy command
// aliases: deploy
program
  .command('sa')
  .alias('deploy')
  .description('Deploy a project to Netlify (scaffolds if new, deploys if exists)')
  .argument('[project-name]', 'Project name (optional for --ssr in current directory)')
  .option('--ssr', 'Deploy SSR app (uses npx netlify deploy)')
  .option('--preview', 'Create preview deploy instead of production (SSR only)')
  .option('-d, --dir <path>', 'Directory to deploy (for existing projects)')
  .option('--no-github', 'Skip creating a GitHub repo')
  .action(async (projectName, options) => {
    try {
      const { execa } = await import('execa');
      
      // SSR mode: just run netlify deploy
      if (options.ssr) {
        const deployDir = options.dir || '.';
        console.log(chalk.blue(`\n✈️  ${options.preview ? 'Preview' : 'Production'} SSR deploy starting...\n`));
        
        const args = ['netlify', 'deploy'];
        if (!options.preview) {
          args.push('--prod');
        }
        
        await execa('npx', args, { 
          stdio: 'inherit',
          cwd: path.resolve(deployDir)
        });
        return;
      }
      
      // Non-SSR modes require a project name
      if (!projectName) {
        console.error(chalk.red('\n✗ Project name required (unless using --ssr)\n'));
        process.exit(1);
      }
      
      // Check if GitHub username is configured
      const ghUser = await getGitHubUsername();
      if (!ghUser && options.github) {
        console.error(chalk.red('\n✗ GitHub username not configured.'));
        console.error(chalk.yellow('  Run: lumilipad config github.username <your-username>'));
        console.error(chalk.yellow('  Or use --no-github to skip repo creation\n'));
        process.exit(1);
      }
      
      // Check if project/directory exists
      const targetDir = options.dir || projectName;
      const dirExists = fs.existsSync(path.resolve(targetDir));
      
      if (dirExists) {
        // Deploy existing directory
        console.log(chalk.blue(`\n✈️  Lumilipad deploying existing: ${projectName}\n`));
        const deployedUrl = await deployExisting(targetDir, projectName, { createGitHubRepo: options.github });
        console.log(chalk.green(`\n✓ ${projectName} is live! 🚀`));
        console.log(chalk.cyan(`  ${deployedUrl}\n`));
      } else {
        // Scaffold new project
        if (!ghUser) {
          console.error(chalk.red('\n✗ GitHub username not configured.'));
          console.error(chalk.yellow('  Run: lumilipad config github.username <your-username>\n'));
          process.exit(1);
        }
        
        console.log(chalk.blue(`\n✈️  Lumilipad launching new: ${projectName}\n`));
        const projectPath = await scaffold(projectName);
        const deployedUrl = await deploy(projectPath, projectName);
        console.log(chalk.green(`\n✓ ${projectName} is live! 🚀`));
        console.log(chalk.cyan(`  ${deployedUrl}\n`));
      }
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// tanggalin = "to remove" — remove the custom domain from a site
// aliases: remove
program
  .command('tanggalin')
  .alias('remove')
  .description('Remove the custom domain from a deployed site')
  .argument('<project-name>', 'Project whose custom domain should be removed')
  .action(async (projectName) => {
    try {
      console.log(chalk.blue(`\n🗑  Removing domain for: ${projectName}\n`));
      await removeCustomDomain(projectName);
      console.log(chalk.green(`\n✓ Custom domain removed from ${projectName}\n`));
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// patay = "dead/kill" — destroy everything: subdomain, Netlify site, GitHub repo
// aliases: destroy
program
  .command('patay')
  .alias('destroy')
  .description('Delete the custom domain, Netlify site, and GitHub repo')
  .argument('<project-name>', 'Project to fully destroy')
  .action(async (projectName) => {
    try {
      console.log(chalk.red(`\n💀 Destroying: ${projectName}\n`));
      await destroyProject(projectName);
      console.log(chalk.green(`\n✓ ${projectName} has been fully removed\n`));
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// config — view or set configuration
program
  .command('config')
  .description('View or set configuration')
  .argument('[key]', 'Config key (e.g. github.username, netlify.customDomain)')
  .argument('[value]', 'Value to set')
  .action(async (key, value) => {
    try {
      if (!key) {
        // Show all config
        const config = await getConfig();
        console.log(chalk.blue('\n⚙️  Lumilipad Configuration\n'));
        console.log(chalk.gray(`   Config file: ${getConfigPath()}\n`));
        console.log(JSON.stringify(config, null, 2));
        console.log();
      } else if (!value) {
        // Show specific key
        const config = await getConfig();
        const keys = key.split('.');
        let val = config;
        for (const k of keys) {
          val = val?.[k];
        }
        if (val === undefined || val === null) {
          console.log(chalk.yellow(`\n${key} is not set\n`));
        } else {
          console.log(chalk.green(`\n${key} = ${val}\n`));
        }
      } else {
        // Set value
        await setConfig(key, value);
        console.log(chalk.green(`\n✓ Set ${key} = ${value}\n`));
      }
    } catch (error) {
      console.error(chalk.red(`\n✗ Error: ${error.message}\n`));
      process.exit(1);
    }
  });

// init — interactive setup
program
  .command('init')
  .description('Interactive setup for lumilipad')
  .action(async () => {
    const inquirer = (await import('inquirer')).default;
    
    console.log(chalk.blue('\n✈️  Lumilipad Setup\n'));
    
    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'githubUsername',
        message: 'GitHub username:',
        validate: (input) => input.length > 0 || 'Required',
      },
      {
        type: 'input',
        name: 'customDomain',
        message: 'Custom domain base (e.g. yourdomain.com, leave empty to skip):',
      },
      {
        type: 'input',
        name: 'gitEmail',
        message: 'Git email for commits (leave empty for default):',
      },
    ]);
    
    await setConfig('github.username', answers.githubUsername);
    
    if (answers.customDomain) {
      await setConfig('netlify.customDomain', answers.customDomain);
    }
    
    if (answers.gitEmail) {
      await setConfig('git.email', answers.gitEmail);
    }
    
    console.log(chalk.green('\n✓ Configuration saved!\n'));
    console.log(chalk.gray(`  Config file: ${getConfigPath()}\n`));
  });

program.parse();
