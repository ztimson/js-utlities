import {BadRequestError} from './errors.ts';
import {dotNotation} from './objects.ts';
import {matchAll} from './string.ts';
import {formatDate} from './time.ts';

export class TemplateError extends BadRequestError { }

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

	if(!fetch) fetch = (file) => {
		throw new TemplateError(`Unable to fetch template: ${file}`);
	}

	const evaluate = (code: string, data: object, fatal = true) => {
		try {
			return Function('data', `Object.assign(this, data); return ${code};`)(data);
		} catch {
			if(fatal) throw new TemplateError(`Failed to evaluate: ${code}`);
			else return false;
		}
	}

	// If Statements - Optimize what we render: `{{ ? javascript }} TRUE CONTENT {{ !? }} FALSE CONTENT {{ /? }}`
	while(!!(found = /\{\{\s*?\?\s*?(.+?)\s*?}}([\s\S]*?)(?:\{\{\s*?!\?\s*?}}([\s\S]*?))?\{\{\s*?\/\?\s*?}}/g.exec(content))) {
		const nested = matchAll(found[0], /\{\{\s*?\?.+?}}/g).slice(-1)?.[0]?.index;
		if(nested != 0)
			found = /\{\{\s*?\?\s*?(.+?)\s*?}}([\s\S]*?)(?:\{\{\s*?!\?\s*?}}([\s\S]*?))?\{\{\s*?\/\?\s*?}}/g.exec(content.slice(found.index + nested))
		content = content.replace(found[0], (evaluate(found[1], d, false) ? found[2] : found[3]) || '');
	}

	// Imports - We render bottom up: `{{ < file.html }}`
	while(!!(found = /\{\{\s*?<\s*?(.+?)\s*?}}/g.exec(content))) {
		content = content.replace(found[0], await renderTemplate(await fetch(found[1].trim()), data, fetch));
	}

	// For Loops: `{{ * (row, index) in invoice }} CONTENT {{ /* }}`
	while(!!(found = /\{\{\s*?\*\s*?(.+?)\s+in\s+(.+?)\s*?}}([\s\S]*?)\{\{\s*?\/\*\s*?}}/g.exec(content))) {
		const split = found[1].replaceAll(/[()\s]/g, '').split(',');
		const element = split[0];
		const index = split[1] || 'index';
		const array: any[] = <any>dotNotation(data, found[2]);
		if(!array || typeof array != 'object')
			throw new TemplateError(`Cannot iterate: ${found[2]}`);

		let compiled = [];
		for(let i = 0; i < array.length; i++) {
			compiled.push(renderTemplate(found[3], {
				...d,
				[element]: array[i],
				[index]: i
			}, fetch))
		}
		content = content.replace(found[0], compiled.join('\n'));
	}

	// Evaluate whatever is left - Should come last: `{{ javascript }}`
	while(!!(found = /\{\{\s*([^<>\*\?!/}\s][^}]*?)\s*}}/g.exec(content))) {
		content = content.replace(found[0], evaluate(found[1].trim(), d) || '');
	}

	// Extends: `{{ > file.html:property }} CONTENT {{ /> }}`
	while(!!(found = /\{\{\s*?>\s*?(.+?):(.+?)\s*?}}([\s\S]*?)\{\{\s*?\/>\s*?}}/g.exec(content))) {
		content = content.replace(found[0], await renderTemplate(await fetch(found[1].trim), {
			...data,
			[found[2].trim()]: found[3],
		}, fetch));
	}

	return content;
}
