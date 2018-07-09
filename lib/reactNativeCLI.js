// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.
// Derived from React Native:
// Copyright (c) 2015-present, Facebook, Inc.

'use strict';

const fs = require('fs');
const path = require('path');
const execSync = require('child_process').execSync;
const prompt = require('prompt');
const semver = require('semver');

const {
    getYarnVersionIfAvailable,
    validateProjectName,
    checkNodeVersion
} = require('./utilities.js');


function cliModulePath() {
    return path.resolve(process.cwd(), 'node_modules', 'react-native', 'cli.js');
};

function createAfterConfirmation(name, options) {
    prompt.start();

    var property = {
        name: 'yesno',
        message: 'Directory ' + name + ' already exists. Continue?',
        validator: /y[es]*|n[o]?/,
        warning: 'Must respond yes or no',
        default: 'no',
    };

    prompt.get(property, function (err, result) {
        if (result.yesno[0] === 'y') {
            createProject(name, options);
        } else {
            console.log('Project initialization canceled');
            process.exit();
        }
    });
}

function createProject(name, options) {
    var root = path.resolve(name);
    var projectName = path.basename(root);

    console.log('This will walk you through creating a new React Native project in', root);

    if (!fs.existsSync(root)) {
        fs.mkdirSync(root);
    }

    var packageJson = {
        name: projectName,
        version: '0.0.1',
        private: true,
        scripts: {
            start: 'node node_modules/react-native/local-cli/cli.js start',
            ios: 'react-native run-ios',
            android: 'react-native run-android',
        },
    };
    fs.writeFileSync(
        path.join(root, 'package.json'),
        JSON.stringify(packageJson),
    );
    process.chdir(root);

    run(root, projectName, options);
}

function getInstallPackage(rnPackage) {
    var packageToInstall = 'react-native';
    var isValidSemver = semver.valid(rnPackage);
    if (isValidSemver) {
        packageToInstall += '@' + isValidSemver;
    } else if (rnPackage) {
        // for tar.gz or alternative paths
        packageToInstall = rnPackage;
    }
    return packageToInstall;
}

function run(root, projectName, options) {
    var rnPackage = options.version; // e.g. '0.38' or '/path/to/archive.tgz'
    var forceNpmClient = options.npm;
    var yarnVersion = !forceNpmClient && getYarnVersionIfAvailable();
    var installCommand;
    if (options.installCommand) {
        // In CI environments it can be useful to provide a custom command,
        // to set up and use an offline mirror for installing dependencies, for example.
        installCommand = options.installCommand;
    } else {
        if (yarnVersion) {
            console.log('Using yarn v' + yarnVersion);
            console.log('Installing ' + getInstallPackage(rnPackage) + '...');
            installCommand = 'yarn add ' + getInstallPackage(rnPackage) + ' --exact';
        } else {
            console.log('Installing ' + getInstallPackage(rnPackage) + '...');
            installCommand = 'npm install --save --save-exact ' + getInstallPackage(rnPackage);
        }
        if (options.verbose) {
            installCommand += ' --verbose';
        }
    }
    try {
        execSync(installCommand, { stdio: 'inherit' });
    } catch (err) {
        console.error(err);
        console.error('Command `' + installCommand + '` failed.');
        process.exit(1);
    }
    checkNodeVersion();
    const cli = require(cliModulePath());
    console.log('got here')
    cli.init(root, projectName);
}

/**
 * @param name Project name, e.g. 'AwesomeApp'.
 * @param options.verbose If true, will run 'npm install' in verbose mode (for debugging).
 * @param options.version Version of React Native to install, e.g. '0.38.0'.
 * @param options.npm If true, always use the npm command line client,
 *                       don't use yarn even if available.
 */
function init(name, options) {
    validateProjectName(name);

    if (fs.existsSync(name)) {
        createAfterConfirmation(name, options);
    } else {
        createProject(name, options);
    }
}

module.exports = { init };
