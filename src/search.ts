import {JSONAttemptParse, JSONSerialize} from './json.ts';
import {dotNotation} from './objects.ts';

/**
 * Filters an array of objects based on a search term and optional regex checking.
 *
 * @param {Array} rows Array of objects to filter
 * @param {string} search The logic string or regext to filter on
 * @param {boolean} [regex=false] Treat search expression as regex
 * @param {Function} [transform=(r) => r] - Transform rows before filtering
 * @return {Array} The filtered array of objects that matched search
 */
export function search(rows: any[], search: string, regex?: boolean, transform: Function = (r: any) => r) {
	if(!rows) return [];
	return rows.filter(r => {
		// Empty search
		if(!search) return true;
		const value = transform(r);
		// Regex search
		if(regex) {
			return !!Object.values(value).filter((v: any) => {
				try { return RegExp(search, 'gm').test(v.toString()); }
				catch { return false; }
			}).length
		} else {
			return logicTest(value, search);
		}
	});
}

/**
 * Test an object against a logic condition. By default values are checked
 * @param {string} condition
 * @param {object} target
 * @return {boolean}
 */
export function logicTest(target: object, condition: string): boolean {
	const evalBoolean = (a: any, op: string, b: any): boolean => {
		switch(op) {
			case '=':
			case '==': return a == b;
			case '!=': return a != b;
			case '+=': return a?.toString().includes(b);
			case '-=': return !a?.toString().includes(b);
			case '>': return a > b;
			case '>=': return a >= b;
			case '<': return a < b;
			case '<=': return a <= b;
			default: return false;
		}
	}

	const or = condition.split('||').map(p => p.trim()).filter(p => !!p);
	return -1 != or.findIndex(p => {
		// Make sure all ANDs pass
		const and = p.split('&&').map(p => p.trim()).filter(p => !!p);
		return and.filter(p => {
			// Boolean operator
			const prop = /(\S+)\s*(==?|!=|\+=|-=|>=|>|<=|<)\s*(\S+)/g.exec(p);
			if(prop) {
				const key = Object.keys(target).find(k => k.toLowerCase() == prop[1].toLowerCase());
				return evalBoolean(dotNotation<any>(target, key || prop[1]),  prop[2], JSONAttemptParse(prop[3]));
			}
			// Case-sensitive
			const v = Object.values(target).map(JSONSerialize).join('');
			if(/[A-Z]/g.test(condition)) return v.includes(p);
			// Case-insensitive
			return v.toLowerCase().includes(p);
		}).length == and.length;
	});
}
