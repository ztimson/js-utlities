/**
 * Like setInterval but will adjust the timeout value to account for runtime
 * @param {Function} cb Callback function that will be ran
 * @param {number} ms Run function ever x seconds
 * @return {() => void}
 */
export function adjustedInterval(cb: Function, ms: number) {
	let cancel = false, timeout: any = null;
	const p = async () => {
		if (cancel) return;
		const start = new Date().getTime();
		await cb();
		const end = new Date().getTime();
		timeout = setTimeout(() => p(), ms - (end - start) || 1);
	};
	p();
	return () => {
		cancel = true;
		if(timeout) clearTimeout(timeout);
	}
}

/**
 * Return date formated highest to lowest: YYYY-MM-DD H:mm AM
 *
 * @param {Date | number | string} date Date or timestamp to convert to string
 * @return {string} Formated date
 */
export function formatDate(date: Date | number | string): string {
	if(typeof date == 'number' || typeof date == 'string') date = new Date(date);
	let hours = date.getHours(), postfix = 'AM';
	if(hours >= 12) {
		if(hours > 12) hours -= 12;
		postfix = 'PM';
	} else if(hours == 0) hours = 12;
	return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}, ${hours}:${date.getMinutes().toString().padStart(2, '0')} ${postfix}`;
}

/**
 * Use in conjunction with `await` to pause an async script
 *
 * @example
 * ```js
 * await sleep(1000) // Pause for 1 second
 * ```
 *
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
 * await sleepWhile(() => loading); // Won't continue until loading flag is false
 * ```
 *
 * @param {() => boolean | Promise<boolean>} fn Return true to continue
 * @param {number} checkInterval Run function ever x milliseconds
 * @return {Promise<void>} Callback when sleep is over
 */
export async function sleepWhile(fn : () => boolean | Promise<boolean>, checkInterval = 100): Promise<void> {
	while(await fn()) await sleep(checkInterval);
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
