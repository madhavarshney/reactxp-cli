// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import { resolve } from 'path';
import { prompts } from 'prompts';
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

const packageName = 'react-native-windows';

async function getWindowsPackage(
    rnVersionOption: string | undefined,
    windowsVersionOption: string | undefined,
): Promise<string | false> {
    let packageToInstall: string | null;

    if (windowsVersionOption) {
        packageToInstall = getInstallPackage(packageName, windowsVersionOption, { includeRC: true });
        if (packageToInstall) {
            return packageToInstall;
        } else {
            if (rnVersionOption) {
                console.log(chalk.yellowBright(
                    `\nWARNING: Cannot find RN Windows version "${windowsVersionOption}".` +
                    `  Falling back to finding RN Windows version compatible with React Native version` +
                    ` "${rnVersionOption}".\n`,
                ));
            } else {
                console.log(chalk.redBright(
                    `\nERROR: Cannot find RN Windows version "${windowsVersionOption}".\n`,
                ));
            }
        }
    }

    if (rnVersionOption) {
        packageToInstall = getInstallPackage(packageName, rnVersionOption, { includeRC: true });
        if (packageToInstall) {
            return packageToInstall;
        }
        console.log(chalk.redBright(
            `\nERROR: Cannot find a RN Windows version compatible with React Native version "${rnVersionOption}".` + (
                !windowsVersionOption ? (
                    `  Please explicitly specify the RN Windows version to use with "--windows-version".` +
                    `  Run "reactxp init --help" for more options.`
                ) : ''
            ) + '\n',
        ));
    }

    const nextStep = await prompts.select({
        message: 'What should we do next?',
        choices: [
            { title: 'Skip adding React Native Windows', value: 'skip' },
            { title: 'Enter version of React Native Windows to use', value: 'version' },
        ],
    });

    if (nextStep === 'version') {
        const version = await prompts.text({
            message: 'Enter the version of React Native Windows to use: ',
        });
        if (version && version.length > 0) {
            return getWindowsPackage(undefined, version);
        }
    }

    console.log(chalk.whiteBright('\nSkipping Windows UWP support.'));
    return false;
}

function generateWindows(options: WindowsCLIOptions) {
    const generator = require(resolve(
        options.path,
        'node_modules/react-native-windows/local-cli/generate-windows.js',
    ));

    generator(options.path, options.name, options.windowsNamespace);
}

export async function init(options: WindowsCLIOptions) {
    console.log(chalk.whiteBright('Adding Windows UWP support...'));

    const windowsPackage = await getWindowsPackage(options.rnVersion, options.windowsVersion);
    if (windowsPackage) {
        installPackage(windowsPackage, options);
        generateWindows(options);
    }
}
