import {TypedEmitter, TypedEvents} from './emitter';

export const CliEffects = {
	CLEAR: "\x1b[0m",
	BRIGHT: "\x1b[1m",
	DIM: "\x1b[2m",
	UNDERSCORE: "\x1b[4m",
	BLINK: "\x1b[5m",
	REVERSE: "\x1b[7m",
	HIDDEN: "\x1b[8m",
}

export const CliForeground = {
	BLACK: '\x1b[30m',
	RED: '\x1b[31m',
	GREEN: '\x1b[32m',
	YELLOW: '\x1b[33m',
	BLUE: '\x1b[34m',
	MAGENTA: '\x1b[35m',
	CYAN: '\x1b[36m',
	LIGHT_GREY: '\x1b[37m',
	GREY: '\x1b[90m',
	LIGHT_RED: '\x1b[91m',
	LIGHT_GREEN: '\x1b[92m',
	LIGHT_YELLOW: '\x1b[93m',
	LIGHT_BLUE: '\x1b[94m',
	LIGHT_MAGENTA: '\x1b[95m',
	LIGHT_CYAN: '\x1b[96m',
	WHITE: '\x1b[97m',
}

export const CliBackground = {
	BLACK: "\x1b[40m",
	RED: "\x1b[41m",
	GREEN: "\x1b[42m",
	YELLOW: "\x1b[43m",
	BLUE: "\x1b[44m",
	MAGENTA: "\x1b[45m",
	CYAN: "\x1b[46m",
	WHITE: "\x1b[47m",
	GREY: "\x1b[100m",
}

export enum LOG_LEVEL {
	VERBOSE,
	INFO,
	WARN,
	ERROR
}

export type LoggerEvents = TypedEvents & {
	'VERBOSE': (...args: any[]) => any;
	'INFO': (...args: any[]) => any;
	'WARN': (...args: any[]) => any;
	'ERROR': (...args: any[]) => any;
};

export class Logger extends TypedEmitter<LoggerEvents> {
	static LOG_LEVEL: LOG_LEVEL = LOG_LEVEL.INFO;

	constructor(public readonly namespace: string) {
		super();
	}

	private format(...text: string[]): string {
		return `${new Date().toISOString()} [${this.namespace}] ${text.join(' ')}`;
	}

	debug(...args: string[]) {
		if(LOG_LEVEL.VERBOSE >= Logger.LOG_LEVEL) {
			Logger.emit(LOG_LEVEL.VERBOSE, ...args);
			console.debug(CliForeground.LIGHT_GREY + this.format(...args) + CliEffects.CLEAR);
		}
	}

	error(...args: string[]) {
		if(LOG_LEVEL.ERROR >= Logger.LOG_LEVEL) {
			Logger.emit(LOG_LEVEL.ERROR, ...args);
			console.error(CliForeground.RED + this.format(...args) + CliEffects.CLEAR);
		}
	}

	info(...args: string[]) {
		if(LOG_LEVEL.INFO >= Logger.LOG_LEVEL) {
			Logger.emit(LOG_LEVEL.INFO, ...args);
			console.info(CliForeground.CYAN + this.format(...args) + CliEffects.CLEAR);
		}
	}

	log(...args: string[]) {
		if(LOG_LEVEL.INFO >= Logger.LOG_LEVEL) {
			Logger.emit(LOG_LEVEL.INFO, ...args);
			console.log(CliEffects.CLEAR + this.format(...args));
		}
	}

	warn(...args: string[]) {
		if(LOG_LEVEL.WARN >= Logger.LOG_LEVEL) {
			Logger.emit(LOG_LEVEL.WARN, ...args);
			console.warn(CliForeground.YELLOW + this.format(...args) + CliEffects.CLEAR);
		}
	}
}
