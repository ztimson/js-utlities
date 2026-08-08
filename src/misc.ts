import {LogLevels} from './logger.ts';
import {PathEvent} from './path-events.ts';
import {md5} from './string';

/**
 * Compare version numbers
 * @param {string} target
 * @param {string} vs
 * @return {number} -1 = target is lower, 0 = equal, 1 = higher
 */
export function compareVersions(target: string, vs: string): -1 | 0 | 1 {
	const [tMajor, tMinor, tPatch] = target.split('.').map(v => +v.replace(/[^0-9]/g, ''));
	const [vMajor, vMinor, vPatch] = vs.split('.').map(v => +v.replace(/[^0-9]/g, ''));
	return (tMajor > vMajor || tMinor > vMinor || tPatch > vPatch) ? 1 :
		(tMajor < vMajor || tMinor < vMinor || tPatch < vPatch) ? -1 : 0;
}

/**
 * Create a console object to intercept logs with optional passthrough
 * @param {null | {debug: Function, log: Function, info: Function, warn: Function, error: Function}} out Passthrough logs, null to silence
 * @param {{[K in LogLevels]?: LogLevels | "none"}} map Map log levels: {log: 'debug', warn: 'error'} = Suppress debug logs, elevate warnings
 * @returns {{debug: Function, log: Function, info: Function, warn: Function, error: Function, stderr: string[], stdout: string[]}}
 */
export function consoleInterceptor(
	out: null | {debug: Function, log: Function, info: Function, warn: Function, error: Function} = console,
	map?: {[K in LogLevels]?: LogLevels | 'none'}
): {debug: Function, log: Function, info: Function, warn: Function, error: Function, output: {debug: any[], log: any[], info: any[], warn: any[], error: any[], stderr: any[], stdout: any[]}} {
	const logs: any = {debug: [], log: [], info: [], warn: [], error: [], stderr: [], stdout: [],}
	const cWrapper = (type: 'debug' | 'log' | 'info' | 'warn' | 'error') => ((...args: any[]) => {
		if(out) out[type](...args);
		logs[type].push(...args);
		if(type == 'error') logs.stderr.push(...args);
		else logs.stdout.push(...args);
	});
	return {
		debug: map?.debug != 'none' ? cWrapper(map?.debug || 'debug') : () => {},
		log: map?.log != 'none' ? cWrapper(map?.log || 'log') : () => {},
		info: map?.info != 'none' ? cWrapper(map?.info || 'info') : () => {},
		warn: map?.warn != 'none' ? cWrapper(map?.warn || 'warn') : () => {},
		error: map?.error != 'none' ? cWrapper(map?.error || 'error') : () => {},
		output: logs
	}
}


/**
 * Escape any regex special characters to avoid misinterpretation during search
 * @param {string} value String which should be escaped
 * @return {string} New escaped sequence
 */
export function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');
}

/**
 * Run a stringified function with arguments asynchronously
 * @param {object} args Map of key/value arguments
 * @param {string} fn Function as string
 * @param {boolean} async Run with async (returns a promise)
 * @return {T | Promise<T>} Function return result
 */
export function fn<T>(args: object, fn: string, async: boolean = false): T {
	const keys = Object.keys(args);
	return new Function(...keys, `return (${async ? 'async ' : ''}(${keys.join(',')}) => { ${fn} })(${keys.join(',')})`)(...keys.map(k => (<any>args)[k]));
}

/**
 * Get profile image from Gravatar
 *
 * @param {string} email Account email address
 * @param {string} def Default image, can be a link or '404', see: https://docs.gravatar.com/general/images/
 * @returns {string} Gravatar URL
 */
export function gravatar(email: string, def='mp') {
	if(!email) return '';
	return `https://www.gravatar.com/avatar/${md5(email)}?d=${def}`;
}

/**
 * Represents a function that listens for events and handles them accordingly.
 *
 * @param {PathEvent} event - The event object containing data related to the triggered event.
 * @param {...any} args - Additional arguments that may be passed to the listener.
 * @returns {any} The return value of the listener, which can vary based on implementation.
 */
export type Listener = (event: PathEvent, ...args: any[]) => any;

/** Represents a function that can be called to unsubscribe from an event, stream, or observer */
export type Unsubscribe = () => void;
