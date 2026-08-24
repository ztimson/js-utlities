/**
 * Parses an XML string into a plain JavaScript object.
 * Each tag becomes a key. Attributes and child tags are merged as
 * sibling properties on that tag's object. Duplicate tag/attribute
 * names are collapsed into arrays. Text-only tags resolve to their
 * (optionally numeric) value; if a tag has both text and attributes/
 * children, the text is kept under a `_text` key.
 * @param {string} xml - The XML string to parse
 * @returns {Object} The parsed object tree
 */
export function fromXml(xml: string) {
	xml = xml.trim();
	let pos = 0;

	function parseNode(): any {
		skipWhitespace();
		if(xml[pos] !== '<') return parseText();
		pos++; // skip <

		if(xml[pos] === '?') {
			const declaration = parseDeclaration();
			return { ['?' + declaration]: '', ...parseNode() };
		}

		if(xml[pos] === '!') {
			parseComment();
			return parseNode();
		}

		const tagName = parseTagName();
		const attributes = parseAttributes();
		skipWhitespace();

		if(xml[pos] === '/' && xml[pos + 1] === '>') {
			pos += 2; // skip />
			return { [tagName]: Object.keys(attributes).length ? attributes : '' };
		}

		pos++; // skip >
		const children: any[] = Object.entries(attributes).map(([k, v]) => ({ [k]: v }));
		let textContent = '';

		while(pos < xml.length) {
			skipWhitespace();
			if(xml[pos] === '<' && xml[pos + 1] === '/') {
				pos += 2; // skip </
				parseTagName(); // skip closing tag name
				skipWhitespace();
				pos++; // skip >
				break;
			}
			const child = parseNode();
			if(typeof child === 'string') {
				textContent += child;
			} else if(child) {
				children.push(child);
			}
		}

		// If only text content, return simple value
		if(children.length === 0 && textContent) {
			const value = isNumeric(textContent) ? Number(textContent) : textContent;
			return { [tagName]: value };
		}

		// If nothing at all
		if(children.length === 0) {
			return { [tagName]: '' };
		}

		// Merge attributes/children into object
		const result: any = {};
		if(textContent) result._text = isNumeric(textContent) ? Number(textContent) : textContent;
		for(const child of children) {
			for(const [key, value] of Object.entries(child)) {
				if(result[key]) {
					// Convert to array if duplicate tags/attrs
					if(!Array.isArray(result[key])) {
						result[key] = [result[key]];
					}
					result[key].push(value);
				} else {
					result[key] = value;
				}
			}
		}

		return { [tagName]: result };
	}

	function parseTagName() {
		let name = '';
		while (pos < xml.length && /[a-zA-Z0-9_:-]/.test(xml[pos])) name += xml[pos++];
		return name;
	}

	function parseAttributes() {
		const attrs: any = {};
		while (pos < xml.length) {
			skipWhitespace();
			if (xml[pos] === '>' || xml[pos] === '/') break;
			const name = parseTagName();
			skipWhitespace();
			if (xml[pos] === '=') {
				pos++;
				skipWhitespace();
				const quote = xml[pos++];
				let value = '';
				while (xml[pos] !== quote) value += xml[pos++];
				pos++; // skip closing quote
				attrs[name] = escapeXml(value, true);
			}
		}
		return attrs;
	}

	function parseText() {
		let text = '';
		while (pos < xml.length && xml[pos] !== '<') text += xml[pos++];
		text = text.trim();
		return text ? escapeXml(text, true) : null;
	}

	function parseDeclaration() {
		pos++; // skip ?
		let name = '';
		while (pos < xml.length && xml[pos] !== ' ' && xml[pos] !== '?') {
			name += xml[pos++];
		}
		while (xml[pos] !== '>') pos++;
		pos++;
		return name;
	}

	function parseComment() {
		while (!(xml[pos] === '-' && xml[pos + 1] === '-' && xml[pos + 2] === '>')) pos++;
		pos += 3;
	}

	function skipWhitespace() {
		while (pos < xml.length && /\s/.test(xml[pos])) pos++;
	}

	function isNumeric(str: string) {
		return !isNaN(Number(str)) && !isNaN(parseFloat(str)) && str.trim() !== '';
	}

	return parseNode();
}

/**
 * Converts a JavaScript object into an XML string.
 * @param {Object} obj - Object with `tag`, `attributes`, and `children` properties, or a string
 * @param {string} indent - Current indentation level (used internally for formatting)
 * @returns {string} The formatted XML string
 */
export function toXml(obj: any, indent = '') {
	if(typeof obj === 'string') return escapeXml(obj);
	const { tag, attributes = {}, children = [] } = obj;
	let xml = `${indent}<${tag}`;
	for (const [key, value] of Object.entries(attributes))
		xml += ` ${key}="${escapeXml(<any>value)}"`;
	if (children.length === 0) {
		xml += ' />';
		return xml;
	}
	xml += '>';
	const hasComplexChildren = children.some((c: any) => typeof c === 'object');
	for (const child of children) {
		if (hasComplexChildren) xml += '\n';
		xml += toXml(child, hasComplexChildren ? indent + '  ' : '');
	}
	if(hasComplexChildren) xml += `\n${indent}`;
	xml += `</${tag}>`;
	return xml;
}

/**
 * Escapes or unescapes XML special characters.
 * @param {string} str - The string to process
 * @param {boolean} decode - If true, decodes XML entities; if false, encodes special characters
 * @returns {string} The processed string
 */
export function escapeXml(str: string, decode = false) {
	if(decode) {
		return str
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&apos;/g, "'")
			.replace(/&amp;/g, '&');
	}
	return str
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}
