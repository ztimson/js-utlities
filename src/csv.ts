import {ASet} from './aset.ts';
import {dotNotation, flattenObj, JSONAttemptParse, JSONSanitize} from './objects.ts';

/**
 * Convert an object to a CSV string
 *
 * @param {any[]} target Array of objects to create CSV from
 * @param {boolean} flatten Should nested object be flattened or treated as values
 * @return {string} CSV string
 */
export function toCsv(target: any[], flatten=true) {
	const headers = new ASet(target.reduce((acc, row) => [...acc, ...Object.keys(flatten ? flattenObj(row) : row)], []));
	return [
		headers.join(','),
		...target.map(row => headers.map((h: string) => {
			const value = dotNotation<any>(row, h);
			return (typeof value == 'object' && value != null) ? '"' + JSONSanitize(value).replaceAll('"', '""') + '"' : value;
		}).join(','))
	].join('\n');
}
