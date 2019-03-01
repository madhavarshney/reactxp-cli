// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import * as semver from 'semver';

export function doesProjectUseYarn(path: string) {
    return existsSync(resolve(path, 'yarn.lock'));
}

let yarnVersion: string | false;

export function getYarnVersionIfAvailable() {
    if (yarnVersion) {
        return yarnVersion;
    }

    try {
        yarnVersion = execSync('yarn --version').toString().trim();
    } catch (error) {
        return null;
    }

    return semver.valid(yarnVersion);
}

export function getInstallPackage(packageName: string, packageVersion: semver.SemVer, description: string) {
    const versionRange = `~${packageVersion.version}-rc.0`;
    console.log(`Checking for ${description} version matching ${versionRange}`);
    const versions = JSON.parse(execSync(`npm view ${packageName} versions --json`).toString());
    const versionToInstall = semver.maxSatisfying(versions, versionRange);
    if (versionToInstall) {
        return `${packageName}@${versionToInstall}`;
    }
}

export interface InstallPackageOptions {
    forceNPM: boolean;
}

export function installPackage(packageToInstall: string, options: InstallPackageOptions) {
    let installCommand: string;

    if (!options.forceNPM && getYarnVersionIfAvailable()) {
        console.log(`Installing ${packageToInstall} with Yarn v${yarnVersion}...`);
        installCommand = `yarn add ${packageToInstall} --exact`;
    } else {
        console.log(`Installing ${packageToInstall} with NPM...`);
        installCommand = `npm install --save ${packageToInstall}`;
    }

    execSync(installCommand, { stdio: 'inherit' });
}
