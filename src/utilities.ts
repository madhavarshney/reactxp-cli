// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';
import * as semver from 'semver';

export function valueOrDefault<T>(value: T | undefined | null, def: T) {
    return (value !== undefined && value !== null) ? value : def;
}

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

export interface GetInstallPackageOptions {
    includeRC?: boolean;
    injectCaret?: boolean;
}

export function getInstallPackage(
    packageName: string,
    packageVersion: string,
    options: GetInstallPackageOptions = {},
): string | null {
    let range: string | null;
    let version = semver.coerce(packageVersion);
    if (version) {
        if (options.includeRC && version.prerelease.length === 0) {
            version = semver.parse(version.version + '-rc.0') || version;
        }
        range = new semver.Range('^' + version.version).range;
    } else {
        range = semver.validRange(packageVersion);
    }
    if (!range) {
        return `${packageName}@${packageVersion}`;
    }
    console.log(`Checking for ${packageName} version matching ${range}`);
    const versions = JSON.parse(execSync(`npm view ${packageName} versions --json`).toString());
    const versionToInstall = semver.maxSatisfying(versions, range);
    return versionToInstall ? `${packageName}@${versionToInstall}` : null;
}

export interface InstallPackageOptions {
    forceNPM?: boolean;
    dev?: boolean;
    exact?: boolean;
}

export function installPackage(packageToInstall: string, options: InstallPackageOptions) {
    let installCommand: string;
    const exact = valueOrDefault<boolean>(options.exact, true);

    if (!options.forceNPM && getYarnVersionIfAvailable()) {
        console.log(`Installing ${packageToInstall} with Yarn v${yarnVersion}...`);
        installCommand = `yarn add "${packageToInstall}"`
            + (options.dev ? ' --dev' : '')
            + (exact ? ' --exact' : '');
    } else {
        console.log(`Installing ${packageToInstall} with NPM...`);
        installCommand = `npm install --save${options.dev ? '-dev' : ''} ${packageToInstall}`;
    }

    execSync(installCommand, { stdio: 'inherit' });
}
