import {addUnique, caseInsensitiveSort, flattenArr, sortByProp} from '../src';

describe('Array Utilities', () => {
	describe('addUnique', () => {
		const arr = [1, 2];

		test('non-unique', () => {
			addUnique(arr, 1);
			expect(arr).toStrictEqual([1, 2]);
		});
		test('unique', () => {
			addUnique(arr, 3);
			expect(arr).toStrictEqual([1, 2, 3]);
		});
	});

	describe('flattenArr', () => {
		test('flat array', () => expect(flattenArr([1, 2])).toStrictEqual([1, 2]));
		test('2D array', () => expect(flattenArr([[1, 2], [3, 4]])).toStrictEqual([1, 2, 3, 4]));
		test('3D array', () => expect(flattenArr([[[1, 2], [3, 4]], [[5, 6], [7, 8]]])).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8]));
		test('mixed array', () => expect(flattenArr([1, 2, [3, 4], [[5, 6], [7, 8]]])).toStrictEqual([1, 2, 3, 4, 5, 6, 7, 8]));
	});

	describe('sortByProp', () => {
		test('random letters', () => {
			let unsorted: any = Array(100).fill(null)
				.map(() => String.fromCharCode(Math.round(Math.random() * 25) + 97));
			const sorted = unsorted.sort((a: any, b: any) => {
				if(a > b) return 1;
				if(a < b) return -1;
				return 0;
			}).map((l: any) => ({a: l}));
			unsorted = unsorted.map((l: any) => ({a: l}));
			expect(unsorted.sort(sortByProp('a'))).toStrictEqual(sorted);
		});
		test('random letters reversed', () => {
			let unsorted: any = Array(100).fill(null)
				.map(() => String.fromCharCode(Math.round(Math.random() * 25) + 97));
			const sorted = unsorted.sort((a: any, b: any) => {
				if(a > b) return -1;
				if(a < b) return 1;
				return 0;
			}).map((n: any) => ({a: n}));
			unsorted = unsorted.map((n: any) => ({a: n}));
			expect(unsorted.sort(sortByProp('a', true))).toStrictEqual(sorted);
		});
		test('random numbers', () => {
			let unsorted: any = Array(100).fill(null).map(() => Math.round(Math.random() * 100));
			const sorted = unsorted.sort((a: any, b: any) => a - b).map((n: any) => ({a: n}));
			unsorted = unsorted.map((n: any) => ({a: n}));
			expect(unsorted.sort(sortByProp('a'))).toStrictEqual(sorted);
		});
		test('random numbers reversed', () => {
			let unsorted: any = Array(100).fill(null).map(() => Math.round(Math.random() * 100));
			const sorted = unsorted.sort((a: any, b: any) => b - a).map((n: any) => ({a: n}));
			unsorted = unsorted.map((n: any) => ({a: n}));
			expect(unsorted.sort(sortByProp('a', true))).toStrictEqual(sorted);
		});
	});

	describe('caseInsensitiveSort', () => {
		test('non-string property', () => {
			const unsorted: any = [{a: 'Apple', b: 123}, {a: 'Carrot', b: 789}, {a: 'banana', b: 456}];
			const sorted: any = unsorted.map((u: any) => ({...u}));
			expect(unsorted.sort(caseInsensitiveSort('b'))).toStrictEqual(sorted);
		});
		test('simple strings', () => {
			const unsorted: any = [{a: 'Apple'}, {a: 'Carrot'}, {a: 'banana'}];
			const sorted: any = unsorted.sort((first: any, second: any) => {
				return first.a.toLowerCase().localeCompare(second.a.toLowerCase());
			}).map((u: any) => ({...u}));
			expect(unsorted.sort(caseInsensitiveSort('a'))).toStrictEqual(sorted);
		});
		test('alphanumeric strings', () => {
			const unsorted: any = [{a: '4pple'}, {a: 'Carrot'}, {a: 'b4n4n4'}];
			const sorted: any = unsorted.sort((first: any, second: any) => {
				return first.a.toLowerCase().localeCompare(second.a.toLowerCase());
			}).map((u: any) => ({...u}));
			expect(unsorted.sort(caseInsensitiveSort('a'))).toStrictEqual(sorted);
		});
	});
});
