import {PathEvent} from './path-events.ts';
import {md5} from './string';

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
 * Convert IPv6 to v4 because who uses that, NAT4Life
 * @param {string} ip IPv6 address, e.g. 2001:0db8:85a3:0000:0000:8a2e:0370:7334
 * @returns {string | null} IPv4 address, e.g. 172.16.58.3
 */
export function ipV6ToV4(ip: string) {
	if(!ip) return null;
	const ipv4 = ip.split(':').splice(-1)[0];
	if(ipv4 == '1') return '127.0.0.1';
	return ipv4;
}

/**
 * Check if IP is reserved, e.g. localhost, private IPs, etc.
 * @param {string} ip
 * @returns {boolean}
 */
export function reservedIp(ip: string): boolean {
	if(ip == 'localhost' || ip == '127.0.0.1') return true;
	return /\b(10\.(?:[0-9]{1,3}\.){2}[0-9]{1,3})\b|\b(172\.(?:1[6-9]|2[0-9]|3[0-1])\.(?:[0-9]{1,3}\.)[0-9]{1,3})\b|\b(192\.168\.(?:[0-9]{1,3}\.)[0-9]{1,3})\b/.test(ip);
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
