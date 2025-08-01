import {numSuffix} from './math.ts';

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

export function dayOfWeek(d: number): string {
	return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
}

export function dayOfYear(date: Date): number {
	const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
	return Math.ceil((date.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * Format date
 *
 * @param {string} format How date string will be formatted, default: `YYYY-MM-DD H:mm A`
 * @param {Date | number | string} date Date or timestamp, defaults to now
 * @param tz Set timezone offset
 * @return {string} Formated date
 */
export function formatDate(format: string = 'YYYY-MM-DD H:mm', date: Date | number | string = new Date(), tz: string | number = 'local'): string {
	if (typeof date === 'number' || typeof date === 'string') date = new Date(date);
	if (isNaN(date.getTime())) throw new Error('Invalid date input');
	const numericTz = typeof tz === 'number';
	const localTz = tz === 'local' || (!numericTz && tz.toLowerCase?.() === 'local');
	const tzName = localTz ? Intl.DateTimeFormat().resolvedOptions().timeZone : numericTz ? 'UTC' : tz;

	if (!numericTz && tzName !== 'UTC') {
		try {
			new Intl.DateTimeFormat('en-US', { timeZone: tzName }).format();
		} catch {
			throw new Error(`Invalid timezone: ${tzName}`);
		}
	}

	let zonedDate = new Date(date);
	if (!numericTz && tzName !== 'UTC') {
		const parts = new Intl.DateTimeFormat('en-US', {
			timeZone: tzName,
			year: 'numeric', month: '2-digit', day: '2-digit',
			hour: '2-digit', minute: '2-digit', second: '2-digit',
			hour12: false
		}).formatToParts(date);
		const get = (type: string) => parts.find(p => p.type === type)?.value;
		const build = `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}:${get('second')}Z`;
		zonedDate = new Date(build);
	} else if (numericTz || tzName === 'UTC') {
		const offset = numericTz ? tz as number : 0;
		zonedDate = new Date(date.getTime() + offset * 60 * 60 * 1000);
	}

	const get = (fn: 'FullYear' | 'Month' | 'Date' | 'Day' | 'Hours' | 'Minutes' | 'Seconds' | 'Milliseconds') =>
		(numericTz || tzName === 'UTC') ? zonedDate[`getUTC${fn}`]() : zonedDate[`get${fn}`]();

	function getTZOffset(): string {
		if (numericTz) {
			const total = (tz as number) * 60;
			const hours = Math.floor(Math.abs(total) / 60);
			const mins = Math.abs(total) % 60;
			return `${tz >= 0 ? '+' : '-'}${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
		}
		try {
			const offset = new Intl.DateTimeFormat('en-US', {timeZone: tzName, timeZoneName: 'longOffset', hour: '2-digit', minute: '2-digit',})
				.formatToParts(<Date>date).find(p => p.type === 'timeZoneName')?.value.match(/([+-]\d{2}:\d{2})/)?.[1];
			if (offset) return offset;
		} catch {}
		return '+00:00';
	}

	function getTZAbbr(): string {
		if (numericTz && tz === 0) return 'UTC';
		try {
			return new Intl.DateTimeFormat('en-US', { timeZone: tzName, timeZoneName: 'short' })
				.formatToParts(<Date>date).find(p => p.type === 'timeZoneName')?.value || '';
		} catch {
			return tzName;
		}
	}

	const tokens: Record<string, string> = {
		YYYY: get('FullYear').toString(),
		YY: get('FullYear').toString().slice(2),
		MMMM: month(get('Month')),
		MMM: month(get('Month')).slice(0, 3),
		MM: (get('Month') + 1).toString().padStart(2, '0'),
		M: (get('Month') + 1).toString(),
		DDD: dayOfYear(zonedDate).toString(),
		DD: get('Date').toString().padStart(2, '0'),
		Do: numSuffix(get('Date')),
		D: get('Date').toString(),
		dddd: dayOfWeek(get('Day')),
		ddd: dayOfWeek(get('Day')).slice(0, 3),
		HH: get('Hours').toString().padStart(2, '0'),
		H: get('Hours').toString(),
		hh: (get('Hours') % 12 || 12).toString().padStart(2, '0'),
		h: (get('Hours') % 12 || 12).toString(),
		mm: get('Minutes').toString().padStart(2, '0'),
		m: get('Minutes').toString(),
		ss: get('Seconds').toString().padStart(2, '0'),
		s: get('Seconds').toString(),
		SSS: get('Milliseconds').toString().padStart(3, '0'),
		A: get('Hours') >= 12 ? 'PM' : 'AM',
		a: get('Hours') >= 12 ? 'pm' : 'am',
		ZZ: getTZOffset().replace(':', ''),
		Z: getTZOffset(),
		z: getTZAbbr(),
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

export function month(m: number): string {
	return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][m];
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


/**
 * Convert a timezone string (e.g., "America/Toronto") to its current UTC offset in minutes.
 * @param {string} tz - Timezone string, e.g. "America/Toronto"
 * @param {Date} [date=new Date()] - The date for which you want the offset (default is now)
 * @returns {number} - Offset in minutes (e.g., -240)
 */
export function timezoneOffset(tz: string, date: Date = new Date()): number {
	const dtf = new Intl.DateTimeFormat('en-US', {
		timeZone: tz,
		hour12: false,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: '2-digit',
	});
	const parts = dtf.formatToParts(date);
	const get = (type: string) => Number(parts.find(v => v.type === type)?.value);
	const y = get('year');
	const mo = get('month');
	const d = get('day');
	const h = get('hour');
	const m = get('minute');
	const s = get('second');

	const asUTC = Date.UTC(y, mo - 1, d, h, m, s);
	const asLocal = date.getTime();
	return Math.round((asLocal - asUTC) / 60000);
}
