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

		it('filters based on a simple property string', () => {
			expect(search(rows, 'Alice')).toEqual([rows[0]]);
		});

		it('filters using regex when regex=true', () => {
			expect(search(rows, '^B', true)).toEqual([rows[1]]);
		});

		it('applies the transform function before filtering', () => {
			const transform = (r: any) => ({...r, name: r.name.toLowerCase()});
			expect(search(rows, 'alice', false, transform)).toEqual([rows[0]]);
		});

		it('uses logicTest for non-regex search', () => {
			expect(search(rows, 'age == 30')).toEqual([rows[0], rows[2]]);
			expect(search(rows, 'id = 2')).toEqual([rows[1]]);
		});

		it('returns all if search is falsy and regex enabled', () => {
			expect(search(rows, '', true)).toEqual(rows);
		});

		it('handles regex search with special characters', () => {
			expect(search(rows, '^[AC]', true)).toEqual([rows[0], rows[2]]);
		});

		it('ignores case when regex is applied', () => {
			expect(search(rows, 'ALICE', true)).toEqual([]);
		});

		it('performs partial matches for properties when regex=false', () => {
			expect(search(rows, 'Da')).toEqual([rows[3]]);
		});

		it('handles empty array input gracefully', () => {
			expect(search([], 'test')).toEqual([]);
		});

		it('handles numeric values with comparison logic in strings', () => {
			expect(search(rows, 'age < 31')).toEqual([rows[0], rows[1], rows[2]]);
		});

		// New test cases for `+` and `-` operators
		it('filters rows using the + operator', () => {
			expect(search(rows, 'name += Al')).toEqual([rows[0]]);
		});

		it('filters rows using the - operator', () => {
			expect(search(rows, 'name -= Al')).toEqual([rows[1], rows[2], rows[3]]);
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

		it('supports case insensitive property search', () => {
			expect(logicTest(obj, 'alpha')).toBeTruthy();
			expect(logicTest(obj, 'ALPHA')).toBeFalsy();
		});

		it('handles logical AND/OR expressions', () => {
			expect(logicTest(obj, 'x == 10 && y == 5')).toBe(true);
			expect(logicTest(obj, 'x == 10 || y == 100')).toBe(true);
			expect(logicTest(obj, 'x == 1 && y == 5')).toBe(false);
		});

		it('returns false for unsupported operators', () => {
			expect(logicTest(obj, 'x === 10')).toBe(false);
		});

		it('handles invalid condition strings gracefully', () => {
			expect(logicTest(obj, 'invalid condition')).toBe(false);
		});

		it('supports numeric operations with ranges', () => {
			expect(logicTest(obj, 'x > 5 && x < 15')).toBe(true);
			expect(logicTest(obj, 'x > 15')).toBe(false);
		});

		it('handles mixed case keys gracefully', () => {
			const mixedCaseObj = {TestKey: 123};
			expect(logicTest(mixedCaseObj, 'TestKey == 123')).toBe(true);
			expect(logicTest(mixedCaseObj, 'testkey == 123')).toBe(true);
		});

		it('returns false if condition operators are missing', () => {
			expect(logicTest(obj, 'x 10')).toBe(false);
		});

		// New test cases for `+` and `-` operators
		it('handles the + operator for inclusion', () => {
			expect(logicTest(obj, 'name += Alpha')).toBe(true);
			expect(logicTest(obj, 'name += Alp')).toBe(true);
			expect(logicTest(obj, 'name += Bet')).toBe(false);
		});

		it('handles the - operator for exclusion', () => {
			expect(logicTest(obj, 'name -= Alpha')).toBe(false);
			expect(logicTest(obj, 'name -= Alp')).toBe(false);
			expect(logicTest(obj, 'name -= Bet')).toBe(true);
		});

		it('includes partial matches correctly with +', () => {
			expect(logicTest(obj, 'name += lph')).toBe(true);
		});

		it('excludes partial matches correctly with -', () => {
			expect(logicTest(obj, 'name -= lph')).toBe(false);
			expect(logicTest(obj, 'name -= xyz')).toBe(true);
		});
	});
});
