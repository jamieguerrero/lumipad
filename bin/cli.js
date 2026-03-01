#!/usr/bin/env node

import { Command } from 'commander';
import { scaffold } from '../src/scaffold.js';
import { deploy, removeCustomDomain, destroyProject } from '../src/deploy.js';
import chalk from 'chalk';

const program = new Command();

program
  .name('lumipad')
  .description('Scaffold and deploy static sites to Netlify')
  .version('0.1.0');

// sa = "to/towards" — deploy a new project
// aliases: deploy
program
  .command('sa')
  .alias('deploy')
  .description('Scaffold and deploy a new project')
  .argument('<project-name>', 'Project name')
  .action(async (projectName) => {
    try {
      console.log(chalk.blue(`\n✈️  Lumipad launching: ${projectName}\n`));

      const projectPath = await scaffold(projectName);
      await deploy(projectPath, projectName);

      console.log(chalk.green(`\n✓ ${projectName} is live! 🚀`));
      console.log(chalk.cyan(`  https://${projectName}.jamieguerrero.com\n`));
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

program.parse();
