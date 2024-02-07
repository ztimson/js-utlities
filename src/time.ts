/**
 * Calculate the number of milliseconds until date/time
 *
 * @param {Date | number} date - Target
 * @returns {number} - Number of milliseconds until target
 */
export function timeUntil(date: Date | number): number {
	return (date instanceof Date ? date.getTime() : date) - (new Date()).getTime();
}

/**
 * Use in conjunction with `await` to pause an async script
 *
 * @example
 * ```ts
 * async () => {
 *      ...
 *      await sleep(1000) // Pause for 1 second
 *	    ...
 * }
 * ```
 *
 * @param {number} ms - Time to pause for in milliseconds
 * @returns {Promise<unknown>} - Resolves promise when it's time to resume
 */
export function sleep(ms: number) {
	return new Promise(res => setTimeout(res, ms));
}

export function formatDate(date: Date | number | string) {
	const d = date instanceof Date ? date : new Date(date);
	return new Intl.DateTimeFormat("en-us", {
		weekday: "long",
		month: "short",
		day: "numeric",
		hour: "numeric",
		minute: "numeric",
		hour12: true
	}).format(d);
}
