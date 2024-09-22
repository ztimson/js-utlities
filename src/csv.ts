import {dotNotation, flattenObj} from './objects.ts';

/**
 * Convert an object to a CSV string
 *
 * @param {any[]} target Array of objects to create CSV from
 * @param {boolean} flatten Should nested object be flattened or treated as values
 * @return {string} CSV string
 */
export function csv(target: any[], flatten=true) {
	const headers = target.reduce((acc, row) => {
		Object.keys(flatten ? flattenObj(row) : row)
			.forEach(key => { if(!acc.includes(key)) acc.push(key); });
		return acc;
	}, []);
	return [
		headers.join(','),
		...target.map(row => headers.map((h: string) => {
			const value = dotNotation<any>(row, h);
			const type = typeof value;
			if(type == 'string' && value.includes(',')) return `"${value}"`;
			if(type == 'object') return `"${JSON.stringify(value)}"`;
			return value;
		}).join(','))
	].join('\n');
}
