import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import ora from 'ora';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function scaffold(projectName) {
  const spinner = ora('Creating project files').start();

  const projectPath = path.join(process.cwd(), projectName);

  // Check if directory already exists
  try {
    await fs.access(projectPath);
    spinner.fail(chalk.red(`Directory ${projectName} already exists`));
    throw new Error(`Directory ${projectName} already exists`);
  } catch (err) {
    // Directory doesn't exist, continue
  }

  // Create project directory
  await fs.mkdir(projectPath, { recursive: true });

  // Copy template files
  const templateDir = path.join(__dirname, '../templates');

  // Read template files
  const indexHtml = await fs.readFile(path.join(templateDir, 'index.html'), 'utf-8');
  const styleCss = await fs.readFile(path.join(templateDir, 'style.css'), 'utf-8');
  const scriptJs = await fs.readFile(path.join(templateDir, 'script.js'), 'utf-8');
  const netlifyToml = await fs.readFile(path.join(templateDir, 'netlify.toml'), 'utf-8');

  // Replace placeholders
  const title = projectName
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  const processedHtml = indexHtml
    .replace(/{{TITLE}}/g, title)
    .replace(/{{DESCRIPTION}}/g, `A new experiment: ${title}`);

  // Write files to project directory
  await fs.writeFile(path.join(projectPath, 'index.html'), processedHtml);
  await fs.writeFile(path.join(projectPath, 'style.css'), styleCss);
  await fs.writeFile(path.join(projectPath, 'script.js'), scriptJs);
  await fs.writeFile(path.join(projectPath, 'netlify.toml'), netlifyToml);

  // Create .gitignore
  await fs.writeFile(
    path.join(projectPath, '.gitignore'),
    'node_modules/\n.DS_Store\n.netlify/\n'
  );

  // Create README
  await fs.writeFile(
    path.join(projectPath, 'README.md'),
    `# ${title}\n\nCreated with lumilipad ✈️\n`
  );

  spinner.succeed(chalk.green('Project scaffolded'));
  return projectPath;
}
