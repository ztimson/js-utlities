import {ASet} from './aset.ts';
import {dotNotation, flattenObj, JSONSanitize} from './objects.ts';
import {LETTER_LIST} from './string.ts';

export function fromCsv<T = any>(csv: string, hasHeaders=true): T[] {
	const row = csv.split('\n');
	let headers: any = hasHeaders ? row.splice(0, 1)[0] : null;
	if(headers) headers = headers.match(/(?:[^,"']+|"[^"]*"|'[^']*')+/g);
	return <T[]>row.map(r => {
		function parseLine(line: string): (string | null)[] {
			const parts = line.split(','), columns: string[] = [];
			let quoted = false;
			for(const p of parts) {
				if(quoted) columns[columns.length - 1] = columns.at(-1) + ',' + p;
				else columns.push(p);
				if(/[^"]"$/g.test(p)) {
					quoted = false;
				} else if(/^"[^"]/g.test(p)) {
					quoted = true;
				}
			}
			return columns;
		}

		const props = parseLine(r);
		const h = headers || (Array(props.length).fill(null).map((r, i) => {
			let letter = '';
			const first = i / 26;
			if(first > 1) letter += LETTER_LIST[Math.floor(first - 1)];
			letter += LETTER_LIST[i % 26];
			return letter;
		}));
		return h.reduce((acc: any, h: any, i: number) => {
			dotNotation(acc, h, props[i]);
			return acc;
		}, {});
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
