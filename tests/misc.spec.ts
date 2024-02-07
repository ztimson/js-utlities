import {sleep, urlParser} from '../src';

describe('Miscellanies Utilities', () => {
	describe('sleep', () => {
		test('wait until', async () => {
			const wait = ~~(Math.random() * 500);
			const time = new Date().getTime();
			await sleep(wait);
			expect(new Date().getTime()).toBeGreaterThanOrEqual(time + wait);
		});
	});

	describe('urlParser', () => {
		test('localhost w/ port', () => {
			const parsed = urlParser('http://localhost:4200/some/path?q1=test1&q2=test2#frag');
			expect(parsed.protocol).toStrictEqual('http');
			expect(parsed.host).toStrictEqual('localhost:4200');
			expect(parsed.domain).toStrictEqual('localhost');
			expect(parsed.port).toStrictEqual(4200);
			expect(parsed.path).toStrictEqual('/some/path');
			expect(parsed.query).toStrictEqual({q1: 'test1', q2: 'test2'});
			expect(parsed.fragment).toStrictEqual('frag');
		});

		test('advanced URL', () => {
			const parsed = urlParser('https://sub.domain.example.com/some/path?q1=test1&q2=test2#frag');
			expect(parsed.protocol).toStrictEqual('https');
			expect(parsed.host).toStrictEqual('sub.domain.example.com');
			expect(parsed.domain).toStrictEqual('example.com');
			expect(parsed.subdomain).toStrictEqual('sub.domain');
			expect(parsed.path).toStrictEqual('/some/path');
			expect(parsed.query).toStrictEqual({q1: 'test1', q2: 'test2'});
			expect(parsed.fragment).toStrictEqual('frag');
		});
	});
});
