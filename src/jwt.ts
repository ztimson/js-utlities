import {JSONAttemptParse} from './objects.ts';

/**
 * Creates a JSON Web Token (JWT) using the provided payload.
 *
 * @param {object} payload The payload to include in the JWT.
 * @param signature Add a JWT signature
 * @return {string} The generated JWT string.
 */
export function createJwt(payload: object, signature = 'unsigned'): string {
	const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" }))
		.toString('base64url');
	const body = Buffer.from(JSON.stringify(payload))
		.toString('base64url');
	// Signature is irrelevant for decodeJwt
	return `${header}.${body}.${signature}`;
}

/**
 * Decode a JSON Web Token (JWT) payload, this will not check for tampering so be careful
 *
 * @param {string} token JWT to decode
 * @return {unknown} JWT payload
 */
export function decodeJwt<T>(token: string): T {
	const base64 = token.split('.')[1]
		.replace(/-/g, '+').replace(/_/g, '/');
	return <T>JSONAttemptParse(decodeURIComponent(atob(base64).split('').map(function(c) {
		return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
	}).join('')));
}
