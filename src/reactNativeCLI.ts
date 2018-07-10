// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.
// Portions derived from React Native:
// Copyright (c) 2015-present, Facebook, Inc.

import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';

import {
    checkNodeVersion,
    installPackage,
} from './utilities';

export interface RNInitOptions {
    version: string;
    npm?: boolean;
    installCommand?: string;
    verbose?: boolean;
}

function getRNInstallPackage(rnPackageOrVersion: string) {
    const isValidSemver = semver.valid(rnPackageOrVersion);
    return isValidSemver ? `react-native@${isValidSemver}` : rnPackageOrVersion;
}

export function init(name: string, options: RNInitOptions) {
    const root = path.resolve(name);
    const projectName = path.basename(root);

    console.log('This will walk you through creating a new React Native project in', root);

    if (!fs.existsSync(root)) {
        fs.mkdirSync(root);
    }

    // tslint:disable:object-literal-sort-keys
    const packageJson = {
        name: projectName,
        version: '0.0.1',
        private: true,
        scripts: {
            start: 'react-native start',
            ios: 'react-native run-ios',
            android: 'react-native run-android',
        },
    };
    // tslint:enable:object-literal-sort-keys

    process.chdir(root);
    fs.writeFileSync(path.join(root, 'package.json'), JSON.stringify(packageJson));
    installPackage(getRNInstallPackage(options.version), options);

    checkNodeVersion();

    const reactNativeLocalCLI = require(path.resolve(process.cwd(), 'node_modules/react-native/cli.js'));
    reactNativeLocalCLI.init(root, projectName);
}
