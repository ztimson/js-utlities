export declare class CustomError extends Error {
    static code: number;
    private _code?;
    get code(): number;
    set code(c: number);
    constructor(message?: string, code?: number);
    static from(err: Error): CustomError;
    static instanceof(err: Error): boolean;
    toString(): string;
}
export declare class BadRequestError extends CustomError {
    static code: number;
    constructor(message?: string);
    static instanceof(err: Error): boolean;
}
export declare class UnauthorizedError extends CustomError {
    static code: number;
    constructor(message?: string);
    static instanceof(err: Error): boolean;
}
export declare class ForbiddenError extends CustomError {
    static code: number;
    constructor(message?: string);
    static instanceof(err: Error): boolean;
}
export declare class NotFoundError extends CustomError {
    static code: number;
    constructor(message?: string);
    static instanceof(err: Error): boolean;
}
export declare class InternalServerError extends CustomError {
    static code: number;
    constructor(message?: string);
    static instanceof(err: Error): boolean;
}
//# sourceMappingURL=errors.d.ts.map