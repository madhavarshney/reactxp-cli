// Copyright (c) 2018-2020, Madhav Varshney.
// This source code is licensed under the MIT license.

import * as chalk from 'chalk';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { prompts } from 'prompts';

import { Packages, rxMainComponentName } from './interfaces';
import { getInstallVersion, unlinkAsync, unlinkMultiple } from './utilities';

export interface WindowsCLIOptions {
    name: string;
    path: string;
    verbose: boolean;
    forceNPM: boolean;
    rnVersion: string;
    windowsVersion: string;
    windowsNamespace: string;
}

const packageName = Packages.RNWindows;

async function getWindowsPackage(
    rnVersionOption: string | undefined,
    windowsVersionOption: string | undefined,
): Promise<string | false> {
    let versionToInstall: string | null = null;

    if (windowsVersionOption) {
        versionToInstall = getInstallVersion(packageName, windowsVersionOption, {});
        if (!versionToInstall) {
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

    if (!versionToInstall && rnVersionOption) {
        versionToInstall = getInstallVersion(packageName, rnVersionOption, {
            includeRC: true,
            looseMatch: true,
        });
        if (!versionToInstall) {
            console.log(chalk.redBright(
                `\nERROR: Cannot find a React Native Windows version compatible with ` +
                `React Native version "${rnVersionOption}".` + (
                    !windowsVersionOption ? (
                        `  Please explicitly specify the RN Windows version to use with "--windows-version".` +
                        `  Run "reactxp init --help" for more options.`
                    ) : ''
                ) + '\n',
            ));
        }
    }

    if (!versionToInstall) {
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
    }

    return versionToInstall || false;
}

const rnWindowsModulePath = 'node_modules/react-native-windows';
const rnWindowsLocalCliPath = `${rnWindowsModulePath}/local-cli`;

function generateWindows(options: WindowsCLIOptions) {
    // const generator = require(resolve(
    //     options.path,
    //     'node_modules/react-native-windows/local-cli/generate-windows.js',
    // ));
    // generator(options.path, options.name, options.windowsNamespace);

    const templatePath = resolve(options.path, `${rnWindowsLocalCliPath}/generator-windows/templates`);
    const { copyProjectTemplateAndReplace } = require(resolve(
        options.path,
        `${rnWindowsLocalCliPath}/generator-windows/index.js`,
    ));

    copyProjectTemplateAndReplace(
        templatePath,
        options.path,
        options.name,
        { ns: options.windowsNamespace },
    );
}

// TODO: verify that the patches are applied
function applyMainComponentNamePatch(options: WindowsCLIOptions) {
    const winFilePath = `windows/${options.name}/MainPage.xaml.cs`;
    console.log(chalk.whiteBright(`Patching ${winFilePath} for ReactXP...`));

    const winMainPage = readFileSync(winFilePath).toString();
    const newMainPage = winMainPage.replace(
        /const string JSCOMPONENTNAME = ".*";/m,
        (match) => match.replace(options.name, rxMainComponentName),
    );
    writeFileSync(winFilePath, newMainPage);
}

export async function init(options: WindowsCLIOptions) {
    console.log(chalk.bold.whiteBright('Adding Windows UWP Platform...'));
    generateWindows(options);
    applyMainComponentNamePatch(options);
    await unlinkMultiple(options.path, ['index.windows.js']);
    console.log('\n');
}

export async function getDependencies(options: WindowsCLIOptions) {
    const packageVersion = await getWindowsPackage(options.rnVersion, options.windowsVersion);
    return packageVersion ? {
        package: `${packageName}@${packageVersion}`,
        version: packageVersion,
    } : null;
}
