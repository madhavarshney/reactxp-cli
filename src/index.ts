#!/usr/bin/env node

// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import * as figlet from 'figlet';
import * as path from 'path';
import * as program from 'yargs';

import './modules';
import * as reactNativeCLI from './reactNativeCLI';
import { validateProjectName } from './utilities';

program
    .command('init <project-name>', 'Create a new ReactXP project.', {
        version: {
            default: '0.55.4',
            describe: 'The version of React Native to use.',
        },
    }, (args) => {
        const projectName: string = args['project-name'];
        validateProjectName(projectName);

        const version: string = args.version;
        const projectPath = path.resolve(process.cwd(), projectName);

        console.log(chalk.blueBright(figlet.textSync('ReactXP   CLI \n----------')));
        console.log(chalk.whiteBright(`Initializing project at ${projectPath}...\n`));

        reactNativeCLI.init(projectName, { version });
    });

program
    .command('upgrade', 'Upgrade an existing ReactXP project.', {
        version: {
            default: '0.55.4',
            describe: 'The version of React Native to use.',
        },
    }, (args) => {
        console.log(chalk.magentaBright(figlet.textSync('Coming soon ...')));
    });

const argv = program.argv;

if (!argv._[0]) {
    program.showHelp();
}
