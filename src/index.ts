#!/usr/bin/env node

// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import * as program from 'commander';
import * as figlet from 'figlet';
import * as path from 'path';

import './modules';
import * as reactNativeCLI from './reactNativeCLI';

interface CLIOptions {
    version: string;
}

program
    .command('init <project-name>')
    .option('--version <version>', 'The version of React Native to use.', '0.55.4')
    .action((projectName: string, args: CLIOptions) => {
        const version = args.version;
        const projectPath = path.resolve(process.cwd(), projectName);
        console.log(chalk.blueBright(figlet.textSync('ReactXP   CLI \n----------')))
        console.log(chalk.whiteBright(`Initializing project at ${projectPath}...`));
        reactNativeCLI.init(projectName, { version });
    });

program
    .command('upgrade')
    .action(() => {
        console.log(chalk.magentaBright(figlet.textSync('Coming soon ...')));
    });

program.parse(process.argv);

if (program.args.length === 0) {
    program.help();
}
