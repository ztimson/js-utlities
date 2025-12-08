import {BadRequestError} from './errors.ts';
import {dotNotation} from './objects.ts';
import {matchAll} from './string.ts';
import {formatDate} from './time.ts';

export class TemplateError extends BadRequestError { }

function findTemplateVars(html: string): Record<string, any> {
	const variables = new Set<string>();
	const regex = /\{\{\s*([^<>\*\?!/}\s][^}]*?)\s*}}/g;
	let match;

	while ((match = regex.exec(html)) !== null) {
		const code = match[1].trim();
		const varMatch = code.match(/^([a-zA-Z_$][a-zA-Z0-9_$.]*)/);
		if (varMatch) variables.add(varMatch[1]);
	}

	const result: Record<string, any> = {};
	for (const path of variables) {
		const parts = path.split('.');
		let current = result;
		for (let i = 0; i < parts.length; i++) {
			const part = parts[i];
			if (i === parts.length - 1) {
				current[part] = '';
			} else {
				current[part] = current[part] || {};
				current = current[part];
			}
		}
	}
	return result;
}

export async function renderTemplate(template: string, data: any, fetch?: (file: string) => Promise<string>) {
	let content = template, found: any;
	const now = new Date(), d = {
		date: {
			day: now.getDate(),
			month: now.toLocaleString('default', { month: 'long' }),
			year: now.getFullYear(),
			time: now.toLocaleTimeString(),
			format: formatDate
		},
		...(data || {}),
	};
	if(!fetch) fetch = (file) => { throw new TemplateError(`Unable to fetch template: ${file}`); }
	const evaluate = (code: string, data: object, fatal = true) => {
		try {
			return Function('data', `with(data) { return ${code}; }`)(data);
		} catch {
			if(fatal) throw new TemplateError(`Failed to evaluate: ${code}`);
			else return false;
		}
	}

	// If Statements - Optimize what we render: `{{ ? javascript }} IF TRUE CONTENT {{ !? javascript }} ELSE-IF CONTENT {{ !? }} ELSE FALSE CONTENT {{ /? }}`
	while(!!(found = /\{\{\s*?\?\s*?(.+?)\s*?}}([\s\S]*?)\{\{\s*?\/\?\s*?}}/g.exec(content))) {
		const nested = matchAll(found[0], /\{\{\s*?\?.+?}}/g).slice(-1)?.[0]?.index;
		if(nested != 0) found = /\{\{\s*?\?\s*?(.+?)\s*?}}([\s\S]*?)\{\{\s*?\/\?\s*?}}/g.exec(content.slice(found.index + nested))
		const parts = found[2].split(/\{\{\s*?!\?\s*?/);
		let result = evaluate(found[1], d, false) ? parts[0] : '';
		if (!result) {
			for (let i = 1; i < parts.length; i++) {
				const [cond, body] = parts[i].split(/}}/);
				if (!cond.trim()) {
					result = body || '';
					break;
				}
				if (evaluate(cond, d, false)) {
					result = body || '';
					break;
				}
			}
		}
		content = content.replace(found[0], result);
	}

	// Imports - We render bottom up: `{{ < file.html }}`
	while(!!(found = /\{\{\s*?<\s*?(.+?)\s*?}}/g.exec(content))) {
		const t = await fetch(found[1].trim());
		if(!t) throw new TemplateError(`Unknown imported template: ${found[1].trim()}`);
		content = content.replace(found[0], await renderTemplate(t, d, fetch));
	}

	// For Loops: `{{ * (row, index) in invoice }} CONTENT {{ /* }}`
	while(!!(found = /\{\{\s*?\*\s*?(.+?)\s+in\s+(.+?)\s*?}}([\s\S]*?)\{\{\s*?\/\*\s*?}}/g.exec(content))) {
		const split = found[1].replaceAll(/[()\s]/g, '').split(',');
		const element = split[0];
		const index = split[1] || 'index';
		const array: any[] = <any>dotNotation(d, found[2]);
		if(!array || typeof array != 'object') throw new TemplateError(`Cannot iterate: ${found[2]}`);
		let compiled = [];
		for(let i = 0; i < array.length; i++)
			compiled.push(await renderTemplate(found[3], {...d, [element]: array[i], [index]: i}, fetch));
		content = content.replace(found[0], compiled.join('\n'));
	}

	// Evaluate whatever is left - Should come last: `{{ javascript }}`
	while(!!(found = /\{\{\s*([^<>\*\?!/}\s][^}]*?)\s*}}/g.exec(content))) {
		content = content.replace(found[0], evaluate(found[1].trim(), d) ?? '');
	}

	// Extends: `{{ > file.html:property }} CONTENT {{ /> }}`
	while(!!(found = /\{\{\s*?>\s*?(.+?):(.+?)\s*?}}([\s\S]*?)\{\{\s*?\/>\s*?}}/g.exec(content))) {
		const t = await fetch(found[1].trim());
		if(!t) throw new TemplateError(`Unknown extended templated: ${found[1].trim()}`);
		content = content.replace(found[0], await renderTemplate(t, {
			...d,
			[found[2].trim()]: found[3],
		}, fetch));
	}

	return content;
}
