/**
 * Determine if either black or white provides more contrast to the provided color
 * @param {string} background Color to compare against
 * @return {"white" | "black"} Color with the most contrast
 */
export function blackOrWhite(background: string): 'white' | 'black' {
	const exploded = background?.match(background.length >= 6 ? /\w\w/g : /\w/g);
	if(!exploded) return 'black';
	const [r, g, b] = exploded.map(hex => parseInt(hex, 16));
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5 ? 'black' : 'white';
}
