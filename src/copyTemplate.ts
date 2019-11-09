// tslint:disable: max-line-length

/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * This original source can be foud in the following places:
 * - https://github.com/react-native-community/cli/blob/master/packages/cli/src/tools/walk.ts
 * - https://github.com/react-native-community/cli/blob/master/packages/cli/src/tools/copyAndReplace.ts
 * - https://github.com/react-native-community/cli/blob/master/packages/cli/src/tools/generator/copyProjectTemplateAndReplace.ts
 *
 */

// tslint:enable: max-line-length

import chalk from 'chalk';
import * as fs from 'fs';
import * as path from 'path';
import { prompts } from 'prompts';

export function walk(current: string): string[] {
  if (!fs.lstatSync(current).isDirectory()) {
    return [current];
  }

  const files = fs
    .readdirSync(current)
    .map((child) => walk(path.join(current, child)));
  const result: string[] = [];
  return result.concat.apply([current], files);
}

// Binary files, don't process these (avoid decoding as utf8)
const binaryExtensions = ['.png', '.jar', '.keystore'];

type ContentChangedCallbackOption = 'identical' | 'changed' | 'new' | null;

/**
 * Copy a file to given destination, replacing parts of its contents.
 * @param srcPath Path to a file to be copied.
 * @param destPath Destination path.
 * @param replacements: e.g. {'TextToBeReplaced': 'Replacement'}
 * @param contentChangedCallback
 *        Used when upgrading projects. Based on if file contents would change
 *        when being replaced, allows the caller to specify whether the file
 *        should be replaced or not.
 *        If null, files will be overwritten.
 *        Function(path, 'identical' | 'changed' | 'new') => 'keep' | 'overwrite'
 */
async function copyAndReplace(
  srcPath: string,
  destPath: string,
  replacements: Record<string, string>,
  contentChangedCallback:
    | ((
        path: string,
        option: ContentChangedCallbackOption,
      ) => Promise<'keep' | 'overwrite'>)
    | null,
) {
  if (fs.lstatSync(srcPath).isDirectory()) {
    if (!fs.existsSync(destPath)) {
      fs.mkdirSync(destPath);
    }
    // Not recursive
    return;
  }

  const extension = path.extname(srcPath);
  if (binaryExtensions.indexOf(extension) !== -1) {
    // Binary file
    let shouldOverwrite = 'overwrite';
    if (contentChangedCallback) {
      const newContentBuffer = fs.readFileSync(srcPath);
      let contentChanged: ContentChangedCallbackOption = 'identical';
      try {
        const origContentBuffer = fs.readFileSync(destPath);
        if (Buffer.compare(origContentBuffer, newContentBuffer) !== 0) {
          contentChanged = 'changed';
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          contentChanged = 'new';
        } else {
          throw err;
        }
      }
      shouldOverwrite = await contentChangedCallback(destPath, contentChanged);
    }
    if (shouldOverwrite === 'overwrite') {
      copyBinaryFile(srcPath, destPath, (err) => {
        if (err) {
          throw err;
        }
      });
    }
  } else {
    // Text file
    const srcPermissions = fs.statSync(srcPath).mode;
    let content = fs.readFileSync(srcPath, 'utf8');
    Object.keys(replacements).forEach((regex) => {
      content = content.replace(new RegExp(regex, 'g'), replacements[regex]);
    });

    let shouldOverwrite = 'overwrite';
    if (contentChangedCallback) {
      // Check if contents changed and ask to overwrite
      let contentChanged: ContentChangedCallbackOption = 'identical';
      try {
        const origContent = fs.readFileSync(destPath, 'utf8');
        if (content !== origContent) {
          // logger.info('Content changed: ' + destPath);
          contentChanged = 'changed';
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          contentChanged = 'new';
        } else {
          throw err;
        }
      }
      shouldOverwrite = await contentChangedCallback(destPath, contentChanged);
    }
    if (shouldOverwrite === 'overwrite') {
      fs.writeFileSync(destPath, content, {
        encoding: 'utf8',
        mode: srcPermissions,
      });
    }
  }
}

/**
 * Same as 'cp' on Unix. Don't do any replacements.
 */
