import {JSONAttemptParse} from './objects.ts';

/**
 * Decode a JWT payload, this will not check for tampering so be careful
 *
 * @param {string} token JWT to decode
 * @return {unknown} JWT payload
 */
export function jwtDecode<T>(token: string): T {
	const base64 = token.split('.')[1]
		.replace(/-/g, '+').replace(/_/g, '/');
	return <T>JSONAttemptParse(decodeURIComponent(atob(base64).split('').map(function(c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join('')));
}
