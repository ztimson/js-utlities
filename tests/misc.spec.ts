import {fn, gravatar, escapeRegex, md5} from '../src';

describe('Misc Utilities', () => {
	describe('fn', () => {
		it('should execute a stringified function with arguments', () => {
			const result = fn({ x: 2, y: 3 }, 'return x + y;');
			expect(result).toBe(5);
		});

		it('should execute an async function if async=true', async () => {
			const asyncFn = 'return await Promise.resolve(x * y);';
			const result = await fn({ x: 3, y: 4 }, asyncFn, true);
			expect(result).toBe(12);
		});

		it('should work with no arguments', () => {
			const result = fn({}, 'return 42;');
			expect(result).toBe(42);
		});
	});

	describe('gravatar', () => {
		it('should return empty string if email is falsy', () => {
			expect(gravatar('')).toBe('');
		});
		it('should build correct gravatar url', () => {
			const email = 'test@example.com';
			expect(gravatar(email)).toContain(`https://www.gravatar.com/avatar/${md5(email)}`);
		});
	});

	describe('escapeRegex', () => {
		it('should escape all special regex characters', () => {
			const special = '.*+?^${}()|[]\\';
			const escaped = escapeRegex(special);
			expect(escaped).toBe('\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\');
		});
		it('should return original string if nothing to escape', () => {
			const normal = 'abc123';
			const escaped = escapeRegex(normal);
			expect(escaped).toBe('abc123');
		});
	});
});
