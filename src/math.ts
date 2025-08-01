/**
 * Convert decimal number to fraction
 *
 * @example
 * ```js
 * dec2Frac(1.25) // Outputs: "1 1/4"
 * ```
 *
 * @param {number} num Number to convert
 * @param maxDen
 * @return {string} Fraction with remainder
 */
export function dec2Frac(num: number, maxDen=1000): string {
	let sign = Math.sign(num);
	num = Math.abs(num);
	if (Number.isInteger(num)) return (sign * num) + "";
	let closest = { n: 0, d: 1, diff: Math.abs(num) };
	for (let d = 1; d <= maxDen; d++) {
		let n = Math.round(num * d);
		let diff = Math.abs(num - n / d);
		if (diff < closest.diff) {
			closest = { n, d, diff };
			if (diff < 1e-8) break; // Close enough
		}
	}
	let integer = Math.floor(closest.n / closest.d);
	let numerator = closest.n - integer * closest.d;
	return (sign < 0 ? '-' : '') +
		(integer ? integer + ' ' : '') +
		(numerator ? numerator + '/' + closest.d : '');
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

/**
 * Add a suffix to a number:
 * 1 = 1st
 * 2 = 2nd
 * 3 = 3rd
 * N = Nth
 * @param {number} n
 * @returns {string}
 */
export function numSuffix(n: number): string {
	const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
	return `${n}${s[(v - 20) % 10] || s[v] || s[0]}`;
}
