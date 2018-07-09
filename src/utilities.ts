// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.
// Portions derived from React Native:
// Copyright (c) 2015-present, Facebook, Inc.

import chalk from 'chalk';
import { execSync } from 'child_process';
import * as path from 'path';
import * as semver from 'semver';

let yarnVersion: string | false;

export function getYarnVersionIfAvailable() {
    if (yarnVersion) {
        return yarnVersion;
    }

    try {
        yarnVersion = execSync(
            process.platform === 'win32'
                ? 'yarn --version 2> NUL'
                : 'yarn --version 2>/dev/null',
        ).toString().trim() || '';
    } catch (error) {
        return false;
    }

    try {
        return semver.gte(yarnVersion, '1.0.0') ? yarnVersion : false;
    } catch (error) {
        console.error('Cannot parse yarn version: ' + yarnVersion);
        return false;
    }
}

export function validateProjectName(name: string) {
    if (!name.match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
        console.error(`"${name}" is not a valid name for a project. Please use an alphanumeric name.`);
        process.exit(1);
    }
}

export function checkNodeVersion() {
    const packageJsonPath = path.resolve(process.cwd(), 'node_modules/react-native/package.json');
    const packageJson = require(packageJsonPath);
    if (!packageJson.engines || !packageJson.engines.node) {
        return;
    }
    if (!semver.satisfies(process.version, packageJson.engines.node)) {
        console.error(chalk.red(
            `You are currently running Node ${process.version} ` +
            `but React Native requires ${packageJson.engines.node}. ` +
            'Please use a supported version of Node.\n' +
            'See https://facebook.github.io/react-native/docs/getting-started.html',
        ));
    }
}

export interface InstallPackageOptions {
    npm?: boolean;
    installCommand?: string;
    verbose?: boolean;
}

export function installPackage(packageToInstall: string, options: InstallPackageOptions) {
    const forceNpmClient = options.npm;
    let installCommand: string;
    if (options.installCommand) {
        installCommand = options.installCommand;
    } else {
        if (!forceNpmClient && getYarnVersionIfAvailable()) {
            console.log(`Installing ${packageToInstall} with Yarn v${yarnVersion}...`);
            installCommand = `yarn add ${packageToInstall} --exact`;
        } else {
            console.log(`Installing ${packageToInstall} with NPM...`);
            installCommand = `npm install --save --save-exact ${packageToInstall}`;
        }
        if (options.verbose) {
            installCommand += ' --verbose';
        }
    }
    try {
        execSync(installCommand, { stdio: 'inherit' });
    } catch (err) {
        console.error(err);
        console.error(`Command "${installCommand}" failed.`);
        process.exit(1);
    }
}
