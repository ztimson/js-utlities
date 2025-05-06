import {dotNotation, JSONAttemptParse} from '@ztimson/utils';

export function search(rows: any[], search: string, regex?: boolean, transform: Function = (r: any) => r) {
	if(!rows) return [];
	return rows.filter(r => {
		// Empty search
		const value = transform(r);
		if(!search) return true;
		// Regex search
		if(regex) {
			return !!Object.values(value).filter((v: any) => {
				try { return RegExp(search, 'gm').test(v.toString()); }
				catch { return false; }
			}).length
		} else {
			return testCondition(search, r);
		}
	});
}

export function testCondition(condition: string, row: any) {
	const evalBoolean = (a: any, op: string, b: any): boolean => {
		switch(op) {
			case '=':
			case '==': return a == b;
			case '!=': return a != b;
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
			const prop = /(\S+)\s*(==?|!=|>=|>|<=|<)\s*(\S+)/g.exec(p);
			if(prop) {
				const key = Object.keys(row).find(k => k.toLowerCase() == prop[1].toLowerCase());
				return evalBoolean(dotNotation<any>(row, key || prop[1]),  prop[2], JSONAttemptParse(prop[3]));
			}
			// Case-sensitive
			const v = Object.values(row).map(v => typeof v == 'object' && v != null ? JSON.stringify(v) : v).join('');
			if(/[A-Z]/g.test(condition)) return v.includes(p);
			// Case-insensitive
			return v.toLowerCase().includes(p);
		}).length == and.length;
	});
}
