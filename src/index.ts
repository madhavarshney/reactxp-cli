// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import { textSync } from 'figlet';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, join, relative, resolve } from 'path';
import { prompts } from 'prompts';
import { Arguments } from 'yargs';

import './modules';
import * as reactNativeCLI from './reactNativeCLI';
import * as rnWindowsCLI from './rnWindowsCLI';
import { getYarnVersionIfAvailable } from './utilities';

interface PackageJSON {
    name: string;
    version: string;
    private: boolean;
    scripts: Record<string, string>;
}

export class ProjectWizard {
    private options: {
        name: string;
        path: string;
        verbose: boolean;
        forceNPM: boolean;
        rnVersion: string;
        windowsVersion: string;
        windowsNamespace: string;
        skipInit: boolean;
        skipWindows: boolean;
    };

    constructor() {
        this.options = {
            name: '',
            path: '',
            verbose: false,
            forceNPM: false,
            rnVersion: '',
            windowsVersion: '',
            windowsNamespace: '',
            skipInit: true,
            skipWindows: true,
        };
        this.initializeProject = this.initializeProject.bind(this);
        this.upgradeProject = this.upgradeProject.bind(this);
    }

    public async initializeProject(args: Arguments) {
        console.log(chalk.blueBright(textSync('ReactXP   CLI \n----------')));

        const projectNamePath: string = args.projectName || await prompts.text({
            message: 'Enter the name or path for the new project.',
        });
        const path = resolve(projectNamePath);
        const name = basename(path);
        const directoryExists = existsSync(path);

        this.options = {
            name,
            path,
            verbose: args.verbose,
            forceNPM: args.npm,
            rnVersion: args.rnVersion ? args.rnVersion : '0.55',
            windowsVersion: args.windowsVersion,
            windowsNamespace: args.windowsNamespace || name,
            skipInit: args.skipInit,
            skipWindows: args.skipWindows,
        };

        this.validateProjectName();
        await this.confirmProjectCreation(directoryExists);

        console.log(chalk.whiteBright(`Creating a new React Native project in ${this.options.path}...\n`));

        if (!directoryExists) {
            mkdirSync(this.options.path);
        }
        process.chdir(this.options.path);

        const configPath = this.writePMConfig();

        if (!this.options.skipInit) {
            this.createPackageJSON();
            reactNativeCLI.init(this.options);
            console.log('\n');
        }

        if (!this.options.skipWindows) {
            await rnWindowsCLI.init(this.options);
        }

        if (!this.options.verbose && configPath) {
            unlinkSync(configPath);
        }
    }

    public async upgradeProject() {
        console.log(chalk.magentaBright(textSync('Coming soon ...')));
    }

    private validateProjectName() {
        if (!this.options.name.match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
            console.error(`"${this.options.name}" is not a valid name for a project. Please use an alphanumeric name.`);
            process.exit(1);
        }
    }

    private async confirmProjectCreation(directoryExists: boolean) {
        let relativePath = relative(process.cwd(), this.options.path);
        if (relativePath.length === 0) {
            relativePath = '.';
        }
        const pathInfo = `${directoryExists ? 'existing directory ' : ''}${relativePath}`;
        const message = chalk.whiteBright(`Initializing project at ${pathInfo}, continue?`);
        const confirm = await prompts.confirm({ message, initial: true });

        if (!confirm) {
            console.log('\nProject initialization cancelled.');
            process.exit();
        }
    }

    private createPackageJSON() {
        // tslint:disable:object-literal-sort-keys
        const packageJSON: PackageJSON = {
            name: this.options.name,
            version: '0.0.1',
            private: true,
            scripts: {
                start: 'react-native start',
                ios: 'react-native run-ios',
                android: 'react-native run-android',
            },
        };
        // tslint:enable:object-literal-sort-keys
        if (!this.options.skipWindows) {
            packageJSON.scripts.windows = 'react-native run-windows';
        }

        writeFileSync(join(this.options.path, 'package.json'), JSON.stringify(packageJSON, undefined, 2));
    }

    private writePMConfig() {
        if (!this.options.verbose) {
            if (!this.options.forceNPM && getYarnVersionIfAvailable()) {
                const configPath = join(this.options.path, '.yarnrc');
                writeFileSync(configPath, '--silent true\n');
                return configPath;
            } else {
                const configPath = join(this.options.path, '.npmrc');
                writeFileSync(configPath, 'audit=false\nloglevel=error\n');
                return configPath;
            }
        }
    }
}
