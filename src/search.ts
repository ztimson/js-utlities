import {dotNotation, JSONAttemptParse} from './objects';

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
		}
		// Make sure at least one OR passes
		const or = search.split('||').map(p => p.trim()).filter(p => !!p);
		return -1 != or.findIndex(p => {
			// Make sure all ANDs pass
			const and = p.split('&&').map(p => p.trim()).filter(p => !!p);
			return and.filter(p => {
				// Boolean operator
				const prop = /(\w+)\s*(==?|!=|>=|>|<=|<)\s*(\w+)/g.exec(p);
				if(prop) {
					const a = JSON.stringify(JSONAttemptParse(dotNotation<any>(value, prop[1])));
					const operator = prop[2] == '=' ? '==' : prop[2];
					const b = JSON.stringify(JSONAttemptParse(prop[3]));
					return eval(`${a} ${operator} ${b}`);
				}
				// Case-sensitive
				const v = Object.values(value).join('');
				if(/[A-Z]/g.test(search)) return v.includes(p);
				// Case-insensitive
				return v.toLowerCase().includes(p);
			}).length == and.length;
		})
	});
}
