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
 * @param {Date | number | string} date Date or timestamp to convert to string
 * @param {string} format How date string will be formatted, default: `YYYY-MM-DD H:mm A`
 * @param tz Override timezone, can be either string or number
 * @return {string} Formated date
 */
export function formatDate(date: Date | number | string, format = 'YYYY-MM-DD H:mm', tz?: string | number): string {
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
		switch(num) {
			case(0): return 'Sunday';
			case(1): return 'Monday';
			case(2): return 'Tuesday';
			case(3): return 'Wednesday';
			case(4): return 'Thursday';
			case(5): return 'Friday';
			case(6): return 'Saturday';
			default: return 'Unknown';
		}
	}

	function doy(date: Date) {
		const start = new Date(`${date.getFullYear()}-01-01 0:00:00`);
		return Math.ceil((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
	}

	function month(num: number): string {
		switch(num) {
			case(0): return 'January';
			case(1): return 'February';
			case(2): return 'March';
			case(3): return 'April';
			case(4): return 'May';
			case(5): return 'June';
			case(6): return 'July';
			case(7): return 'August';
			case(8): return 'September';
			case(9): return 'October';
			case(10): return 'November';
			case(11): return 'December';
			default: return 'Unknown';
		}
	}

	function suffix(num: number) {
		let n = num.toString();
		switch(n.at(-1)) {
			case('1'): return num + 'st';
			case('2'): return num + 'nd';
			case('3'): return num + 'rd';
			default: return num + 'th';
		}
	}

	function tzOffset(offset: number) {
		const hours = ~~(offset / 60);
		const minutes = offset % 60;
		return (offset > 0 ? '-' : '') + `${hours}:${minutes.toString().padStart(2, '0')}`;
	}

	if(typeof date == 'number' || typeof date == 'string') date = new Date(date);

	// Handle timezones
	let t!: [string, number];
	if(tz == null) tz = -(date.getTimezoneOffset() / 60);
	t = <any>timezones.find(t => isNaN(<any>tz) ? t[0] == tz : t[1] == tz);
	if(!t) throw new Error(`Unknown timezone: ${tz}`);
	date = adjustTz(date, t[1]);

	return format
		// Year
		.replaceAll('YYYY', date.getFullYear().toString())
		.replaceAll('YY', date.getFullYear().toString().slice(2))
		// Month
		.replaceAll('MMMM', month(date.getMonth()))
		.replaceAll('MMM', month(date.getMonth()).slice(0, 3))
		.replaceAll('MM', (date.getMonth() + 1).toString().padStart(2, '0'))
		.replaceAll('M', (date.getMonth() + 1).toString())
		// Day
		.replaceAll('DDD', doy(date).toString())
		.replaceAll('DD', date.getDate().toString().padStart(2, '0'))
		.replaceAll('Do', suffix(date.getDate()))
		.replaceAll('D', date.getDate().toString())
		.replaceAll('dddd', day(date.getDay()))
		.replaceAll('ddd', day(date.getDay()).slice(0, 2))
		.replaceAll('dd', date.getDate().toString().padStart(2, '0'))
		.replaceAll('d', date.getDay().toString())
		// Hour
		.replaceAll('HH', date.getHours().toString().padStart(2, '0'))
		.replaceAll('H', date.getHours().toString())
		.replaceAll('hh', (date.getHours() > 12 ? date.getHours() - 12 : date.getHours()).toString().padStart(2, '0'))
		.replaceAll('h', (date.getHours() > 12 ? date.getHours() - 12 : date.getHours()).toString())
		// Minute
		.replaceAll('mm', date.getMinutes().toString().padStart(2, '0'))
		.replaceAll('m', date.getMinutes().toString())
		// Second
		.replaceAll('ss', date.getSeconds().toString().padStart(2, '0'))
		.replaceAll('s', date.getSeconds().toString())
		// Millisecond
		.replaceAll('SSS', date.getMilliseconds().toString().padEnd(3, '0'))
		.replaceAll('SS', date.getMilliseconds().toString().slice(0, 1).padEnd(2, '0'))
		.replaceAll('S', date.getMilliseconds().toString()[0])
		// Period/Meridian (AM/PM)
		.replaceAll('A', date.getHours() >= 12 ? 'PM' : 'AM')
		.replaceAll('a', date.getHours() >= 12 ? 'pm' : 'am')
		// Timezone
		.replaceAll('ZZ', tzOffset(t[1] * 60).replace(':', ''))
		.replaceAll('Z', tzOffset(t[1] * 60))
		.replaceAll('z', typeof tz == 'string' ? tz : (<any>t)[0]);
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
