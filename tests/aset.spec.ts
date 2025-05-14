import {ASet} from '../src';

describe('ASet', () => {
	describe('constructor', () => {
		it('should create a set with unique elements', () => {
			const set = new ASet([1, 2, 2, 3]);
			expect(set.size).toBe(3);
			expect(set.sort()).toEqual([1, 2, 3]);
		});

		it('should create an empty set by default', () => {
			const set = new ASet();
			expect(set.size).toBe(0);
		});
	});

	describe('add', () => {
		it('should add unique elements', () => {
			const set = new ASet([1]);
			set.add(2, 3, 1);
			expect(set.sort()).toEqual([1, 2, 3]);
		});

		it('should return this', () => {
			const set = new ASet();
			expect(set.add(1)).toBe(set);
		});
	});

	describe('clear', () => {
		it('should remove all elements', () => {
			const set = new ASet([1, 2]);
			set.clear();
			expect(set.size).toBe(0);
		});

		it('should return this', () => {
			const set = new ASet([1]);
			expect(set.clear()).toBe(set);
		});
	});

	describe('delete', () => {
		it('should remove specified elements', () => {
			const set = new ASet([1, 2, 3]);
			set.delete(2, 4);
			expect(set.sort()).toEqual([1, 3]);
		});

		it('should return this', () => {
			const set = new ASet([1]);
			expect(set.delete(1)).toBe(set);
		});
	});

	describe('difference', () => {
		it('should return elements unique to this set', () => {
			const setA = new ASet([1, 2, 3]);
			const setB = new ASet([2, 4]);
			expect(setA.difference(setB).sort()).toEqual([1, 3]);
			expect(setB.difference(setA).sort()).toEqual([4]);
		});
	});

	describe('has', () => {
		it('should check if element exists in set', () => {
			const set = new ASet([1, 2]);
			expect(set.has(1)).toBe(true);
			expect(set.has(99)).toBe(false);
		});
	});

	describe('indexOf', () => {
		it('should return correct index for primitive and object', () => {
			const set = new ASet([{a: 1}, {b: 2}]);
			expect(set.indexOf({a: 1})).toBe(0);
			expect(set.indexOf(<any>{missing: 1})).toBe(-1);

			const numbers = new ASet([1, 2, 3]);
			expect(numbers.indexOf(2)).toBe(1);
			expect(numbers.indexOf(10)).toBe(-1);
		});
	});

	describe('intersection', () => {
		it('should return elements common to both sets', () => {
			const setA = new ASet([1, 2, 3]);
			const setB = new ASet([2, 3, 4]);
			expect(setA.intersection(setB).sort()).toEqual([2, 3]);
		});
	});

	describe('isDisjointFrom', () => {
		it('should check for no common elements', () => {
			const setA = new ASet([1, 2]);
			const setB = new ASet([3, 4]);
			const setC = new ASet([2, 3]);
			expect(setA.isDisjointFrom(setB)).toBe(true);
			expect(setA.isDisjointFrom(setC)).toBe(false);
		});
	});

	describe('isSubsetOf', () => {
		it('should check if set is subset', () => {
			const a = new ASet([1, 2]);
			const b = new ASet([1, 2, 3]);
			expect(a.isSubsetOf(b)).toBe(true);
			expect(b.isSubsetOf(a)).toBe(false);
		});
	});

	describe('isSuperset', () => {
		it('should check if set is superset', () => {
			const a = new ASet([1, 2, 3]);
			const b = new ASet([1, 2]);
			expect(a.isSuperset(b)).toBe(true);
			expect(b.isSuperset(a)).toBe(false);
		});
	});

	describe('symmetricDifference', () => {
		it('should return elements only in one set (XOR)', () => {
			const a = new ASet([1, 2, 3]);
			const b = new ASet([3, 4]);
			expect(a.symmetricDifference(b).sort()).toEqual([1, 2, 4]);
		});
	});

	describe('union', () => {
		it('should return union of two sets', () => {
			const a = new ASet([1, 2]);
			const b = new ASet([2, 3]);
			expect(a.union(b).sort()).toEqual([1, 2, 3]);
		});

		it('should work with arrays', () => {
			const a = new ASet([1]);
			expect(a.union([2, 1, 3]).sort()).toEqual([1, 2, 3]);
		});
	});

	describe('size', () => {
		it('should return number of unique elements', () => {
			const set = new ASet([1, 1, 2, 3, 3]);
			expect(set.size).toBe(3);
		});
	});
});
