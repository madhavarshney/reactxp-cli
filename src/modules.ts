// Copyright (c) 2018, Madhav Varshney.
// This source code is licensed under the MIT license.

declare module 'prompts' {
    export interface PromptOptions {
        message: string;
        initial?: boolean | string | number;
    }
    export namespace prompts {
        function text(options: PromptOptions): string;
        function confirm(options: PromptOptions): boolean;
    }
}

declare module 'figlet' {
    export function textSync(text: string): string;
}

declare module 'yeoman-environment' {
    export function createEnv(): {
        register(path: string, name: string): void;
        run(command: string, opts: any, handler: () => void): void;
    };
}
