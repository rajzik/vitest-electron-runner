declare module '@ungap/structured-clone/json' {
  export function stringify(value: unknown): string;
  export function parse(value: string): unknown;
}
