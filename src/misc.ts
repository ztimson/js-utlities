import {md5} from './string';

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
