import {sleep} from '../src';

describe('Time Utilities', () => {
	describe('sleep', () => {
		test('wait until', async () => {
			const wait = ~~(Math.random() * 500);
			const time = new Date().getTime();
			await sleep(wait);
			expect(new Date().getTime()).toBeGreaterThanOrEqual(time + wait);
		});
	});
});
