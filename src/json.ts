/**
 * Parse JSON but return the original string if it fails
 *
 * @param {any} json JSON string to parse
 * @param fallback Fallback value if unable to parse, defaults to original string
 * @return {string | T} Object if successful, original string otherwise
 */
export function JSONAttemptParse<T1, T2>(json: T2, fallback?: T1): T1 | T2 {
	try { return JSON.parse(<any>json); }
	catch { return fallback ?? json; }
}

/**
 * Stringifies objects & skips primitives
 *
 * @param {any} obj Object to convert to serializable value
 * @return {string | T} Serialized value
 */
export function JSONSerialize<T1>(obj: T1): T1 | string {
	if(typeof obj == 'object' && obj != null) return JSONSanitize(obj);
	return obj;
}

/**
 * Convert an object to a JSON string avoiding any circular references.
 *
 * @param obj Object to convert to JSON
 * @param {number} space Format the JSON with spaces
 * @return {string} JSON string
 */
export function JSONSanitize(obj: any, space?: number): string {
	const cache: any[] = [];
	return JSON.stringify(obj, (key, value) => {
		if(typeof value === 'object' && value !== null) {
			if(cache.includes(value)) return '[Circular]';
			cache.push(value);
		}
		return value;
	}, space);
}
