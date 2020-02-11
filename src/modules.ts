// Copyright (c) 2018-2020, Madhav Varshney.
// This source code is licensed under the MIT license.

declare module 'prompts' {
    export interface PromptOptions<T = string> {
        message: string;
        initial?: boolean | string | number;
        choices?: Array<{ title?: string, value: T }>;
    }
    export namespace prompts {
        function text(options: PromptOptions): Promise<string>;
        function confirm(options: PromptOptions): Promise<boolean>;
        function select<T = string>(options: PromptOptions<T>): T;
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
