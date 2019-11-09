// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { rmdir, unlink } from 'fs';
import { resolve } from 'path';
import * as semver from 'semver';
import { promisify } from 'util';

export const unlinkAsync = promisify(unlink);
export const rmdirAsync = promisify(rmdir);

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
    looseMatch?: boolean;
}

export function getInstallVersion(
    packageName: string,
    packageVersion: string | undefined,
    options: GetInstallPackageOptions = {},
): string | null {
    if (!packageVersion) {
        return null;
    }

    let range: string | null = null;
    let version = semver.parse(packageVersion);
    if (version) {
        if (options.looseMatch) {
            version = semver.parse(
                `${version.major}.${version.minor}.0` +
                (options.includeRC ? '-rc.0' : ''),
            ) || version;
            range = new semver.Range('^' + version.version).range;
        }
    } else {
        range = semver.validRange(packageVersion);
    }

    if (!range) {
        return (version && version.toString()) || packageVersion;
    } else {
        console.log(`Checking for a version of "${packageName}" matching "${range}"`);
        const versions = JSON.parse(execSync(`npm view ${packageName} versions --json`).toString());
        const versionToInstall = semver.maxSatisfying(versions, range);
        return versionToInstall ? versionToInstall.toString() : null;
    }
}

export interface InstallPackageOptions {
    forceNPM?: boolean;
    dev?: boolean;
    exact?: boolean;
}

export function installPackage(packageToInstall: string | string[], options: InstallPackageOptions) {
    let installCommand: string;
    const exact = valueOrDefault<boolean>(options.exact, true);
    const packageList = Array.isArray(packageToInstall)
        ? packageToInstall.map((p) => `"${p}"`).join(' ')
        : `"${packageToInstall}"`;

    if (!options.forceNPM && getYarnVersionIfAvailable()) {
        console.log(`Installing ${packageList} with Yarn v${yarnVersion}...`);
        installCommand = `yarn add ${packageList}`
            + (options.dev ? ' --dev' : '')
            + (exact ? ' --exact' : '');
    } else {
        console.log(`Installing ${packageList} with NPM...`);
        installCommand = `npm install --save${options.dev ? '-dev' : ''} ${packageList}`;
    }

    execSync(installCommand, { stdio: 'inherit' });
}

export function unlinkMultiple(rootDir: string, files: string[]) {
    return Promise.all(files.map((p) => unlinkAsync(resolve(rootDir, p))));
}
