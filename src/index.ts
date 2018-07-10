#!/usr/bin/env node

// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import * as figlet from 'figlet';
import { existsSync } from 'fs';
import { prompts } from 'prompts';
import * as program from 'yargs';

import './modules';
import * as reactNativeCLI from './reactNativeCLI';
import { validateProjectName } from './utilities';

program
    .demandCommand()
    .command('init [project-name]', 'Create a new ReactXP project.', (yargs) => {
        return yargs
            .showHelpOnFail(false)
            .option('rn-version', {
                default: '0.55.4',
                describe: 'The version of React Native to use.',
            })
            .positional('project-name', {
                describe: 'The name and path (from cwd) of the project to create.',
            });
    }, initializeProject)
    .command('upgrade', 'Upgrade an existing ReactXP project.', (yargs) => {
        return yargs
            .showHelpOnFail(false)
            .option('rn-version', {
                default: '0.55.4',
                describe: 'The version of React Native to use.',
            });
    }, upgradeProject)
    .parse();

async function initializeProject(args: program.Arguments) {
    console.log(chalk.blueBright(figlet.textSync('ReactXP   CLI \n----------')));

    const version: string = args['rn-version'];
    let projectName: string = args['project-name'];

    if (!projectName) {
        projectName = await prompts.text({ message: 'Enter a name for the new project.' });
    }

    validateProjectName(projectName);

    const message = chalk.whiteBright(`Initializing project at ./${projectName}, continue?`);
    const confirm = await prompts.confirm({ message, initial: !existsSync(projectName) });

    if (confirm) {
        reactNativeCLI.init(projectName, { version });
    } else {
        console.log('\nProject initialization cancelled.');
        process.exit();
    }
}

async function upgradeProject() {
    console.log(chalk.magentaBright(figlet.textSync('Coming soon ...')));
}
