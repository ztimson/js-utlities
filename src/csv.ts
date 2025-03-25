import {makeArray} from './array.ts';
import {ASet} from './aset.ts';
import {dotNotation, flattenObj, JSONSanitize} from './objects.ts';
import {LETTER_LIST} from './string.ts';

/**
 * Parse a CSV string into an array of objects
 *
 * @param csv String with CSV
 * @param hasHeaders First line of CSV contains headers
 * @return {T[]} Array of parsed objects
 */
export function fromCsv<T = any>(csv: string, hasHeaders=true): T[] {
	function parseLine(line: string): (string | null)[] {
		const columns: string[] = [];
		let current = '', inQuotes = false;
		for(let i = 0; i < line.length; i++) {
			const char = line[i];
			const nextChar = line[i + 1];
			if (char === '"') {
				if (inQuotes && nextChar === '"') {
					current += '"';
					i++;
				} else inQuotes = !inQuotes;
			} else if (char === ',' && !inQuotes) {
				columns.push(current);
				current = '';
			} else current += char;
		}
		columns.push(current);
		return columns.map(col => col.replace(/^"|"$/g, '').replace(/""/g, '"'));
	}

	const row = csv.split(/\r?\n/);
	let headers: any = hasHeaders ? row.splice(0, 1)[0] : null;
	if(headers) headers = headers.match(/(?:[^,"']+|"(?:[^"]|"")*"|'(?:[^']|'')*')+/g);
	return <T[]>row.map(r => {
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
	});
}

/**
 * Convert an array of objects to a CSV string
 *
 * @param {any[]} target Array of objects to create CSV from
 * @param {boolean} flatten Should nested object be flattened or treated as values
 * @return {string} CSV string
 */
export function toCsv(target: any, flatten=true) {
	const t = makeArray(target);
	const headers = new ASet(t.reduce((acc, row) => [...acc, ...Object.keys(flatten ? flattenObj(row) : row)], []));
	return [
		headers.join(','),
		...t.map(row => headers.map((h: string) => {
			const value = dotNotation<any>(row, h);
			if(value == null) return '';
			if(typeof value == 'object') return `"${JSONSanitize(value).replaceAll('`', '""')}"`;
			if(typeof value == 'string' &&  /[\n"]/g.test(value)) return `"${value.replaceAll('"', '""')}"`;
			return value;
		}).join(','))
	].join('\n');
}
