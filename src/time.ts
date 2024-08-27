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

/**
 * Use in conjunction with `await` to pause an async script
 *
 * @example
 * ```js
 * await sleep(1000) // Pause for 1 second
 * ```
 * @param {number} ms - Time to pause for in milliseconds
 * @returns {Promise<unknown>} - Resolves promise when it's time to resume
 */
export function sleep(ms: number): Promise<void> {
	return new Promise(res => setTimeout(res, ms));
}

/**
 * Sleep while function returns true
 *
 * @example
 * ```js
 * let loading = true;
 * setTimeout(() => wait = false, 1000);
 * await sleepUntil(() => loading); // Won't continue until loading flag is false
 * ```
 * @param {() => boolean} fn Return true to continue
 * @param {number} checkInterval Run function ever x milliseconds
 * @return {Promise<void>} Callback when sleep is over
 */
export async function sleepUntil(fn : () => boolean, checkInterval=100): Promise<void> {
	while(fn()) await sleep(checkInterval);
}

/**
 * Calculate the number of milliseconds until date/time
 *
 * @param {Date | number} date - Target
 * @returns {number} - Number of milliseconds until target
 */
export function timeUntil(date: Date | number): number {
	return (date instanceof Date ? date.getTime() : date) - (new Date()).getTime();
}
