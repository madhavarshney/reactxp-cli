// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import chalk from 'chalk';
import { resolve } from 'path';
import { prompts } from 'prompts';
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
            `ERROR: You are currently running Node.js ${process.version} ` +
            `but React Native requires ${packageJSON.engines.node}. ` +
            'Please use a supported version of Node.\n' +
            'See https://facebook.github.io/react-native/docs/getting-started.html',
        );
    }
}

function getBabelPackage() {
    const packageToInstall = getInstallPackage('@babel/core', '^7.0.0');
    return packageToInstall ? packageToInstall : false;
}

async function getRNPackage(rnVersionOption: string): Promise<string | false> {
    const packageName = 'react-native';
    const versionOptionPackage = getInstallPackage(packageName, rnVersionOption, { includeRC: false });
    if (versionOptionPackage) {
        return versionOptionPackage;
    }

    console.log(chalk.redBright(`\nERROR: Cannot find React Native version "${rnVersionOption}".\n`));

    const newVersion = await prompts.text({
        message: 'Enter the version of React Native to use: ',
    });
    if (newVersion && newVersion.length > 0) {
        return getRNPackage(newVersion);
    }

    return false;
}

export async function init(options: RNInitOptions) {
    const babelPackage = getBabelPackage();
    if (babelPackage) {
        installPackage(babelPackage, { forceNPM: options.forceNPM, dev: true });
    }

    const rnPackage = await getRNPackage(options.rnVersion);
    if (rnPackage) {
        installPackage(rnPackage, options);
        checkNodeVersion(options);

        const reactNativeLocalCLI = require(resolve(options.path, 'node_modules/react-native/cli.js'));
        reactNativeLocalCLI.init(options.path, options.name);
    } else {
        throw chalk.redBright('\nProject creation failed!');
    }
}
