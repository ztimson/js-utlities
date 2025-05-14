import {addUnique, arrayDiff, caseInsensitiveSort, findByProp, flattenArr, makeArray, makeUnique, sortByProp,} from '../src';

describe('Array Utilities', () => {
	describe('addUnique', () => {
		it('does not add duplicate value', () => {
			const arr = [1, 2, 3];
			addUnique(arr, 2);
			expect(arr).toEqual([1, 2, 3]);
		});
		it('adds unique value', () => {
			const arr = [1, 2];
			addUnique(arr, 3);
			expect(arr).toEqual([1, 2, 3]);
		});
	});

	describe('arrayDiff', () => {
		it('returns unique elements present only in one array', () => {
			expect(arrayDiff([1, 2, 3], [3, 4, 5]).toSorted()).toEqual([1, 2, 4, 5]);
		});
		it('returns empty array if arrays have the same elements', () => {
			expect(arrayDiff([1, 2], [1, 2])).toEqual([]);
		});
	});

	describe('caseInseFsitiveSort', () => {
		it('sorts objects by string property case-insensitively', () => {
			const arr = [{n: 'b'}, {n: 'A'}, {n: 'c'}];
			arr.sort(caseInsensitiveSort('n'));
			expect(arr.map(i => i.n)).toEqual(['A', 'b', 'c']);
		});
	});

	describe('findByProp', () => {
		it('filters objects by property value', () => {
			const arr = [{name: 'foo'}, {name: 'bar'}];
			const found = arr.filter(findByProp('name', 'foo'));
			expect(found).toEqual([{name: 'foo'}]);
		});
	});

	describe('flattenArr', () => {
		it('flattens deeply nested arrays', () => {
			const arr = [1, [2, [3, [4]], 5], 6];
			expect(flattenArr(arr)).toEqual([1, 2, 3, 4, 5, 6]);
		});
		it('flattens flat array as-is', () => {
			expect(flattenArr([1, 2, 3])).toEqual([1, 2, 3]);
		});
	});

	describe('sortByProp', () => {
		it('sorts by numeric property', () => {
			const arr = [{a: 3}, {a: 1}, {a: 2}];
			arr.sort(sortByProp('a'));
			expect(arr.map(i => i.a)).toEqual([1, 2, 3]);
		});
		it('sorts by string property reversed', () => {
			const arr = [{a: 'apple'}, {a: 'banana'}, {a: 'pear'}];
			arr.sort(sortByProp('a', true));
			expect(arr.map(i => i.a)).toEqual(['pear', 'banana', 'apple']);
		});
	});

	describe('makeUnique', () => {
		it('removes duplicate primitives', () => {
			const arr = [1, 2, 2, 3, 1];
			expect(makeUnique(arr)).toEqual([1, 2, 3]);
		});
		it('removes duplicate objects', () => {
			const obj = {a: 1};
			const arr = [obj, obj, {a: 1}];
			expect(makeUnique(arr)).toHaveLength(1);
		});
	});

	describe('makeArray', () => {
		it('wraps non-arrays in array', () => {
			expect(makeArray(1)).toEqual([1]);
		});
		it('returns array as-is', () => {
			expect(makeArray([1, 2])).toEqual([1, 2]);
		});
	});
});
