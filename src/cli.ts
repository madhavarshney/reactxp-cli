#!/usr/bin/env node

// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

import * as program from 'yargs';
import { ProjectWizard } from './index';

const ReactXPWizard = new ProjectWizard();

// Hack until @types/yargs is updated to reflect Yargs v12
interface Argv extends program.Argv {
    scriptName(name: string): Argv;
}

(program as Argv)
    .scriptName('reactxp')
    .demandCommand()
    .wrap(program.terminalWidth())
    .usage('Usage: $0 <command> [options]')
    .command('init [project-name]', 'Create a new ReactXP project.', (yargs) => {
        return yargs
            .showHelpOnFail(false)
            .options({
                // tslint:disable:object-literal-sort-keys
                'npm': {
                    default: false,
                    describe: 'Use NPM even if Yarn is present.',
                },
                'verbose': {
                    default: false,
                    describe: 'Enable verbose logging.',
                },
                'rn-version': {
                    describe: 'The version of React Native to use.',
                    type: 'string',
                },
                'windows-version': {
                    describe: 'The version of React Native Windows to use.',
                    type: 'string',
                },
                'skip-init': {
                    default: false,
                    describe: 'Skip adding React Native, useful for existing projects.',
                },
                'skip-windows': {
                    default: false,
                    describe: 'Skip adding Windows UWP support.',
                },
                // tslint:enable:object-literal-sort-keys
            })
            .positional('project-name', {
                describe: 'The name and path of the project to create.',
            });
    }, ReactXPWizard.initializeProject)
    .command('upgrade', 'Upgrade an existing ReactXP project.', {}, ReactXPWizard.upgradeProject)
    .parse();
