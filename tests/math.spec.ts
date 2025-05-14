import { dec2Frac, fracToDec } from '../src';

describe('Math Utilities', () => {
	describe('dec2Frac', () => {
		it('should convert decimal to fraction with whole and remainder', () => {
			expect(dec2Frac(1.25)).toBe('1 1/4');
			expect(dec2Frac(2.5)).toBe('2 1/2');
			expect(dec2Frac(3.75)).toBe('3 3/4');
		});

		it('should convert integer to fraction with denominator', () => {
			expect(dec2Frac(4)).toBe('4');
			expect(dec2Frac(0)).toBe('0');
		});

		it('should convert proper fraction (less than 1)', () => {
			expect(dec2Frac(0.75)).toBe('3/4');
			expect(dec2Frac(0.5)).toBe('1/2');
			expect(dec2Frac(0.1)).toBe('1/10');
		});

		it('should handle repeating decimals gracefully', () => {
			expect(dec2Frac(0.333333)).toBe('1/3');
			expect(dec2Frac(0.666666)).toBe('2/3');
		});
	});

	describe('fracToDec', () => {
		it('should convert mixed fraction to decimal', () => {
			expect(fracToDec('1 1/4')).toBeCloseTo(1.25);
			expect(fracToDec('2 1/2')).toBeCloseTo(2.5);
			expect(fracToDec('3 3/4')).toBeCloseTo(3.75);
		});

		it('should convert fraction without whole part to decimal', () => {
			expect(fracToDec('3/4')).toBeCloseTo(0.75);
			expect(fracToDec('1/2')).toBeCloseTo(0.5);
			expect(fracToDec('1/10')).toBeCloseTo(0.1);
		});

		it('should convert whole number fraction', () => {
			expect(fracToDec('4 0/1')).toBeCloseTo(4);
			expect(fracToDec('0/1')).toBeCloseTo(0);
		});

		it('should handle zero correctly', () => {
			expect(fracToDec('0/1')).toBeCloseTo(0);
			expect(fracToDec('0 0/1')).toBeCloseTo(0);
		});
	});
});
