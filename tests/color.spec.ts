import {contrast} from '../src';

describe('contrast', () => {
	it('should return "black" for white background', () => {
		expect(contrast('ffffff')).toBe('black');
		expect(contrast('#ffffff'.replace('#', ''))).toBe('black'); // simulate trimmed hash
	});

	it('should return "white" for black background', () => {
		expect(contrast('000000')).toBe('white');
	});

	it('should return "white" for a dark color', () => {
		expect(contrast('123456')).toBe('white');
		expect(contrast('222222')).toBe('white');
	});

	it('should return "black" for a light color', () => {
		expect(contrast('ffff99')).toBe('black');
		expect(contrast('cccccc')).toBe('black');
	});

	it('should handle short hex color codes (3 chars)', () => {
		expect(contrast('fff')).toBe('black');
		expect(contrast('000')).toBe('white');
	});

	it('should return "black" for invalid input', () => {
		expect(contrast('')).toBe('black');
		expect(contrast('zzzzzz')).toBe('black');
		expect(contrast('not-a-color')).toBe('black');
		expect(contrast(undefined as unknown as string)).toBe('black');
		expect(contrast(null as unknown as string)).toBe('black');
	});

	it('should handle hex codes with hash prefix if removed', () => {
		expect(contrast('ededed')).toBe('black');
		expect(contrast('343434')).toBe('white');
	});
});