function copyBinaryFile(
  srcPath: string,
  destPath: string,
  cb: (err?: Error) => void,
) {
  let cbCalled = false;
  const srcPermissions = fs.statSync(srcPath).mode;
  const readStream = fs.createReadStream(srcPath);
  readStream.on('error', (err) => {
    done(err);
  });
  const writeStream = fs.createWriteStream(destPath, {
    mode: srcPermissions,
  });
  writeStream.on('error', (err) => {
    done(err);
  });
  writeStream.on('close', () => {
    done();
  });
  readStream.pipe(writeStream);
  function done(err?: Error) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

interface Options {
  upgrade?: boolean;
  force?: boolean;
  displayName?: string;
  ignorePaths?: string[];
}

/**
 * Util for creating a new React Native project.
 * Copy the project from a template and use the correct project name in
 * all files.
 * @param srcPath e.g. '/Users/martin/AwesomeApp/node_modules/react-native/template'
 * @param destPath e.g. '/Users/martin/AwesomeApp'
 * @param newProjectName e.g. 'AwesomeApp'
 * @param options e.g. {
 *          upgrade: true,
 *          force: false,
 *          displayName: 'Hello World',
 *          ignorePaths: ['template/file/to/ignore.md'],
 *        }
 */
export async function copyProjectTemplateAndReplace(
  srcPath: string,
  destPath: string,
  // newProjectName: string,
  options: Options = {},
) {
  if (!srcPath) {
    throw new Error('Need a path to copy from');
  }
  if (!destPath) {
    throw new Error('Need a path to copy to');
  }
  // if (!newProjectName) {
  //   throw new Error('Need a project name');
  // }

  const files = walk(srcPath);

  for (const absoluteSrcFilePath of files) {
    // 'react-native upgrade'
    // if (options.upgrade) {
    //   // Don't upgrade these files
    //   const fileName = path.basename(absoluteSrcFilePath);
    //   // This also includes __tests__/index.*.js
    //   if (fileName === 'index.ios.js') {
    //     return;
    //   }
    //   if (fileName === 'index.android.js') {
    //     return;
    //   }
    //   if (fileName === 'index.js') {
    //     return;
    //   }
    //   if (fileName === 'App.js') {
    //     return;
    //   }
    // }

    const relativeFilePath = path.relative(srcPath, absoluteSrcFilePath);
    // const relativeFilePath = translateFilePath(
    //   path.relative(srcPath, absoluteSrcFilePath),
    // )
    //   .replace(/HelloWorld/g, newProjectName)
    //   .replace(/helloworld/g, newProjectName.toLowerCase());

    // Templates may contain files that we don't want to copy.
    // Examples:
    // - Dummy package.json file included in the template only for publishing to npm
    // - Docs specific to the template (.md files)
    // if (options.ignorePaths) {
    //   if (!Array.isArray(options.ignorePaths)) {
    //     throw new Error('options.ignorePaths must be an array');
    //   }
    //   if (
    //     options.ignorePaths.some((ignorePath) => ignorePath === relativeFilePath)
    //   ) {
    //     // Skip copying this file
    //     return;
    //   }
    // }

    const contentChangedCallback = (
      fileDestPath: string,
      contentChanged: ContentChangedCallbackOption,
    ) =>
      upgradeFileContentChangedCallback(
        absoluteSrcFilePath,
        relativeFilePath,
        contentChanged,
      );
    // let contentChangedCallback = null;
    // if (options.upgrade && !options.force) {
    //   contentChangedCallback = (
    //     destPath2: string,
    //     contentChanged: ContentChangedCallbackOption,
    //   ) =>
    //     upgradeFileContentChangedCallback(
    //       absoluteSrcFilePath,
    //       relativeFilePath,
    //       contentChanged,
    //     );
    // }
    await copyAndReplace(
      absoluteSrcFilePath,
      path.resolve(destPath, relativeFilePath),
      {
        // 'Hello App Display Name': options.displayName || newProjectName,
        // HelloWorld: newProjectName,
        // helloworld: newProjectName.toLowerCase(),
      },
      contentChangedCallback,
    );
  }

  // return Promise.all(walk(srcPath).map(async (absoluteSrcFilePath: string) => {
  // }));
}

/**
 * There are various files in the templates folder in the RN repo. We want
 * these to be ignored by tools when working with React Native itself.
 * Example: _babelrc file is ignored by Babel, renamed to .babelrc inside
 *          a real app folder.
 * This is especially important for .gitignore because npm has some special
 * behavior of automatically renaming .gitignore to .npmignore.
 */
// function translateFilePath(filePath: string) {
//   if (!filePath) {
//     return filePath;
//   }
//   return filePath
//     .replace('_BUCK', 'BUCK')
//     .replace('_gitignore', '.gitignore')
//     .replace('_gitattributes', '.gitattributes')
//     .replace('_babelrc', '.babelrc')
//     .replace('_eslintrc.js', '.eslintrc.js')
//     .replace('_flowconfig', '.flowconfig')
//     .replace('_buckconfig', '.buckconfig')
//     .replace('_prettierrc.js', '.prettierrc.js')
//     .replace('_watchmanconfig', '.watchmanconfig');
// }

async function upgradeFileContentChangedCallback(
  absoluteSrcFilePath: string,
  relativeDestPath: string,
  contentChanged: ContentChangedCallbackOption,
) {
  if (contentChanged === 'new') {
    console.log(`${chalk.bold('new')} ${relativeDestPath}`);
    return 'overwrite';
  }
  if (contentChanged === 'changed') {
    console.log(
      `\nA different version of ${chalk.bold(relativeDestPath)} ` +
        // `has changed in the new version.\nDo you want to keep your ${relativeDestPath} or replace it with the ` +
        // 'latest version?\nIf you ever made any changes ' +
        // `to this file, you'll probably want to keep it.\n` +
        // `You can see the new version here: ${absoluteSrcFilePath}\n` +
        // `Do you want to replace ${relativeDestPath}? ` +
        // 'Answer y to replace, n to keep your version: ',
        `already exists in your project.\nDo you want to keep your ${relativeDestPath} or replace it with the ` +
        'version in this template?\nIf you ever made any changes ' +
        `to this file, you'll probably want to keep it.\n` +
        `You can see the new version here: ${absoluteSrcFilePath}\n` +
        `Do you want to replace ${relativeDestPath}? `,
    );
    const answer = await prompts.confirm({ message: 'Answer y to replace, n to keep your version: ' });
    if (answer === true) {
      console.log(`Replacing ${relativeDestPath}`);
      return 'overwrite';
    }
    console.log(`Keeping your ${relativeDestPath}`);
    return 'keep';
  }
  if (contentChanged === 'identical') {
    return 'keep';
  }
  throw new Error(
    `Unknown file changed state: ${relativeDestPath}, ${contentChanged}`,
  );
}
