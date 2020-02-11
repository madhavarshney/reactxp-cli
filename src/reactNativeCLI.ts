// Copyright (c) 2018-2020, Madhav Varshney.
// This source code is licensed under the MIT license.

import * as chalk from 'chalk';
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { resolve } from 'path';
import { prompts } from 'prompts';
import * as semver from 'semver';

import { Packages, rxMainComponentName } from './interfaces';
import { getInstallVersion, rmdirAsync, unlinkMultiple } from './utilities';

export interface RNInitOptions {
    name: string;
    path: string;
    rxpVersion: string;
    rnVersion: string;
}

const packageName = Packages.ReactNative;

function checkNodeVersion(options: RNInitOptions) {
    const packageJSONPath = resolve(options.path, `node_modules/${packageName}/package.json`);
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
            execSync(`npm view ${Packages.ReactXP}@${rxpVersion} peerDependencies --json`).toString(),
        );
        const versionRange = peerDependencies && peerDependencies[packageName];
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

const androidBasePath = 'android/app/src/main/java/com';

// TODO: verify that the patches are applied
function applyMainComponentNamePatch(options: RNInitOptions) {
    const androidFilePath = `${androidBasePath}/${options.name.toLowerCase()}/MainActivity.java`;
    console.log(chalk.whiteBright(`Patching ${androidFilePath} for ReactXP...`));

    const androidMainActivity = readFileSync(androidFilePath).toString();
    const newActivity = androidMainActivity.replace(
        /getMainComponentName\(\) {\s*return "(.*)";/m,
        (match) => match.replace(options.name, rxMainComponentName),
    );

    writeFileSync(androidFilePath, newActivity);

    const iosFilePath = `ios/${options.name}/AppDelegate.m`;
    console.log(chalk.whiteBright(`Patching ${iosFilePath} for ReactXP...`));

    const iosAppDelegate = readFileSync(iosFilePath).toString();
    const newAppDelegate = iosAppDelegate.replace(
        /moduleName:@".*"/m,
        (match) => match.replace(options.name, rxMainComponentName),
    );
    writeFileSync(iosFilePath, newAppDelegate);
}

export async function init(options: RNInitOptions) {
    console.log(chalk.bold.whiteBright('Adding Android and iOS platforms with React Native...'));
    checkNodeVersion(options);

    const reactNativeLocalCLI = require(resolve(options.path, `node_modules/${packageName}/cli.js`));
    await reactNativeLocalCLI.init(options.path, options.name);
    await unlinkMultiple(
        options.path,
        ['index.js', 'App.js', '.flowconfig', '__tests__/App-test.js'],
    );
    // await rmdirAsync(resolve(options.path, '__tests__'));

    applyMainComponentNamePatch(options);
    console.log('\n');
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
