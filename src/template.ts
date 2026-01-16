import {BadRequestError} from './errors.ts';
import {dotNotation} from './objects.ts';
import {matchAll} from './string.ts';
import {formatDate} from './time.ts';

export class TemplateError extends BadRequestError { }

export function findTemplateVars(html: string): Record<string, any> {
	const variables = new Set<string>();
	const arrays = new Set<string>();
	const excluded = new Set<string>(['true', 'false', 'null', 'undefined']);

	// Extract & exclude loop variables, mark arrays
	for (const loop of matchAll(html, /\{\{\s*?\*\s*?(.+?)\s+in\s+(.+?)\s*?}}/g)) {
		const [element, index = 'index'] = loop[1].replaceAll(/[()\s]/g, '').split(',');
		excluded.add(element);
		excluded.add(index);
		const arrayVar = loop[2].trim();
		const root = arrayVar.split('.')[0];
		if(!excluded.has(root)) {
			variables.add(arrayVar);
			arrays.add(arrayVar);
		}
	}

	// Extract variables from if/else-if conditions
	for (const ifStmt of matchAll(html, /\{\{\s*?[!]?\?\s*?([^}]+?)\s*?}}/g)) {
		const code = ifStmt[1].replace(/["'`][^"'`]*["'`]/g, '');
		const cleaned = code.replace(/([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*\(/g, (_, v) => {
			const parts = v.split('.');
			return parts.length > 1 ? parts.slice(0, -1).join('.') + ' ' : '';
		});
		const vars = cleaned.match(/[a-zA-Z_$][a-zA-Z0-9_$.]+/g) || [];
		for (const v of vars) {
			const root = v.split('.')[0];
			if(!excluded.has(root)) variables.add(v);
		}
	}

	// Extract from if block content & regular interpolations
	const regex = /\{\{\s*([^<>\*\?!/}\s][^}]*?)\s*}}/g;
	let match;
	while ((match = regex.exec(html)) !== null) {
		const code = match[1].trim().replace(/["'`][^"'`]*["'`]/g, '');
		const cleaned = code.replace(/([a-zA-Z_$][a-zA-Z0-9_$.]*)\s*\(/g, (_, v) => {
			const parts = v.split('.');
			return parts.length > 1 ? parts.slice(0, -1).join('.') + ' ' : '';
		});
		const vars = cleaned.match(/[a-zA-Z_$][a-zA-Z0-9_$.]+/g) || [];
		for (const v of vars) {
			const root = v.split('.')[0];
			if(!excluded.has(root)) variables.add(v);
		}
	}

	const result: Record<string, any> = {};
	for (const path of variables) {
		const parts = path.split('.');
		let current = result;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if(i === parts.length - 1) {
				const fullPath = parts.slice(0, i + 1).join('.');
				current[part] = arrays.has(fullPath) ? [] : '';
			} else {
				current[part] = current[part] || {};
				current = current[part];
			}
		}
	}
	return result;
}
export async function renderTemplate(template: string, data: any, fetch?: (file: string) => Promise<string>) {
	if(!fetch) fetch = (file) => { throw new TemplateError(`Unable to fetch template: ${file}`); }

	const now = new Date();
	const d = {
		date: {
			day: now.getDate(),
			month: now.toLocaleString('default', { month: 'long' }),
			year: now.getFullYear(),
			time: now.toLocaleTimeString(),
			format: formatDate
		},
		...(data || {}),
	};

	const evaluate = (code: string, data: object, fatal = true) => {
		try {
			return Function('data', `with(data) { return ${code}; }`)(data);
		} catch(err: any) {
			if(fatal) throw new TemplateError(`Failed to evaluate: ${code}\n${err.message || err.toString()}`);
			return false;
		}
	}

	async function process(content: string, ctx: object = d): Promise<string> {
		let result = content;

		// Process extends first (they wrap everything)
		const extendsMatch = result.match(/\{\{\s*>\s*(.+?):(.+?)\s*}}([\s\S]*?)\{\{\s*\/>\s*}}/);
		if(extendsMatch) {
			const parentTemplate = await (<Function>fetch)(extendsMatch[1].trim());
			if(!parentTemplate) throw new TemplateError(`Unknown extended template: ${extendsMatch[1].trim()}`);
			const slotName = extendsMatch[2].trim();
			const slotContent = await process(extendsMatch[3], ctx);
			return process(parentTemplate, {...ctx, [slotName]: slotContent});
		}

		let changed = true;
		while(changed) {
			changed = false;
			const before = result;

			// Process imports
			const importMatch = result.match(/\{\{\s*<\s*(.+?)\s*}}/);
			if(importMatch) {
				const t = await (<Function>fetch)(importMatch[1].trim());
				if(!t) throw new TemplateError(`Unknown imported template: ${importMatch[1].trim()}`);
				const rendered = await process(t, ctx);
				result = result.replace(importMatch[0], rendered);
				changed = true;
				continue;
			}

			// Process for-loops (innermost first)
			const forMatch = findInnermostFor(result);
			if(forMatch) {
				const { full, vars, array, body, start } = forMatch;
				const [element, index = 'index'] = vars.split(',').map(v => v.trim());
				const arr: any[] = <any>dotNotation(ctx, array);
				if(!arr || typeof arr != 'object') throw new TemplateError(`Cannot iterate: ${array}`);
				let output = [];
				for(let i = 0; i < arr.length; i++)
					output.push(await process(body, {...ctx, [element]: arr[i], [index]: i}));
				result = result.slice(0, start) + output.join('\n') + result.slice(start + full.length);
				changed = true;
				continue;
			}

			// Process if-statements (innermost first)
			const ifMatch = findInnermostIf(result);
			if(ifMatch) {
				const { full, condition, body, start } = ifMatch;
				const branches = parseIfBranches(body);
				let output = '';
				if(evaluate(condition, ctx, false)) {
					output = branches.if;
				} else {
					for(const branch of branches.elseIf) {
						if(evaluate(branch.condition, ctx, false)) {
							output = branch.body;
							break;
						}
					}
					if(!output && branches.else) output = branches.else;
				}
				result = result.slice(0, start) + output + result.slice(start + full.length);
				changed = true;
				continue;
			}
			if(before === result) changed = false;
		}
		return processVariables(result, ctx);
	}

	function processVariables(content: string, data: object): string {
		return content.replace(/\{\{\s*([^<>\*\?!/}\s][^{}]*?)\s*}}/g, (match, code) => {
			return evaluate(code.trim(), data) ?? '';
		});
	}

	function findInnermostIf(content: string) {
		const regex = /\{\{\s*\?\s*(.+?)\s*}}/g;
		let match, lastMatch = null;
		while((match = regex.exec(content)) !== null) {
			const start = match.index;
			const condition = match[1];
			const bodyStart = match.index + match[0].length;
			const end = findMatchingClose(content, bodyStart, /\{\{\s*\?\s*/, /\{\{\s*\/\?\s*}}/);
			if(end === -1) throw new TemplateError(`Unmatched if-statement at position ${start}`);
			const closeTag = content.slice(end).match(/\{\{\s*\/\?\s*}}/);
			const full = content.slice(start, end + (<any>closeTag)[0].length);
			const body = content.slice(bodyStart, end);
			lastMatch = { full, condition, body, start };
		}
		return lastMatch;
	}

	function findInnermostFor(content: string) {
		const regex = /\{\{\s*\*\s*(.+?)\s+in\s+(.+?)\s*}}/g;
		let match, lastMatch = null;
		while((match = regex.exec(content)) !== null) {
			const start = match.index;
			const vars = match[1].replaceAll(/[()\s]/g, '');
			const array = match[2];
			const bodyStart = match.index + match[0].length;
			const end = findMatchingClose(content, bodyStart, /\{\{\s*\*\s*/, /\{\{\s*\/\*\s*}}/);
			if(end === -1) throw new TemplateError(`Unmatched for-loop at position ${start}`);
			const closeTag = content.slice(end).match(/\{\{\s*\/\*\s*}}/);
			const full = content.slice(start, end + (<any>closeTag)[0].length);
			const body = content.slice(bodyStart, end);
			lastMatch = { full, vars, array, body, start };
		}
		return lastMatch;
	}

	function findMatchingClose(content: string, startIndex: number, openTag: RegExp, closeTag: RegExp): number {
		let depth = 1, pos = startIndex;
		while (depth > 0 && pos < content.length) {
			const remaining = content.slice(pos);
			const nextOpen = remaining.search(openTag);
			const nextClose = remaining.search(closeTag);
			if(nextClose === -1) return -1;
			if(nextOpen !== -1 && nextOpen < nextClose) {
				depth++;
				pos += nextOpen + 1;
			} else {
				depth--;
				if(depth === 0) return pos + nextClose;
				pos += nextClose + 1;
			}
		}
		return -1;
	}

	function parseIfBranches(body: string) {
		const parts = body.split(/\{\{\s*!\?\s*/);
		const result = { if: parts[0], elseIf: [] as any[], else: '' };
		for(let i = 1; i < parts.length; i++) {
			const closeBrace = parts[i].indexOf('}}');
			const condition = parts[i].slice(0, closeBrace).trim();
			const branchBody = parts[i].slice(closeBrace + 2);
			if(!condition) result.else = branchBody;
			else result.elseIf.push({ condition, body: branchBody });
		}
		return result;
	}

	return process(template);
}
