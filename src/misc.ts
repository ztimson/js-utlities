import {PathEvent} from './path-events.ts';
import {md5} from './string';

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
 * Escape any regex special characters to avoid misinterpretation during search
 *
 * @param {string} value String which should be escaped
 * @return {string} New escaped sequence
 */
export function escapeRegex(value: string) {
	return value.replace(/[.*+?^${}()|\[\]\\]/g, '\\$&');
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
