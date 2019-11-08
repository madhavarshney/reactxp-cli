<p align="center">
  <img alt="ReactXP CLI" src="./docs/ReactXPCLI.jpg" width="512">
</p>

---

🚀 ReactXP-CLI is a tool to create and manage ReactXP projects, allowing you to get started within minutes.

## Features:
  - 🚧 Note - Coming Soon!
  - Supports generating ReactXP projects for:
    - Android
    - iOS
    - Web
    - Windows (UWP)
  - Allows fine-grained control on library versions used to create project
  - Allows choosing NPM or Yarn

## Installation
This project has not been published to NPM yet. Once it is, you can install it by:
```sh
$ npm i -g reactxp-cli
# OR
$ yarn global add reactxp-cli
```

## Usage
To run ReactXP-CLI, type the command `reactxp` followed by any of the following subcommands:

```sh
reactxp <command> [options]

Commands:
  reactxp init [project-name]  Create a new ReactXP project.
  reactxp upgrade              Upgrade an existing ReactXP project.

Options:
  --help     Show help            [boolean]
  --version  Show version number  [boolean]
```

### Creating a new project

Run `reactxp init` followed by any of the following options to create a new project:

```
reactxp init [project-name]

Positionals:
  project-name  The name or path of the project to create.

Options:
  --help               Show help                                     [boolean]
  --version            Show version number                           [boolean]
  --npm                Use NPM even if Yarn is present.              [boolean] [default: false]
  --verbose            Enable verbose logging.                       [boolean] [default: false]
  --rxp-version        The version of ReactXP to use.                [string]
  --rn-version         The version of React Native to use.           [string]
  --windows-version    The version of React Native Windows to use.   [string]
  --windows-namespace  The namespace that will be used in the generated Windows C# code.   [string]
  --skip-init          Skip adding React Native                      [boolean] [default: false]
  --skip-windows       Skip adding Windows UWP support.              [boolean] [default: false]
  --skip-rxp           Skip adding ReactXP                           [boolean] [default: false]
```

### Upgrading an existing project

_This feature has not been built yet.  Stay tuned!_

## Contributing
To run this project locally:

1. Run `yarn` to install the dependencies.
2. Run `yarn run build` to build the project or `yarn run watch` to watch and rebuild on file changes
4. Run `yarn run cli [options]` to build & run the CLI
3. Run `yarn run lint [--fix]` to lint the project using TSLint

All contributions are welcome. Please open an issue or submit a PR to help improve this project.
