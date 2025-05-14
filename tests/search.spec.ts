import {logicTest, search} from '../src';

const rows = [
	{id: 1, name: 'Alice', age: 30},
	{id: 2, name: 'Bob', age: 24},
	{id: 3, name: 'Carol', age: 30},
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
	});
});
