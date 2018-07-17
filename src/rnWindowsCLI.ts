// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import { resolve } from 'path';
import * as semver from 'semver';
import * as yeoman from 'yeoman-environment';
import { getInstallPackage, installPackage } from './utilities';

export interface WindowsCLIOptions {
    name: string;
    path: string;
    verbose: boolean;
    forceNPM: boolean;
    rnVersion: string;
    windowsVersion: string;
    windowsNamespace: string;
}

function getWindowsPackage(rnVersionOption: string, windowsVersion: string | undefined) {
    const packageName = 'react-native-windows';
    const rnVersion = semver.coerce(rnVersionOption);

    if (windowsVersion) {
        return `${packageName}@${windowsVersion}`;
    } else if (rnVersion) {
        const packageToInstall = getInstallPackage(packageName, rnVersion, 'RN Windows');
        if (packageToInstall) {
            return packageToInstall;
        }
    }

    throw chalk.redBright(
        `Error: Cannot find a RN Windows version compatible with React Native version "${rnVersionOption}".`
        + `  Please specify the RN Windows version to use with "--windows-version".`
        + `  Run "reactxp init --help" for more options.`,
    );
}

function generateWindows(options: WindowsCLIOptions) {
    const env = yeoman.createEnv();
    const generatorPath = resolve(
        options.path,
        'node_modules/react-native-windows/local-cli/generator-windows',
    );
    env.register(generatorPath, 'react-native:windows');

    return new Promise((res) => {
        env.run(`react-native:windows ${options.name}`, { ns: options.windowsNamespace }, res);
    });
}

export async function init(options: WindowsCLIOptions) {
    console.log(chalk.whiteBright('Adding Windows UWP support...'));

    installPackage(getWindowsPackage(options.rnVersion, options.windowsVersion), options);

    await generateWindows(options);
}
