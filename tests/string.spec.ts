import {
	camelCase,
	CHAR_LIST,
	formatBytes,
	formatPhoneNumber,
	insertAt, kebabCase,
	LETTER_LIST, matchAll, md5,
	NUMBER_LIST, pad, parseUrl, pascalCase, randomHex, randomString, randomStringBuilder, snakeCase, strSplice,
	SYMBOL_LIST
} from '../src';

describe('String Utilities', () => {
	test('LETTER_LIST, NUMBER_LIST, SYMBOL_LIST, CHAR_LIST', () => {
		expect(LETTER_LIST).toBe('ABCDEFGHIJKLMNOPQRSTUVWXYZ');
		expect(NUMBER_LIST).toBe('0123456789');
		expect(SYMBOL_LIST).toContain('@');
		expect(CHAR_LIST).toContain('A');
		expect(CHAR_LIST).toContain('a');
		expect(CHAR_LIST).toContain('5');
		expect(CHAR_LIST).toContain('!');
	});

	describe('camelCase', () => {
		it('converts to camelCase', () => {
			expect(camelCase('hello_world')).toBe('helloWorld');
			expect(camelCase('Hello world test')).toBe('helloWorldTest');
		});
		it('returns empty string if value is falsy', () => {
			expect(camelCase()).toBe('');
			expect(camelCase('')).toBe('');
		});
	});

	describe('formatBytes', () => {
		it('correctly formats bytes', () => {
			expect(formatBytes(0)).toBe('0 Bytes');
			expect(formatBytes(1024)).toBe('1 KB');
			expect(formatBytes(1024 * 1024)).toBe('1 MB');
			expect(formatBytes(1234, 1)).toBe('1.2 KB');
		});
	});

	describe('formatPhoneNumber', () => {
		it('formats plain phone numbers', () => {
			expect(formatPhoneNumber('1234567890')).toBe('(123) 456-7890');
			expect(formatPhoneNumber('+11234567890')).toBe('+1 (123) 456-7890');
			expect(formatPhoneNumber('1 123 456 7890')).toBe('+1 (123) 456-7890');
		});
		it('throws for invalid phone strings', () => {
			expect(() => formatPhoneNumber('abc')).toThrow();
		});
	});

	describe('insertAt', () => {
		it('inserts a string at a given index', () => {
			expect(insertAt('Hello!', 'X', 5)).toBe('HelloX');
		});
	});

	describe('kebabCase', () => {
		it('converts to kebab-case', () => {
			expect(kebabCase('HelloWorldTest')).toContain('-hello');
			expect(kebabCase('')).toBe('');
		});
	});

	describe('pad', () => {
		it('pads start by default', () => {
			expect(pad('1', 2, '0')).toBe('01');
		});
		it('pads end if start is false', () => {
			expect(pad('1', 3, '0', false)).toBe('100');
		});
	});

	describe('pascalCase', () => {
		it('converts to PascalCase', () => {
			expect(pascalCase('hello_world')).toBe('HelloWorld');
			expect(pascalCase('')).toBe('');
		});
	});

	describe('randomHex', () => {
		it('creates a random hex string of correct length', () => {
			expect(randomHex(8)).toHaveLength(8);
			expect(/^[a-f0-9]{8}$/i.test(randomHex(8))).toBe(true);
		});
	});

	describe('randomString', () => {
		it('creates a random string from CHAR_LIST of correct length', () => {
			const s = randomString(10);
			expect(s).toHaveLength(10);
			// letters, numbers, symbols all included in CHAR_LIST
		});
		it('uses provided pool', () => {
			expect(['0','1']).toContain(randomString(1, '01'));
		});
	});

	describe('randomStringBuilder', () => {
		it('creates with just letters', () => {
			expect(/^[A-Z]+$/.test(randomStringBuilder(5, true, false, false))).toBe(true);
		});
		it('creates with just numbers', () => {
			expect(/^[0-9]+$/.test(randomStringBuilder(5, false, true, false))).toBe(true);
		});
		it('creates with just symbols', () => {
			expect(SYMBOL_LIST).toContain(randomStringBuilder(1, false, false, true));
		});
		it('throws if all false', () => {
			expect(() => randomStringBuilder(5, false, false, false)).toThrow();
		});
	});

	describe('snakeCase', () => {
		it('converts to snake_case', () => {
			expect(snakeCase('helloWorld')).toContain('hello_world');
			expect(snakeCase('')).toBe('');
		});
	});

	describe('strSplice', () => {
		it('splices string as expected', () => {
			expect(strSplice('abcdef', 2, 2, 'ZZ')).toBe('abZZef');
			expect(strSplice('abcdef', 1, 0, 'Z')).toBe('aZbcdef');
		});
	});

	describe('matchAll', () => {
		it('returns expected matches', () => {
			const matches = matchAll('a1 b2 c3', /\d/g);
			expect(matches.length).toBe(3);
			expect(matches[0][0]).toBe('1');
		});
		it('throws for non-global regex', () => {
			expect(() => matchAll('abc', /a/)).toThrow();
		});
		it('accepts regex string', () => {
			const matches = matchAll('a1a2', '\\d');
			expect(matches.length).toBe(2);
		});
	});

	describe('parseUrl', () => {
		it('parses a full url', () => {
			const url = parseUrl('https://sub.example.com:8000/path?a=1&b=2#frag');
			expect(url.protocol).toBe('https');
			expect(url.subdomain).toBe('sub');
			expect(url.domain).toBe('example.com');
			expect(url.port).toBe(8000);
			expect(url.path).toBe('/path');
			expect(url.query).toEqual({ a: '1', b: '2' });
			expect(url.fragment).toBe('frag');
		});
		it('parses domain without subdomain', () => {
			const url = parseUrl('https://example.com');
			expect(url.domain).toBe('example.com');
		});
	});

	describe('md5', () => {
		it('hashes string to hex', () => {
			expect(md5('test')).toMatch(/^[a-f0-9]+$/i);
		});
	});
});
