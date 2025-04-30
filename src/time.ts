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
 * Format date
 *
 * @param {string} format How date string will be formatted, default: `YYYY-MM-DD H:mm A`
 * @param {Date | number | string} date Date or timestamp, defaults to now
 * @param tz Set timezone offset
 * @return {string} Formated date
 */
export function formatDate(format = 'YYYY-MM-DD H:mm', date: Date | number | string = new Date(), tz?: string | number): string {
	const timezones = [
		['IDLW', -12],
		['SST', -11],
		['HST', -10],
		['AKST', -9],
		['PST', -8],
		['MST', -7],
		['CST', -6],
		['EST', -5],
		['AST', -4],
		['BRT', -3],
		['MAT', -2],
		['AZOT', -1],
		['UTC', 0],
		['CET', 1],
		['EET', 2],
		['MSK', 3],
		['AST', 4],
		['PKT', 5],
		['IST', 5.5],
		['BST', 6],
		['ICT', 7],
		['CST', 8],
		['JST', 9],
		['AEST', 10],
		['SBT', 11],
		['FJT', 12],
		['TOT', 13],
		['LINT', 14]
	];

	function adjustTz(date: Date, gmt: number) {
		const currentOffset = date.getTimezoneOffset();
		const adjustedOffset = gmt * 60;
		return new Date(date.getTime() + (adjustedOffset + currentOffset) * 60000);
	}

	function day(num: number): string {
		return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][num] || 'Unknown';
	}

	function doy(date: Date) {
		const start = new Date(`${date.getFullYear()}-01-01 0:00:00`);
		return Math.ceil((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	}

	function month(num: number): string {
		return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][num] || 'Unknown';
	}

	function suffix(num: number) {
		if (num % 100 >= 11 && num % 100 <= 13) return `${num}th`;
		switch (num % 10) {
			case 1: return `${num}st`;
			case 2: return `${num}nd`;
			case 3: return `${num}rd`;
			default: return `${num}th`;
		}
	}

	function tzOffset(offset: number) {
		const hours = ~~(offset / 60);
		const minutes = offset % 60;
		return (offset > 0 ? '-' : '') + `${hours}:${minutes.toString().padStart(2, '0')}`;
	}

	if(typeof date == 'number' || typeof date == 'string' || date == null) date = new Date(date);

	// Handle timezones
	let t!: [string, number];
	if(tz == null) tz = -(date.getTimezoneOffset() / 60);
	t = <any>timezones.find(t => isNaN(<any>tz) ? t[0] == tz : t[1] == tz);
	if(!t) throw new Error(`Unknown timezone: ${tz}`);
	date = adjustTz(date, t[1]);

	// Token mapping
	const tokens: Record<string, string> = {
		'YYYY': date.getFullYear().toString(),
		'YY': date.getFullYear().toString().slice(2),
		'MMMM': month(date.getMonth()),
		'MMM': month(date.getMonth()).slice(0, 3),
		'MM': (date.getMonth() + 1).toString().padStart(2, '0'),
		'M': (date.getMonth() + 1).toString(),
		'DDD': doy(date).toString(),
		'DD': date.getDate().toString().padStart(2, '0'),
		'Do': suffix(date.getDate()),
		'D': date.getDate().toString(),
		'dddd': day(date.getDay()),
		'ddd': day(date.getDay()).slice(0, 3),
		'HH': date.getHours().toString().padStart(2, '0'),
		'H': date.getHours().toString(),
		'hh': (date.getHours() % 12 || 12).toString().padStart(2, '0'),
		'h': (date.getHours() % 12 || 12).toString(),
		'mm': date.getMinutes().toString().padStart(2, '0'),
		'm': date.getMinutes().toString(),
		'ss': date.getSeconds().toString().padStart(2, '0'),
		's': date.getSeconds().toString(),
		'SSS': date.getMilliseconds().toString().padStart(3, '0'),
		'A': date.getHours() >= 12 ? 'PM' : 'AM',
		'a': date.getHours() >= 12 ? 'pm' : 'am',
		'ZZ': tzOffset(t[1] * 60).replace(':', ''),
		'Z': tzOffset(t[1] * 60),
		'z': typeof tz == 'string' ? tz : (<any>t)[0]
	};
	return format.replace(/YYYY|YY|MMMM|MMM|MM|M|DDD|DD|Do|D|dddd|ddd|HH|H|hh|h|mm|m|ss|s|SSS|A|a|ZZ|Z|z/g, token => tokens[token]);
}

/**
 * Run a function immediately & repeat every x ms
 *
 * @param {() => any} fn Callback function
 * @param {number} interval Repeat in ms
 * @return {number} Clear Interval ID
 */
export function instantInterval(fn: () => any, interval: number) {
	fn();
	return setInterval(fn, interval);
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
