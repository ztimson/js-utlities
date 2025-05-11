import {matchAll, parseUrl, randomString, randomStringBuilder} from "../src";


describe('String Utilities', () => {
	describe('randomString', () => {
		test('length', () => expect(randomString(32).length).toStrictEqual(32));
		test('distribution', () => {
			const charList = '123';
			const random = randomString(32, charList);
			expect(random.split('').filter(c => c == '1').length).toBeGreaterThan(0);
			expect(random.split('').filter(c => c == '2').length).toBeGreaterThan(0);
			expect(random.split('').filter(c => c == '3').length).toBeGreaterThan(0);
		});
		test('binary', () => {
			const randomByte = randomString(8, '01');
			expect(randomByte.split('').filter(c => c == '0').length).toBeGreaterThan(0);
			expect(randomByte.split('').filter(c => c == '1').length).toBeGreaterThan(0);
			expect(randomByte.length).toStrictEqual(8);
		});
	});

	describe('randomStringBuilder', () => {
		test('length', () => {
			const len = ~~(Math.random() * 32);
			expect(randomStringBuilder(len, true).length).toStrictEqual(len);
		});
		test('no length', () => {
			expect(randomStringBuilder(0, true)).toStrictEqual('');
		});
		test('letters only', () =>
			expect(/^[a-zA-Z]{10}$/g.test(randomStringBuilder(10, true))).toBeTruthy());
		test('numbers only', () =>
			expect(/^[0-9]{10}$/g.test(<any>randomStringBuilder(10, false, true))).toBeTruthy());
		test('symbols only', () =>
			expect(/^[^a-zA-Z0-9]{10}$/g.test(randomStringBuilder(10, false, false, true))).toBeTruthy());
		test('everything', () => {
			const randomString = randomStringBuilder(30, true, true, true);
			expect(/[a-zA-Z]/g.test(randomString)).toBeTruthy();
			expect(/[0-9]/g.test(randomString)).toBeTruthy();
			expect(/[^a-zA-Z0-9]/g.test(randomString)).toBeTruthy();
		});
		test('no pool', () =>
			expect(() => randomStringBuilder(10, false, false, false)).toThrow());
	});

	describe('matchAll', () => {
		test('using string', () => expect(matchAll('fooBar fooBar FooBar', 'fooBar').length).toBe(2));
		test('using regex', () => expect(matchAll('fooBar fooBar FooBar', /fooBar/g).length).toBe(2));
		test('using malformed regex', () => expect(() => matchAll('fooBar fooBar FooBar', /fooBar/)).toThrow());
	});

	describe('urlParser', () => {
		test('localhost', () => {
			const parsed = parseUrl('http://localhost:4200/some/path?q1=test1&q2=test2#frag');
			expect(parsed.protocol).toStrictEqual('http');
			expect(parsed.host).toStrictEqual('localhost:4200');
			expect(parsed.domain).toStrictEqual('localhost');
			expect(parsed.port).toStrictEqual(4200);
			expect(parsed.path).toStrictEqual('/some/path');
			expect(parsed.query).toStrictEqual({q1: 'test1', q2: 'test2'});
			expect(parsed.fragment).toStrictEqual('frag');
		});

		test('subdomains', () => {
			const parsed = parseUrl('https://sub.domain.example.com/some/path?q1=test1&q2=test2#frag');
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
