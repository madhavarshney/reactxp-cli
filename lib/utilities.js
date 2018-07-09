// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.
// Derived from React Native:
// Copyright (c) 2015-present, Facebook, Inc.

const path = require('path');
const execSync = require('child_process').execSync;
const semver = require('semver');

function reactNativePackageJsonPath() {
    return path.resolve(
        process.cwd(),
        'node_modules',
        'react-native',
        'package.json',
    );
};

function getYarnVersionIfAvailable() {
    let yarnVersion;
    try {
        if (process.platform === 'win32') {
            yarnVersion = (execSync('yarn --version 2> NUL').toString() || '').trim();
        } else {
            yarnVersion = (
                execSync('yarn --version 2>/dev/null').toString() || ''
            ).trim();
        }
    } catch (error) {
        return null;
    }
    try {
        return semver.gte(yarnVersion, '1.0.0') ? yarnVersion : null;
    } catch (error) {
        console.error('Cannot parse yarn version: ' + yarnVersion);
        return null;
    }
}

function validateProjectName(name) {
    if (!String(name).match(/^[$A-Z_][0-9A-Z_$]*$/i)) {
        console.error(
            '"%s" is not a valid name for a project. Please use a valid identifier ' +
            'name (alphanumeric).',
            name,
        );
        process.exit(1);
    }

    if (name === 'React') {
        console.error(
            '"%s" is not a valid name for a project. Please do not use the ' +
            'reserved word "React".',
            name,
        );
        process.exit(1);
    }
}

function checkNodeVersion() {
    var packageJson = require(reactNativePackageJsonPath());
    if (!packageJson.engines || !packageJson.engines.node) {
        return;
    }
    if (!semver.satisfies(process.version, packageJson.engines.node)) {
        console.error(
            chalk.red(
                'You are currently running Node %s but React Native requires %s. ' +
                'Please use a supported version of Node.\n' +
                'See https://facebook.github.io/react-native/docs/getting-started.html',
            ),
            process.version,
            packageJson.engines.node,
        );
    }
}

module.exports = {
    getYarnVersionIfAvailable,
    validateProjectName,
    checkNodeVersion
}
