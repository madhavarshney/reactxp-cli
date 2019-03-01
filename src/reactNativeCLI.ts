// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import { resolve } from 'path';
import * as semver from 'semver';

import { getInstallPackage, installPackage } from './utilities';

export interface RNInitOptions {
    name: string;
    path: string;
    verbose: boolean;
    forceNPM: boolean;
    rnVersion: string;
}

function checkNodeVersion(options: RNInitOptions) {
    const packageJSONPath = resolve(options.path, 'node_modules/react-native/package.json');
    const packageJSON = require(packageJSONPath);
    if (!packageJSON.engines || !packageJSON.engines.node) {
        return;
    }
    if (!semver.satisfies(process.version, packageJSON.engines.node)) {
        throw chalk.redBright(
            `You are currently running Node.js ${process.version} ` +
            `but React Native requires ${packageJSON.engines.node}. ` +
            'Please use a supported version of Node.\n' +
            'See https://facebook.github.io/react-native/docs/getting-started.html',
        );
    }
}

function getRNInstallPackage(rnVersionOption: string) {
    const packageName = 'react-native';
    const rnVersion = semver.coerce(rnVersionOption);
    if (rnVersion) {
        const packageToInstall = getInstallPackage(packageName, rnVersion, 'React Native');
        if (packageToInstall) {
            return packageToInstall;
        } else {
            throw chalk.redBright(`Error: Cannot find React Native version ${rnVersionOption}.`);
        }
    } else {
        return `${packageName}@${rnVersionOption}`;
    }
}

export function init(options: RNInitOptions) {
    installPackage(getRNInstallPackage(options.rnVersion), options);

    checkNodeVersion(options);

    const reactNativeLocalCLI = require(resolve(options.path, 'node_modules/react-native/cli.js'));
    reactNativeLocalCLI.init(options.path, options.name);
}
