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
 * @param {string} content
 * @returns {{meta: any, content: string} | {meta: {}, content: string}}
 */
export function parseMarkdown(content: string) {
	const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
	if(!match) return {meta: {}, content};

	const meta: any = {};
	for (const line of match[1].split('\n')) {
		const colonIdx = line.indexOf(':');
		if (colonIdx === -1) continue;
		const key   = line.slice(0, colonIdx).trim();
		const value = line.slice(colonIdx + 1).trim();
		try { meta[key] = JSON.parse(value); } catch { meta[key] = value; }
	}
	return {meta, content: match[2].trim()};
}
