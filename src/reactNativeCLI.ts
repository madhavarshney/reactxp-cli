// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.
// Derived from React Native:
// Copyright (c) 2015-present, Facebook, Inc.

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as prompt from 'prompt';
import * as semver from 'semver';

import {
    checkNodeVersion,
    getYarnVersionIfAvailable,
    validateProjectName,
} from './utilities';

export interface RNInitOptions {
    version: string;
    npm?: boolean;
    installCommand?: string;
    verbose?: boolean;
}

function cliModulePath() {
    return path.resolve(process.cwd(), 'node_modules', 'react-native', 'cli.js');
}

function createAfterConfirmation(name: string, options: RNInitOptions) {
    prompt.start();

    const property = {
        default: 'no',
        message: 'Directory ' + name + ' already exists. Continue?',
        name: 'confirm',
        validator: /y[es]*|n[o]?/,
        warning: 'Must respond yes or no',
    };

    prompt.get(property, (err: Error, result: { confirm: 'yes' | 'no' }) => {
        let cancelled = false;
        if (err) {
            if (err.message === 'canceled') {
                cancelled = true;
            } else {
                throw err;
            }
        }
        if (cancelled || result.confirm[0] !== 'y') {
            console.log('\nProject initialization canceled');
            process.exit();
        } else {
            createProject(name, options);
        }
    });
}

function createProject(name: string, options: RNInitOptions) {
    const root = path.resolve(name);
    const projectName = path.basename(root);

    console.log('This will walk you through creating a new React Native project in', root);

    if (!fs.existsSync(root)) {
        fs.mkdirSync(root);
    }

    // tslint:disable:object-literal-sort-keys
    const packageJson = {
        name: projectName,
        version: '0.0.1',
        private: true,
        scripts: {
            start: 'node node_modules/react-native/local-cli/cli.js start',
            ios: 'react-native run-ios',
            android: 'react-native run-android',
        },
    };
    // tslint:enable:object-literal-sort-keys

    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson));
    process.chdir(root);
    run(root, projectName, options);
}

function getInstallPackage(rnPackage: string) {
    let packageToInstall = 'react-native';
    const isValidSemver = semver.valid(rnPackage);
    if (isValidSemver) {
        packageToInstall += '@' + isValidSemver;
    } else if (rnPackage) {
        // for tar.gz or alternative paths
        packageToInstall = rnPackage;
    }
    return packageToInstall;
}

function run(root: string, projectName: string, options: RNInitOptions) {
    const rnPackage = options.version;
    const forceNpmClient = options.npm;
    const yarnVersion = !forceNpmClient && getYarnVersionIfAvailable();
    let installCommand;
    if (options.installCommand) {
        installCommand = options.installCommand;
    } else {
        if (yarnVersion) {
            console.log('Using yarn v' + yarnVersion);
            console.log('Installing ' + getInstallPackage(rnPackage) + '...');
            installCommand = 'yarn add ' + getInstallPackage(rnPackage) + ' --exact';
        } else {
            console.log('Installing ' + getInstallPackage(rnPackage) + '...');
            installCommand = 'npm install --save --save-exact ' + getInstallPackage(rnPackage);
        }
        if (options.verbose) {
            installCommand += ' --verbose';
        }
    }
    try {
        execSync(installCommand, { stdio: 'inherit' });
    } catch (err) {
        console.error(err);
        console.error('Command `' + installCommand + '` failed.');
        process.exit(1);
    }
    checkNodeVersion();
    const cli = require(cliModulePath());
    cli.init(root, projectName);
}

export function init(name: string, options: RNInitOptions) {
    validateProjectName(name);

    if (fs.existsSync(name)) {
        createAfterConfirmation(name, options);
    } else {
        createProject(name, options);
    }
}
