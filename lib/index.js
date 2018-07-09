#!/usr/bin/env node

// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

const path = require('path');
const chalk = require('chalk');
const figlet = require('figlet');
const program = require('commander');
const reactNativeCLI = require('./reactNativeCLI');

program
    .command('init <project-name>')
    .option('--version <version>', 'The version of React Native to use.', '0.55.4')
    .action((projectName, args) => {
        const version = args.version;
        const projectPath = path.resolve(process.cwd(), projectName);
        console.log(chalk.blueBright(figlet.textSync('ReactXP   CLI \n----------')));
        console.log(chalk.default.whiteBright(`Initializing project at ${projectPath}...`));
        reactNativeCLI.init(projectName, { version });
    });

program.command('upgrade').action((...args) => {
    console.log(chalk.magentaBright(figlet.textSync('Coming soon ...')));
});

program.parse(process.argv);

if (program.args.length === 0) {
  program.help();
}
