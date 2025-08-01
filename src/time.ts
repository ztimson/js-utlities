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


export function dayOfWeek(num: number): string {
	return ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][num] || 'Unknown';
}

export function dayOfYear(date: Date): number {
	const start = new Date(`${date.getFullYear()}-01-01T00:00:00Z`);
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
	const offsetMinutes = numericTz ? tz * 60 : 0;
	const adjustedDate = date;
	const tzName = localTz ? Intl.DateTimeFormat().resolvedOptions().timeZone : numericTz ? `UTC${tz >= 0 ? '+' : ''}${tz}` : tz;

	function getTZOffset(): string {
		if (numericTz) {
			const hours = Math.floor(Math.abs(offsetMinutes) / 60);
			const minutes = Math.abs(offsetMinutes) % 60;
			return `${offsetMinutes >= 0 ? '+' : '-'}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
		}
		if (tzName === 'UTC') return '+00:00';

		try {
			const parts = new Intl.DateTimeFormat('en-US', {timeZone: tzName, timeZoneName: 'longOffset', hour: '2-digit', minute: '2-digit',}).formatToParts(adjustedDate);
			const tzPart = parts.find(p => p.type === 'timeZoneName')?.value || '';
			const match = tzPart.match(/([+-]\d{2}:\d{2})/);
			if (match) return match[1];
		} catch {}

		const dtf = new Intl.DateTimeFormat('en-US', {timeZone: tzName, hour12: false, hour: '2-digit', minute: '2-digit'});
		const parts = dtf.formatToParts(adjustedDate);
		const targetHour = Number(parts.find(p => p.type === 'hour')?.value);
		const targetMinute = Number(parts.find(p => p.type === 'minute')?.value);
		const utcHour = adjustedDate.getUTCHours();
		const utcMinute = adjustedDate.getUTCMinutes();

		let offset = (targetHour - utcHour) * 60 + (targetMinute - utcMinute);
		if (offset > 720) offset -= 1440;
		if (offset < -720) offset += 1440;

		const sign = offset >= 0 ? '+' : '-';
		const absOffset = Math.abs(offset);
		const hours = Math.floor(absOffset / 60);
		const minutes = absOffset % 60;
		return `${sign}${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
	}

	function getTZAbbr(): string {
		if(numericTz && tz == 0) return 'UTC';
		try {
			return new Intl.DateTimeFormat('en-US', {timeZone: tzName, timeZoneName: 'short'})
				.formatToParts(adjustedDate).find(p => p.type === 'timeZoneName')?.value || '';
		} catch {
			return tzName;
		}
	}

	const formatter = new Intl.DateTimeFormat('en-us', {
		timeZone: numericTz ? 'UTC' : tzName,
		year: format.includes('YY') ? 'numeric' : undefined,
		month: format.includes('MM') || format.includes('M') ? '2-digit' : undefined,
		day: format.includes('DD') || format.includes('Do') || format.includes('D') ? '2-digit' : undefined,
		hour: format.includes('HH') || format.includes('hh') || format.includes('H') || format.includes('h') ? '2-digit' : undefined,
		minute: format.includes('mm') || format.includes('m') ? '2-digit' : undefined,
		second: format.includes('ss') || format.includes('s') ? '2-digit' : undefined,
		hourCycle: format.includes('A') || format.includes('a') ? 'h12' : 'h23',
	});

	const parts = formatter.formatToParts(adjustedDate);
	const tokens: Record<string, string> = {
		YYYY: adjustedDate.getFullYear().toString(),
		YY: adjustedDate.getFullYear().toString().slice(2),
		MM: parts.find(part => part.type === 'month')?.value || '',
		M: (parseInt(parts.find(part => part.type === 'month')?.value || '0', 10)).toString(),
		DD: parts.find(part => part.type === 'day')?.value || '',
		D: parseInt(parts.find(part => part.type === 'day')?.value || '0', 10).toString(),
		HH: parts.find(part => part.type === 'hour')?.value.padStart(2, '0') || '',
		H: parseInt(parts.find(part => part.type === 'hour')?.value || '0', 10).toString(),
		hh: (parseInt(parts.find(part => part.type === 'hour')?.value || '0', 10) % 12 || 12).toString().padStart(2, '0'),
		h: (parseInt(parts.find(part => part.type === 'hour')?.value || '0', 10) % 12 || 12).toString(),
		mm: parts.find(part => part.type === 'minute')?.value || '',
		m: parseInt(parts.find(part => part.type === 'minute')?.value || '0', 10).toString(),
		ss: parts.find(part => part.type === 'second')?.value || '',
		s: parseInt(parts.find(part => part.type === 'second')?.value || '0', 10).toString(),
		A: parseInt(parts.find(part => part.type === 'hour')?.value || '0', 10) >= 12 ? 'PM' : 'AM',
		a: parseInt(parts.find(part => part.type === 'hour')?.value || '0', 10) >= 12 ? 'pm' : 'am',
		Z: getTZOffset(),
		z: getTZAbbr(),
	};
	return format.replace(/YYYY|YY|MM|M|DD|D|HH|H|hh|h|mm|m|ss|s|A|a|Z|z/g, token => tokens[token]);
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

export function monthString(num: number): string {
	return ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][num] || 'Unknown';
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
