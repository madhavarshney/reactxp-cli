#!/usr/bin/env node

const path = require('path');
const child_process = require('child_process');
const chalk = require('chalk');
const figlet = require('figlet');
const program = require('commander');

program.version('0.0.1');

program.command('init <project-name>').action((...args) => {
    const projectName = args[0];
    const projectPath = path.resolve(process.cwd(), projectName);
    console.log(chalk.blueBright(figlet.textSync('ReactXP   CLI \n----------')));
    console.log(chalk.default.whiteBright(`Initializing project at ${projectPath}...`));
    child_process.execSync(`react-native init ${projectName}`, { stdio: 'inherit' });
});

program.command('upgrade').action((...args) => {
    console.log(chalk.magentaBright(figlet.textSync('Coming soon ...')));
});

program.parse(process.argv);
