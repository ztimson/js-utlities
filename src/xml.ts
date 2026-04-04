/**
 * Parses an XML string into a structured JavaScript object.
 * @param {string} xml - The XML string to parse
 * @returns {Object} An object with `tag`, `attributes`, and `children` properties
 */
export function fromXml(xml: string) {
	xml = xml.trim();
	let pos = 0;

	function parseNode(): any {
		skipWhitespace();
		if(xml[pos] !== '<') return parseText();
		pos++; // skip <

		if(xml[pos] === '?') {
			parseDeclaration();
			return parseNode();
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
			return { tag: tagName, attributes, children: [] };
		}

		pos++; // skip >
		const children = [];
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
			if(child) children.push(child);
		}
		return { tag: tagName, attributes, children };
	}

	/** Parses and returns the tag name at the current position */
	function parseTagName() {
		let name = '';
		while (pos < xml.length && /[a-zA-Z0-9_:-]/.test(xml[pos])) name += xml[pos++];
		return name;
	}

	/** Parses and returns an object containing all attributes at the current position */
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

	/** Parses and returns text content, or null if empty */
	function parseText() {
		let text = '';
		while (pos < xml.length && xml[pos] !== '<') text += xml[pos++];
		text = text.trim();
		return text ? escapeXml(text, true) : null;
	}

	/** Skips over XML declaration (<?xml ... ?>) */
	function parseDeclaration() {
		while (xml[pos] !== '>') pos++;
		pos++;
	}

	/** Skips over XML comments (<!-- ... -->) */
	function parseComment() {
		while (!(xml[pos] === '-' && xml[pos + 1] === '-' && xml[pos + 2] === '>')) pos++;
		pos += 3;
	}

	/** Advances position past any whitespace characters */
	function skipWhitespace() {
		while (pos < xml.length && /\s/.test(xml[pos])) pos++;
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
