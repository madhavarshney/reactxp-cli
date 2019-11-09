// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import { textSync } from 'figlet';
import { existsSync, mkdirSync, unlinkSync, writeFileSync } from 'fs';
import { basename, join, relative, resolve } from 'path';
import { prompts } from 'prompts';

import './modules';
import * as reactNativeCLI from './reactNativeCLI';
import * as reactxpCLI from './reactxpCLI';
import * as rnWindowsCLI from './rnWindowsCLI';
import { getYarnVersionIfAvailable, installPackage, valueOrDefault } from './utilities';

interface PackageJSON {
    name: string;
    version: string;
    private: boolean;
    scripts: Record<string, string>;
}

export interface InitOptions {
    projectName?: string;
    verbose?: boolean;
    npm?: boolean;
    rxpVersion?: string;
    rnVersion?: string;
    windowsVersion?: string;
    windowsNamespace?: string;
    skipInit?: boolean;
    skipWindows?: boolean;
    skipRxp?: boolean;
}

export class ProjectWizard {
    private options: {
        name: string;
        path: string;
        verbose: boolean;
        forceNPM: boolean;
        rxpVersion: string;
        rnVersion: string;
        windowsVersion: string;
        windowsNamespace: string;
        skipInit: boolean;
        skipWindows: boolean;
        skipRXP: boolean;
    };

    constructor() {
        this.options = {
            name: '',
            path: '',
            verbose: false,
            forceNPM: false,
            rxpVersion: '',
            rnVersion: '',
            windowsVersion: '',
            windowsNamespace: '',
            skipInit: true,
            skipWindows: true,
            skipRXP: true,
        };
        this.initializeProject = this.initializeProject.bind(this);
        this.upgradeProject = this.upgradeProject.bind(this);
    }

    public async initializeProject(args: InitOptions) {
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
            verbose: valueOrDefault(args.verbose, this.options.verbose),
            forceNPM: valueOrDefault(args.npm, this.options.forceNPM),
            rxpVersion: valueOrDefault<string>(args.rxpVersion, ''),
            rnVersion: valueOrDefault<string>(args.rnVersion, ''),
            windowsVersion: valueOrDefault<string>(args.windowsVersion, ''),
            windowsNamespace: valueOrDefault(args.windowsNamespace, name),
            skipInit: valueOrDefault(args.skipInit, this.options.skipInit),
            skipWindows: valueOrDefault(args.skipWindows, this.options.skipWindows),
            skipRXP: valueOrDefault(args.skipRxp, this.options.skipRXP),
        };

        this.validateProjectName();
        await this.confirmProjectCreation(directoryExists);

        console.log(chalk.bold.whiteBright(`\nCreating a new ReactXP project in ${this.options.path}...\n`));

        if (!directoryExists) {
            mkdirSync(this.options.path);
        }
        process.chdir(this.options.path);

        const configPath = this.writePMConfig();
        await this.createPackageJSON();

        console.log(chalk.bold.whiteBright(`\nInstalling dependencies...\n`));

        const rxpPackage = await reactxpCLI.getDependencies(this.options);
        this.options.rxpVersion = valueOrDefault(
            rxpPackage && rxpPackage.version,
            this.options.rxpVersion,
        );

        const rnPackage = await reactNativeCLI.getDependencies(this.options);
        this.options.rnVersion = valueOrDefault(
            rnPackage && rnPackage.version,
            this.options.rnVersion,
        );

        const rnWinPackage = await rnWindowsCLI.getDependencies(this.options);

        const packagesToInstall = [rxpPackage, rnPackage, rnWinPackage]
            .map((p) => (p && p.package) || false)
            .filter<string>((p): p is string => p !== false);

        await installPackage(packagesToInstall, this.options);

        console.log(chalk.bold.whiteBright(`\nGenerating files...\n`));

        if (rnPackage && !this.options.skipInit) {
            await reactNativeCLI.init(this.options);
        }
        if (rnWinPackage && !this.options.skipWindows) {
            await rnWindowsCLI.init(this.options);
        }
        if (rxpPackage && !this.options.skipRXP) {
            await reactxpCLI.init(this.options);
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
        const confirm = await prompts.confirm({ message, initial: !directoryExists });

        if (!confirm) {
            console.log('\nProject initialization cancelled.');
            process.exit();
        }
    }

    private async createPackageJSON() {
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

        const filePath = join(this.options.path, 'package.json');
        const fileExists = existsSync(filePath);

        if (fileExists) {
            const message = chalk.whiteBright(`The file package.json already exists. Should we overwrite it?`);
            const confirm = await prompts.confirm({ message, initial: false });

            if (!confirm) {
                return;
            }
        }

        writeFileSync(filePath, JSON.stringify(packageJSON, undefined, 2));
    }

    private writePMConfig() {
        if (!this.options.verbose) {
            if (!this.options.forceNPM && getYarnVersionIfAvailable()) {
                const configPath = join(this.options.path, '.yarnrc');
                writeFileSync(configPath, '--add.silent true\n--install.silent true');
                return configPath;
            } else {
                const configPath = join(this.options.path, '.npmrc');
                writeFileSync(configPath, 'audit=false\nloglevel=error\n');
                return configPath;
            }
        }
    }
}
