/**
 * Convert decimal number to fraction
 *
 * @example
 * ```js
 * dec2Frac(1.25) // Outputs: "1 1/4"
 * ```
 *
 * @param {number} num Number to convert
 * @return {string} Fraction with remainder
 */
export function dec2Frac(num: number) {
	const gcd = (a: number, b: number): number => {
		if (b < 0.0000001) return a;
		return gcd(b, ~~(a % b));
	};

	const len = num.toString().length - 2;
	let denominator = Math.pow(10, len);
	let numerator = num * denominator;
	const divisor = gcd(numerator, denominator);
	numerator = ~~(numerator / divisor);
	denominator = ~~(denominator / divisor)
	const remainder = ~~(numerator / denominator);
	numerator -= remainder * denominator;
	return `${remainder ? remainder + ' ' : ''}${~~(numerator)}/${~~(denominator)}`;
}

/**
 * Convert fraction to decimal number
 *
 * @example
 * ```js
 * fracToDec('1 1/4') // Outputs: 1.25
 * ```
 *
 * @param {string} frac Fraction to convert
 * @return {number} Faction as a decimal
 */
export function fracToDec(frac: string) {
	let split = frac.split(' ');
	const whole = split.length == 2 ? Number(split[0]) : 0;
	split = (<string>split.pop()).split('/');
	return whole + (Number(split[0]) / Number(split[1]));
}
