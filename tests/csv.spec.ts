import {fromCsv, toCsv} from '../src';

describe('CSV Utilities', () => {
	describe('fromCsv', () => {
		it('parses CSV with headers', () => {
			const input = `name,age,city
John,30,New York
Jane,25,Los Angeles`;
			const expected = [
				{name: 'John', age: '30', city: 'New York'},
				{name: 'Jane', age: '25', city: 'Los Angeles'},
			];
			expect(fromCsv(input)).toEqual(expected);
		});

		it('parses CSV without headers', () => {
			const input = `apple,red,1
banana,yellow,2`;
			const expected = [
				{A: 'apple', B: 'red', C: '1'},
				{A: 'banana', B: 'yellow', C: '2'},
			];
			expect(fromCsv(input, false)).toEqual(expected);
		});

		it('handles quoted fields and commas', () => {
			const input = `name,description
"Widget, Large","A large, useful widget"
Gadget,"A ""versatile"" gadget"`;
			const expected = [
				{name: 'Widget, Large', description: 'A large, useful widget'},
				{name: 'Gadget', description: 'A "versatile" gadget'},
			];
			expect(fromCsv(input)).toEqual(expected);
		});

		it('handles empty fields', () => {
			const input = `id,name,score
1,Tom,97
2,,89
3,Alice,`;
			const expected = [
				{id: '1', name: 'Tom', score: '97'},
				{id: '2', name: '', score: '89'},
				{id: '3', name: 'Alice', score: ''},
			];
			expect(fromCsv(input)).toEqual(expected);
		});
	});

	describe('toCsv', () => {
		it('converts array of objects to CSV', () => {
			const arr = [
				{name: 'John', age: 30, city: 'New York'},
				{name: 'Jane', age: 25, city: 'Los Angeles'},
			];
			const csv = toCsv(arr);
			expect(csv).toContain('name,age,city');
			expect(csv).toContain('John,30,New York');
			expect(csv).toContain('Jane,25,Los Angeles');
		});

		it('quotes fields with commas and quotes', () => {
			const arr = [
				{val: 'Comma, included', remark: 'needs, quotes'},
				{val: 'Quote "double"', remark: 'embedded "quotes"'},
			];
			const csv = toCsv(arr);
			expect(csv).toContain('"Comma, included","needs, quotes"');
			expect(csv).toContain('"Quote ""double""","embedded ""quotes"""');
		});

		it('handles nested objects when flatten = true', () => {
			const arr = [
				{id: 1, info: {name: 'Alice', age: 20}},
				{id: 2, info: {name: 'Bob', age: 22}}
			];
			const csv = toCsv(arr, true);
			expect(csv).toMatch(/id,info\.name,info\.age/);
			expect(csv).toMatch(/1,Alice,20/);
			expect(csv).toMatch(/2,Bob,22/);
		});

		it('handles objects with array fields', () => {
			const arr = [{name: 'Joe', tags: ['a', 'b']}];
			const csv = toCsv(arr);
			expect(csv).toContain('Joe,"[""a"",""b""]"');
		});
	});
});
