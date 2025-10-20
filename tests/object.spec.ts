import {
	clean, deepCopy, deepMerge, dotNotation, encodeQuery, flattenObj, formData, includes, isEqual, mixin,
} from '../src';

describe('Object utilities', () => {
	describe('clean', () => {
		it('removes null values', () => {
			const obj = { a: 1, b: null, c: undefined, d: 0 };
			expect(clean({ ...obj })).toEqual({ a: 1, c: undefined, d: 0 });
		});
		it('throws on null input', () => {
			expect(() => clean(null as any)).toThrow();
		});
		it('removes undefined only when specified', () => {
			const obj = { a: 1, b: undefined, c: null };
			expect(clean({ ...obj }, true)).toEqual({ a: 1, c: null });
		});
		it('works for arrays', () => {
			expect(clean([1, null, 2, undefined, 3] as any)).toEqual([1, 2, 3]);
		});
	});

	describe('deepCopy', () => {
		it('creates a deep copy', () => {
			const obj = { a: { b: 2 } };
			const copy = deepCopy(obj);
			expect(copy).toEqual(obj);
			expect(copy).not.toBe(obj);
			expect(copy.a).not.toBe(obj.a);
		});
	});

	describe('deepMerge', () => {
		it('merges deeply nested objects', () => {
			const tgt = { a: { b: 1 }, d: 7 };
			const src = { a: { c: 2 }, d: 8 };
			expect(deepMerge({ ...tgt }, src)).toEqual({ a: { b: 1, c: 2 }, d: 8 });
		});
		it('merges multiple sources', () => {
			const t = { a: 1 };
			const s1 = { b: 2 };
			const s2 = { c: 3 };
			expect(deepMerge({ ...t }, s1, s2)).toEqual({ a: 1, b: 2, c: 3 });
		});
	});

	describe('dotNotation', () => {
		it('gets nested value', () => {
			const obj = { a: { b: { c: 3 } } };
			expect(dotNotation(obj, 'a.b.c')).toBe(3);
		});
		it('sets nested value', () => {
			const obj = { a: { b: { c: 3 } } };
			dotNotation(obj, 'a.b.c', 10);
			expect(obj.a.b.c).toBe(10);
		});
		it('returns undefined for non-existent path', () => {
			expect(dotNotation({ a: 1 }, 'a.b.c')).toBeUndefined();
		});
		it('creates nested object when setting', () => {
			const obj: any = {};
			dotNotation(obj, 'd.e.f', 5);
			expect(obj.d.e.f).toBe(5);
		});
	});

	describe('encodeQuery', () => {
		it('encodes simple objects', () => {
			expect(encodeQuery({ a: 1, b: 'test' })).toBe('a=1&b=test');
		});
		it('handles special characters', () => {
			expect(encodeQuery({ a: 'hello world' })).toBe('a=hello%20world');
		});
	});

	describe('flattenObj', () => {
		it('flattens nested objects', () => {
			const obj = { a: { b: 2 }, c: 3 };
			expect(flattenObj(obj)).toEqual({ 'a.b': 2, c: 3 });
		});
		it('handles multiple nesting', () => {
			const obj = { a: { b: { c: 4 } } };
			expect(flattenObj(obj)).toEqual({ 'a.b.c': 4 });
		});
	});

	describe('formData', () => {
		it('converts object to FormData', () => {
			const obj = { a: '1', b: 'foo' };
			const fd = formData(obj);
			expect(fd.get('a')).toBe('1');
			expect(fd.get('b')).toBe('foo');
		});
	});

	describe('includes', () => {
		it('checks if all values included', () => {
			expect(includes({ a: 2, b: 3 }, { a: 2 })).toBeTruthy();
			expect(includes({ a: 2, b: 3 }, { c: 1 })).toBeFalsy();
		});
		it('handles arrays of values', () => {
			expect(includes([{ a: 1 }], [{ a: 1 }])).toBeTruthy();
			expect(includes([{ a: 1 }], [{ a: 2 }])).toBeFalsy();
		});
		it('allows missing when specified', () => {
			expect(includes(undefined, { a: 2 }, true)).toBeTruthy();
		});
	});

	describe('isEqual', () => {
		it('returns true for deeply equal objects', () => {
			expect(isEqual({ a: 1, b: { c: 3 } }, { a: 1, b: { c: 3 } })).toBe(true);
		});
		it('returns false for non-equal objects', () => {
			expect(isEqual({ a: 1 }, { a: 2 })).toBe(false);
		});
		it('compares functions by string', () => {
			expect(isEqual(() => 1, () => 1)).toBe(true);
		});
	});

	describe('mixin', () => {
		it('merges prototypes', () => {
			class A { foo() { return 1; } }
			class B { bar() { return 2; } }
			class C {}
			mixin(C, [A, B]);
			const c = new (C as any)();
			expect(c.foo()).toBe(1);
			expect(c.bar()).toBe(2);
		});
	});
});
