export declare const CliEffects: {
    CLEAR: string;
    BRIGHT: string;
    DIM: string;
    UNDERSCORE: string;
    BLINK: string;
    REVERSE: string;
    HIDDEN: string;
};
export declare const CliForeground: {
    BLACK: string;
    RED: string;
    GREEN: string;
    YELLOW: string;
    BLUE: string;
    MAGENTA: string;
    CYAN: string;
    WHITE: string;
    GREY: string;
};
export declare const CliBackground: {
    BLACK: string;
    RED: string;
    GREEN: string;
    YELLOW: string;
    BLUE: string;
    MAGENTA: string;
    CYAN: string;
    WHITE: string;
    GREY: string;
};
export declare class Logger {
    readonly namespace: string;
    constructor(namespace: string);
    private format;
    debug(...args: string[]): void;
    error(...args: string[]): void;
    info(...args: string[]): void;
    log(...args: string[]): void;
    warn(...args: string[]): void;
    verbose(...args: string[]): void;
}
//# sourceMappingURL=logger.d.ts.map