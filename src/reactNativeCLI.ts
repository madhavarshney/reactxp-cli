// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { prompts } from 'prompts';
import * as semver from 'semver';

import { getInstallVersion } from './utilities';

export interface RNInitOptions {
    name: string;
    path: string;
    rxpVersion: string;
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
            `ERROR: You are currently running Node.js ${process.version} ` +
            `but React Native requires ${packageJSON.engines.node}. ` +
            'Please use a supported version of Node.\n' +
            'See https://facebook.github.io/react-native/docs/getting-started.html',
        );
    }
}

// function getBabelPackage() {
//     const packageToInstall = getInstallPackage('@babel/core', '^7.0.0');
//     return packageToInstall ? packageToInstall : false;
// }

const packageName = 'react-native';

async function getRNPackage(rnVersionOption: string, rxpVersion?: string): Promise<string | false> {
    let versionToInstall: string | null = null;

    if (rnVersionOption) {
        versionToInstall = getInstallVersion(packageName, rnVersionOption, {});
        if (!versionToInstall) {
            console.log(chalk.yellowBright(`\nERROR: Cannot find React Native version "${rnVersionOption}". Falling back to using the version specified by ReactXP.\n`));
        }
    }

    if (!versionToInstall && rxpVersion) {
        // console.log(`Checking for peerDependency of reactxp on ${packageName}`);
        const peerDependencies = JSON.parse(
            execSync(`npm view reactxp@${rxpVersion} peerDependencies --json`).toString(),
        );
        const versionRange = peerDependencies && peerDependencies['react-native'];
        versionToInstall = versionRange && getInstallVersion(packageName, versionRange, {});
    }

    if (!versionToInstall) {
        console.log(chalk.redBright(`\nERROR: Cannot find React Native version that satisfies the peerDependency range of ReactXP.\n`));

        const newVersion = await prompts.text({
            message: 'Enter the version of React Native to use: ',
        });
        if (newVersion && newVersion.length > 0) {
            return getRNPackage(newVersion);
        }
    }

    return versionToInstall || false;
}

export async function init(options: RNInitOptions) {
    console.log(chalk.bold.whiteBright('Adding Android and iOS platforms with React Native...'));

    checkNodeVersion(options);

    const reactNativeLocalCLI = require(resolve(options.path, 'node_modules/react-native/cli.js'));
    reactNativeLocalCLI.init(options.path, options.name);
}

export async function getDependencies(options: RNInitOptions) {
    // const babelPackage = getBabelPackage();
    // if (babelPackage) {
    //     installPackage(babelPackage, { forceNPM: options.forceNPM, dev: true });
    // }

    const packageVersion = await getRNPackage(options.rnVersion, options.rxpVersion);
    return packageVersion ? {
        package: `${packageName}@${packageVersion}`,
        version: packageVersion,
    } : null;
}
