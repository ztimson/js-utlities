import {JSONAttemptParse, JSONSanitize, JSONSerialize} from '../src';

describe('JSON Utilities', () => {
	describe('JSONAttemptParse', () => {
		it('parses valid JSON', () => {
			expect(JSONAttemptParse('{"a":1}')).toEqual({ a: 1 });
		});
		it('returns original string on error', () => {
			expect(JSONAttemptParse('not json')).toBe('not json');
		});
	});

	describe('JSONSerialize', () => {
		it('serializes objects', () => {
			expect(JSONSerialize({ a: 1 })).toBe(JSON.stringify({ a: 1 }));
		});
		it('leaves primitives as is', () => {
			expect(JSONSerialize('test')).toBe('test');
			expect(JSONSerialize(123)).toBe(123);
		});
	});

	describe('JSONSanitize', () => {
		it('stringifies objects', () => {
			expect(JSONSanitize({ a: 1 })).toBe(JSON.stringify({ a: 1 }));
		});
		it('does not throw on circular refs', () => {
			const obj: any = {};
			obj.self = obj;
			expect(() => JSONSanitize(obj)).not.toThrow();
		});
	});
});
