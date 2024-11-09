import {ASet} from './aset.ts';
import {dotNotation, flattenObj, JSONSanitize} from './objects.ts';

export function fromCsv<T = any>(csv: string, hasHeaders=true): T[] {
	const row = csv.split('\n');
	let headers: any = hasHeaders ? row.splice(0, 1)[0] : null;
	if(headers) headers = headers.match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g);
	return <T[]>row.map(r => {
		const props: string[] = <any>r.match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g);
		const h = headers || (Array(props.length).fill(null).map((r, i) => {
			let letter = '';
			const first = i / 26;
			if(first > 1) letter += 
			i % 26
			i
		}));
		return h.reduce((acc: any, h: any, i: number) => ({...acc, [h]: props[i]}), {})
	})
}

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
