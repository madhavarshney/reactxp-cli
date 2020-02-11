#!/usr/bin/env node

// Copyright (c) 2018-2020, Madhav Varshney.
// This source code is licensed under the MIT license.

import * as program from 'yargs';
import { ProjectWizard } from './index';

const ReactXPWizard = new ProjectWizard();

program
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
                    type: 'boolean',
                },
                'verbose': {
                    default: false,
                    describe: 'Enable verbose logging.',
                    type: 'boolean',
                },
                'rxp-version': {
                    describe: 'The version of ReactXP to use.',
                    type: 'string',
                },
                'rn-version': {
                    describe: 'The version of React Native to use.',
                    type: 'string',
                },
                'windows-version': {
                    describe: 'The version of React Native Windows to use.',
                    type: 'string',
                },
                'windows-namespace': {
                    describe: 'The namespace that will be used in the generated Windows C# code.',
                    type: 'string',
                },
                'skip-init': {
                    default: false,
                    describe: 'Skip adding React Native.',
                    type: 'boolean',
                },
                'skip-windows': {
                    default: false,
                    describe: 'Skip adding Windows UWP support.',
                    type: 'boolean',
                },
                'skip-rxp': {
                    default: false,
                    describe: 'Skip adding ReactXP.',
                    type: 'boolean',
                },
                // tslint:enable:object-literal-sort-keys
            })
            .positional('project-name', {
                describe: 'The name and path of the project to create.',
            });
    }, ReactXPWizard.initializeProject)
    .command('upgrade', 'Upgrade an existing ReactXP project.', {}, ReactXPWizard.upgradeProject)
    .parse();
