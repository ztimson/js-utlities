import {logicTest, search} from '../src';

const rows = [
	{id: 1, name: 'Alice', age: 30},
	{id: 2, name: 'Bob', age: 24},
	{id: 3, name: 'Carol', age: 30},
	{id: 4, name: 'David', age: 35},
];

describe('Search Utilities', () => {
	describe('search', () => {
		it('returns empty array for null rows', () => {
			expect(search(null as any, 'test')).toEqual([]);
		});

		it('returns all rows if search is empty', () => {
			expect(search(rows, '')).toEqual(rows);
		});

		it('handles empty array input gracefully', () => {
			expect(search([], 'test')).toEqual([]);
		});

		it('applies transform before filtering', () => {
			const transform = (r: any) => ({...r, name: r.name.toLowerCase()});
			expect(search(rows, 'alice', transform)).toEqual([rows[0]]);
		});

		describe('plain text', () => {
			it('matches case-insensitively when lowercase', () => {
				expect(search(rows, 'alice')).toEqual([rows[0]]);
			});

			it('matches case-sensitively when uppercase present', () => {
				expect(search(rows, 'Alice')).toEqual([rows[0]]);
				expect(search(rows, 'ALICE')).toEqual([]);
			});

			it('performs partial matches', () => {
				expect(search(rows, 'Da')).toEqual([rows[3]]);
			});
		});

		describe('global regex', () => {
			it('matches with valid /pattern/flags syntax', () => {
				expect(search(rows, '/^B/g')).toEqual([rows[1]]);
			});

			it('matches multiple rows', () => {
				expect(search(rows, '/^[AC]/g')).toEqual([rows[0], rows[2]]);
			});

			it('respects flags', () => {
				expect(search(rows, '/alice/i')).toEqual([rows[0]]);
				expect(search(rows, '/alice/g')).toEqual([]);
			});

			it('does not treat /pattern/ without flags as regex', () => {
				expect(search(rows, '/Alice/')).toEqual([]);
			});

			it('does not treat paths as regex', () => {
				const pathRows = [{url: 'users/alice'}];
				expect(search(pathRows, 'users/alice')).toEqual(pathRows);
			});
		});

		describe('property operators', () => {
			it('filters with equality', () => {
				expect(search(rows, 'age == 30')).toEqual([rows[0], rows[2]]);
				expect(search(rows, 'id = 2')).toEqual([rows[1]]);
			});

			it('filters with inequality', () => {
				expect(search(rows, 'name != Alice')).toEqual([rows[1], rows[2], rows[3]]);
			});

			it('filters with contains', () => {
				expect(search(rows, 'name += Al')).toEqual([rows[0]]);
			});

			it('filters with not-contains', () => {
				expect(search(rows, 'name -= Al')).toEqual([rows[1], rows[2], rows[3]]);
			});

			it('filters with numeric comparisons', () => {
				expect(search(rows, 'age < 31')).toEqual([rows[0], rows[1], rows[2]]);
				expect(search(rows, 'age > 30')).toEqual([rows[3]]);
				expect(search(rows, 'age >= 30')).toEqual([rows[0], rows[2], rows[3]]);
			});
		});

		describe('property regex', () => {
			it('matches with ~= shorthand', () => {
				expect(search(rows, 'name ~= ^Al')).toEqual([rows[0]]);
			});

			it('matches with ~= /pattern/flags', () => {
				expect(search(rows, 'name ~= /^al/i')).toEqual([rows[0]]);
			});

			it('excludes with !~', () => {
				expect(search(rows, 'name !~ ^[AB]')).toEqual([rows[2], rows[3]]);
			});
		});

		describe('logical operators', () => {
			it('supports &&', () => {
				expect(search(rows, 'age == 30 && name != Alice')).toEqual([rows[2]]);
			});

			it('supports ||', () => {
				expect(search(rows, 'name = Alice || name = Bob')).toEqual([rows[0], rows[1]]);
			});
		});

		describe('dataset helpers', () => {
			const dupeRows = [
				{id: 1, email: 'a@a.com', type: 'admin'},
				{id: 2, email: 'b@b.com', type: 'user'},
				{id: 3, email: 'a@a.com', type: 'user'},
				{id: 4, email: 'c@c.com', type: 'admin'},
			];

			it('unique() returns rows where field appears once', () => {
				expect(search(dupeRows, 'unique(email)')).toEqual([dupeRows[1], dupeRows[3]]);
			});

			it('duplicate() returns rows where field appears more than once', () => {
				expect(search(dupeRows, 'duplicate(email)')).toEqual([dupeRows[0], dupeRows[2]]);
			});

			it('distinct() returns one row per field value', () => {
				expect(search(dupeRows, 'distinct(type)')).toEqual([dupeRows[0], dupeRows[1]]);
			});

			it('composes helpers with predicates', () => {
				expect(search(dupeRows, 'type = user && duplicate(email)')).toEqual([]);
			});

			it('applies distinct last', () => {
				expect(search(dupeRows, 'duplicate(email) && distinct(type)')).toEqual([dupeRows[0], dupeRows[2]]);
			});
		});
	});

	describe('logicTest', () => {
		const obj = {x: 10, y: 5, name: 'Alpha'};

		it('handles equality and inequality', () => {
			expect(logicTest(obj, 'x == 10')).toBe(true);
			expect(logicTest(obj, 'y != 5')).toBe(false);
		});

		it('handles comparison operators', () => {
			expect(logicTest(obj, 'x > 5')).toBe(true);
			expect(logicTest(obj, 'y <= 10')).toBe(true);
			expect(logicTest(obj, 'x < 5')).toBe(false);
		});

		it('handles contains and not-contains', () => {
			expect(logicTest(obj, 'name += Alpha')).toBe(true);
			expect(logicTest(obj, 'name += Alp')).toBe(true);
			expect(logicTest(obj, 'name += Bet')).toBe(false);
			expect(logicTest(obj, 'name -= Alpha')).toBe(false);
			expect(logicTest(obj, 'name -= Bet')).toBe(true);
			expect(logicTest(obj, 'name += lph')).toBe(true);
			expect(logicTest(obj, 'name -= lph')).toBe(false);
		});

		it('handles property regex ~=', () => {
			expect(logicTest(obj, 'name ~= ^Alp')).toBe(true);
			expect(logicTest(obj, 'name ~= /^alp/i')).toBe(true);
			expect(logicTest(obj, 'name ~= ^Bet')).toBe(false);
		});

		it('handles property regex !~', () => {
			expect(logicTest(obj, 'name !~ ^Bet')).toBe(true);
			expect(logicTest(obj, 'name !~ ^Alp')).toBe(false);
		});

		it('handles invalid regex gracefully', () => {
			expect(logicTest(obj, 'name ~= [invalid')).toBe(false);
		});

		it('supports plain text case-insensitive search', () => {
			expect(logicTest(obj, 'alpha')).toBe(true);
		});

		it('supports plain text case-sensitive search', () => {
			expect(logicTest(obj, 'Alpha')).toBe(true);
			expect(logicTest(obj, 'ALPHA')).toBe(false);
		});

		it('handles logical AND/OR', () => {
			expect(logicTest(obj, 'x == 10 && y == 5')).toBe(true);
			expect(logicTest(obj, 'x == 10 || y == 100')).toBe(true);
			expect(logicTest(obj, 'x == 1 && y == 5')).toBe(false);
		});

		it('handles numeric ranges', () => {
			expect(logicTest(obj, 'x > 5 && x < 15')).toBe(true);
			expect(logicTest(obj, 'x > 15')).toBe(false);
		});

		it('matches keys case-insensitively', () => {
			const mixedCaseObj = {TestKey: 123};
			expect(logicTest(mixedCaseObj, 'TestKey == 123')).toBe(true);
			expect(logicTest(mixedCaseObj, 'testkey == 123')).toBe(true);
		});

		it('returns false for unsupported operators', () => {
			expect(logicTest(obj, 'x === 10')).toBe(false);
		});

		it('returns false for missing operators', () => {
			expect(logicTest(obj, 'x 10')).toBe(false);
		});
	});
});
