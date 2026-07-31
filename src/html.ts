/**
 * Decode HTML escaped characters
 * @param html HTML to clean up
 * @returns {any}
 */
export function decodeHtml(html: string) {
	return html
		.replace(/&nbsp;/g, '\u00A0')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&cent;/g, '¢')
		.replace(/&pound;/g, '£')
		.replace(/&yen;/g, '¥')
		.replace(/&euro;/g, '€')
		.replace(/&copy;/g, '©')
		.replace(/&reg;/g, '®')
		.replace(/&trade;/g, '™')
		.replace(/&times;/g, '×')
		.replace(/&divide;/g, '÷')
		.replace(/&#(\d+);/g, (match, dec) => String.fromCharCode(dec))
		.replace(/&#x([0-9a-fA-F]+);/g, (match, hex) => String.fromCharCode(parseInt(hex, 16)))
		.replace(/&amp;/g, '&'); // Always last!
}

/**
 * Parse markdown headers
 *
 * **NOTE: frontmatter parsing only works 2 layers deep**
 *
 * @param {string} content
 * @returns {{meta: any, content: string} | {meta: {}, content: string}}
 */
export function parseMarkdown(content: string) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if (!match) return {meta: {}, content};

	const meta: any = {};
	let currentParent: string | null = null;

	for (const rawLine of match[1].split('\n')) {
		if (!rawLine.trim()) continue;
		const indented = /^\s+/.test(rawLine);
		const line = rawLine.trim();
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;

		const key = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trim();

		let parsed: any = value;
		try { parsed = JSON.parse(value); } catch {}

		if (!indented) {
			currentParent = value === '' ? key : null;
			if (value === '') meta[key] = {};
			else meta[key] = parsed;
		} else if (currentParent) {
			meta[currentParent][key] = parsed;
		}
	}

	return {meta, content: match[2].trim()};
}
