declare module 'prompt' {
    export function start(): void;
    export function get(property: any, handler: (err: Error, result: any) => void): void;
}

declare module 'figlet' {
    export function textSync(text: string): string;
}
