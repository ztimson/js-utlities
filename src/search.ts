import {JSONAttemptParse, JSONSerialize} from './json.ts';
import {dotNotation} from './objects.ts';

const VALID_FLAGS = new Set([...'dgimsuvy']);

function toRegex(pattern: string, defaultFlags = 'gm'): RegExp | null {
	const lit = /^\/(.+)\/([a-zA-Z]*)$/.exec(pattern);
	try { return lit ? new RegExp(lit[1], lit[2]) : new RegExp(pattern, defaultFlags); }
	catch { return null; }
}

/**
 * Filters an array of objects based on a query string.
 *
 * Supports plain text, regex, boolean/logical operators, and dataset helpers.
 *
 * **Examples**
 * ```js
 * search(rows: T[], 'alice'): T[] // Case-Insensitive
 * search(rows: T[], 'Alice'): T[] // Case-Sensitive
 *
 * search(rows: T[], 'name = Alice'): T[] // loose equality
 * search(rows: T[], 'name != Alice'): T[] // loose inequality
 * search(rows: T[], 'role += admin'): T[] // Contains
 * search(rows: T[], 'status -= archived'): T[] // Not Contain
 * search(rows: T[], 'age > 18'): T[] // Greater Than
 * search(rows: T[], 'age >= 18'): T[] // Greater Than or Equal
 * search(rows: T[], 'age < 18'): T[] // Less Than
 * search(rows: T[], 'age <= 18'): T[] // Less Than or Equal
 *
 * search(rows: T[], '/^alice/gi'): T[] // Global Regex
 * search(rows: T[], 'name =~ ^Al'): T[] // Regex Match (shorthand)
 * search(rows: T[], 'name =~ /^al/i'): T[] // Regex Match (with flags)
 * search(rows: T[], 'email !~ /@test\.com$/i'): T[] // Regex Not Match
 *
 * search(rows: T[], 'unique(email)'): T[] // Unique property values
 * search(rows: T[], 'duplicate(email)'): T[] // Duplicate property values
 * search(rows: T[], 'distinct(type)'): T[] // Distinct property values
 *
 * search(rows: T[], 'active && role != admin'): T[] // ANDs
 * search(rows: T[], 'email != null || distinct(email)'): T[] // ORs
 * ```
 *
 * @param rows - Array of objects to filter
 * @param query - Query string; see supported syntax above
 * @param transform - Optional transform applied to each row before matching
 * @returns The filtered array of rows
 */
export function search(rows: any[], query: string, transform: (r: any) => any = r => r): any[] {
	if (!rows || !query?.trim()) return rows ?? [];

	const q = query.trim();

	// Global regex: /pattern/flags — strict, whole string, at least one valid flag
	const globalRegex = /^\/(.+)\/([a-zA-Z]+)$/.exec(q);
	if (globalRegex && [...globalRegex[2]].every(f => VALID_FLAGS.has(f))) {
		const re = toRegex(q);
		return rows.filter(r => re && Object.values(transform(r)).some((v: any) => {
			try { return re.test(v?.toString() ?? ''); } catch { return false; }
		}));
	}

	// Split top-level && into predicates and dataset helpers
	const parts = q.split('&&').map(p => p.trim());
	const helpers = parts.filter(p => /^(unique|duplicate|distinct)\(\w+\)$/.test(p));
	const predicate = parts.filter(p => !helpers.includes(p)).join(' && ');

	let filtered = predicate
		? rows.filter(r => logicTest(transform(r), predicate))
		: [...rows];

	for (const h of helpers) {
		const [, fn, field] = /^(\w+)\((\w+)\)$/.exec(h)!;
		if (fn === 'distinct') continue; // run last
		const freq = new Map<any, number>();
		filtered.forEach(r => { const v = dotNotation(transform(r), field); freq.set(v, (freq.get(v) ?? 0) + 1); });
		filtered = filtered.filter(r => fn === 'unique' ? freq.get(dotNotation(transform(r), field)) === 1 : (freq.get(dotNotation(transform(r), field)) ?? 0) > 1);
	}

	for (const h of helpers.filter(h => h.startsWith('distinct'))) {
		const field = /\((\w+)\)/.exec(h)![1];
		const seen = new Set();
		filtered = filtered.filter(r => { const v = dotNotation(transform(r), field); return seen.has(v) ? false : !!seen.add(v); });
	}

	return filtered;
}

/**
 * Tests object against a logic string.
 *
 * **Property operators**
 * ```
 * 'alice'                    // case-insensitive
 * 'Alice'                    // case-sensitive
 * 'name = Alice'             // loose equality (==)
 * 'name == Alice'            // loose equality
 * 'name != Alice'            // loose inequality
 * 'role += admin'            // field contains value
 * 'status -= archived'       // field does not contain value
 * 'age > 21'                 // greater than
 * 'age >= 21'                // greater than or equal
 * 'age < 21'                 // less than
 * 'age <= 21'                // less than or equal
 * 'name =~ ^Al'              // regex match (shorthand)
 * 'name =~ /^al/i'           // regex match (with flags)
 * 'email !~ /@test\.com$/i'  // regex not match
 * 'status = active && role != admin'    // ANDs
 * 'status = active || status = pending' // ORs
 * ```
 *
 * @param target - The object to test
 * @param condition - The condition string; see supported syntax above
 * @returns Whether the object satisfies the condition
 */
export function logicTest(target: object, condition: string): boolean {
	const evalBoolean = (a: any, op: string, b: any): boolean => {
		switch (op) {
			case '=': case '==': return a == b;
			case '!=': return a != b;
			case '+=': return a?.toString().includes(b);
			case '-=': return !a?.toString().includes(b);
			case '>': return a > b;
			case '>=': return a >= b;
			case '<': return a < b;
			case '<=': return a <= b;
			case '~=': try { return !!toRegex(b)?.test(a?.toString() ?? ''); } catch { return false; }
			case '!~': try { return !toRegex(b)?.test(a?.toString() ?? ''); } catch { return false; }
			default: return false;
		}
	};

	const resolve = (key: string) => dotNotation<any>(target, Object.keys(target).find(k => k.toLowerCase() === key.toLowerCase()) ?? key);

	const evalExpr = (expr: string): boolean => {
		const e = expr.trim();
		const prop = /^(\S+)\s*(==?|!=|~=|!~|\+=|-=|>=|>|<=|<)\s*(.+)$/.exec(e);
		if (prop) return evalBoolean(resolve(prop[1]), prop[2], JSONAttemptParse(prop[3].trim()));
		const v = Object.values(target).map(JSONSerialize).join('');
		return /[A-Z]/.test(e) ? v.includes(e) : v.toLowerCase().includes(e.toLowerCase());
	};

	return condition.split('||').map(p => p.trim()).filter(Boolean).some(group =>
		group.split('&&').map(p => p.trim()).filter(Boolean).every(evalExpr)
	);
}
