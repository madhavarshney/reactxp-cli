// Copyright (c) 2018-2019, Madhav Varshney.
// This source code is licensed under the MIT license.

import * as chalk from 'chalk';
import { execSync } from 'child_process';
import { resolve } from 'path';
import { prompts } from 'prompts';

import { copyProjectTemplateAndReplace } from './copyTemplate';
import { Packages } from './interfaces';
import { getInstallVersion } from './utilities';

export interface RXInitOptions {
    name: string;
    rxpVersion: string;
}

const packageName = Packages.ReactXP;

async function getRXPackage(rxVersionOption?: string): Promise<string | false> {
    let packageVersion = getInstallVersion(packageName, rxVersionOption, {});

    if (!packageVersion) {
        console.log(`Checking for the latest version of ${packageName}`);
        packageVersion = JSON.parse(
            execSync(`npm view ${packageName} version --json`).toString().trim(),
        );
    }

    if (!packageVersion) {
        console.log(chalk.redBright(`\nERROR: Cannot find the latest version of ${packageName}.\n`));

        const newVersion = await prompts.text({
            message: 'Enter the version of ReactXP to use: ',
        });
        if (newVersion && newVersion.length > 0) {
            return getRXPackage(newVersion);
        }
    }

    return packageVersion || false;
}

export async function init(options: RXInitOptions) {
    console.log(chalk.bold.whiteBright('Adding support for ReactXP...'));

    await copyProjectTemplateAndReplace(
        resolve(__dirname, '../templates/javascript'),
        process.cwd(),
        {},
    );
}

export async function getDependencies(options: RXInitOptions) {
    const packageVersion = await getRXPackage(options.rxpVersion);
    return packageVersion ? {
        package: `${packageName}@${packageVersion}`,
        version: packageVersion,
    } : null;
}
