import {fn} from '../src';

describe('Miscellanies Utilities', () => {
	describe('fn', () => {
		test('async', async () => {
			const test = {a: Math.random()};
			const resp = fn(test, 'return a;', true);
			expect(resp instanceof Promise).toBeTruthy();
			expect(await resp).toEqual(test['a']);
		});

		test('sync', async () => {
			const test = {a: Math.random()};
			const resp = fn(test, 'return a;3');
			expect(resp).toEqual(test['a']);
		});
	});
});
