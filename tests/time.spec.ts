import {adjustedInterval, formatDate, instantInterval, sleep, sleepWhile, timeUntil} from '../src';

jest.useFakeTimers();

describe('Time Utilities', () => {
	describe('adjustedInterval', () => {
		it('calls callback at roughly correct intervals, considering execution time', async () => {
			const cb = jest.fn(() => new Promise(res => setTimeout(res, 5)));
			const stop = adjustedInterval(cb, 50);

			expect(cb).toHaveBeenCalledTimes(1);

			await jest.advanceTimersByTimeAsync(50);
			expect(cb).toHaveBeenCalledTimes(2);

			await jest.advanceTimersByTimeAsync(100);
			expect(cb).toHaveBeenCalledTimes(4);

			stop();
			await jest.advanceTimersByTimeAsync(100);
			expect(cb).toHaveBeenCalledTimes(4);
		});
	});

	describe('formatDate', () => {
		it('formats current date correctly with default format', () => {
			const result = formatDate('YYYY-MM-DD', new Date('2023-01-15T10:30:30.000Z'), 0);
			expect(result).toBe('2023-01-15');
		});

		it('handles formatting for given timestamp', () => {
			const timestamp = Date.UTC(2023, 1, 1, 18, 5, 5, 123); // Feb 1, 2023 18:05:05.123 UTC
			const formatted = formatDate('YYYY MM DD HH mm ss SSS A Z', timestamp, 'UTC');
			expect(formatted).toMatch(/^2023 02 01 18 05 05 123 PM \+00:00/i);
		});

		it('throws for unknown timezone', () => {
			expect(() => formatDate('YYYY', new Date(), '???')).toThrow(/Invalid timezone/);
		});

		it('handles timezone by offset number', () => {
			const dt = new Date('2020-01-01T00:00:00.000Z');
			const str = formatDate('HH:mm z', dt, 1);
			expect(str).toMatch(/01:00/);
		});

		it('handles Do, MMMM, dddd tokens', () => {
			const dt = new Date('2021-03-03T09:00:00Z');
			const result = formatDate('Do MMMM dddd', dt, 0);
			expect(result).toMatch(/^3rd March Wednesday$/);
		});
	});

	describe('instantInterval', () => {
		it('calls function immediately then at intervals', () => {
			const cb = jest.fn();
			const id = instantInterval(cb, 1000);
			expect(cb).toHaveBeenCalledTimes(1);

			jest.advanceTimersByTime(1000);
			expect(cb).toHaveBeenCalledTimes(2);

			clearInterval(id);
		});
	});

	describe('sleep', () => {
		it('waits the given ms', async () => {
			const time = Date.now(), wait = 100;
			const promise = sleep(wait);
			jest.advanceTimersByTime(wait);
			await promise;
			expect(Date.now()).toBeGreaterThanOrEqual(time + wait);
		});
	});

	describe('sleepWhile', () => {
		it('resolves once condition is false', async () => {
			const time = Date.now(), wait = 300;
			let flag = true;
			const promise = sleepWhile(() => flag, 100);
			setTimeout(() => { flag = false; }, wait);
			await jest.advanceTimersByTimeAsync(wait);
			await promise;
			expect(Date.now()).toBeGreaterThanOrEqual(time + wait);
		});
	});

	describe('timeUntil', () => {
		it('returns milliseconds until given date', () => {
			const now = Date.now();
			const future = now + 1000;
			jest.spyOn(Date, 'now').mockReturnValue(now);

			const result = timeUntil(future);
			expect(result).toBe(1000);
		});

		it('accepts Date object', () => {
			const now = new Date();
			const t = new Date(now.getTime() + 450);
			jest.spyOn(global, 'Date').mockImplementation(() => now as any);

			const result = timeUntil(t);
			expect(result).toBe(450);
		});
	});
});
