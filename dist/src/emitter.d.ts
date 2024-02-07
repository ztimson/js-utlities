export type Listener<T> = (event: T) => any;
export declare class Emitter<T> {
    private listeners;
    constructor();
    emit(e: T): void;
    listen(fn: Listener<T>): () => {};
    listen(key: string, fn: Listener<T>): () => {};
    once(fn: Listener<T>): void;
}
//# sourceMappingURL=emitter.d.ts.map