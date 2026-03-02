import {dec2Hex} from './math.ts';

/**
 * Determine if either black or white provides more contrast to the provided color
 * @param {string} color Color to compare against
 * @return {"white" | "black"} Color with the most contrast
 */
export function contrast(color: string): 'white' | 'black' {
	const exploded = color?.match(color.length >= 6 ? /[0-9a-fA-F]{2}/g : /[0-9a-fA-F]/g);
	if(!exploded || exploded?.length < 3) return 'black';
	const [r, g, b] = exploded.map(hex => parseInt(hex.length == 1 ? `${hex}${hex}` : hex, 16));
	const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
	return luminance > 0.5 ? 'black' : 'white';
}

export function hex2Int(hex: string): {r: number, g: number, b: number} {
	let r = 0, g = 0, b = 0;
	if (hex.length === 4) {
		r = parseInt(hex[1] + hex[1], 16);
		g = parseInt(hex[2] + hex[2], 16);
		b = parseInt(hex[3] + hex[3], 16);
	} else {
		r = parseInt(hex.slice(1, 3), 16);
		g = parseInt(hex.slice(3, 5), 16);
		b = parseInt(hex.slice(5, 7), 16);
	}
	return {r, g, b};
}

export function hue2rgb(p: number, q: number, t: number): number {
	if(t < 0) t += 1;
	if(t > 1) t -= 1;
	if(t < 1 / 6) return p + (q - p) * 6 * t;
	if(t < 1 / 2) return q;
	if(t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
	return p;
}

export function int2Hex(r: number, g: number, b: number) {
	return '#' + dec2Hex(r) + dec2Hex(g) + dec2Hex(b);
}

/**
 * Adjusts the darkness of a hex color.
 * @param {string} hex - The hex color (e.g., '#ff0000').
 * @param {number} amount - A value between -1 (black) and 1 (white)
 */
export function shadeColor(hex: string, amount: number) {
	let {r, g, b} = hex2Int(hex);
	r /= 255; g /= 255; b /= 255;
	const max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;

	if (max === min) {
		h = s = 0;
	} else {
		const d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			case b: h = (r - g) / d + 4; break;
			default: h = 0; break;
		}
		h /= 6;
	}

	// Adjust Lightness
	l = Math.max(0, Math.min(1, l + amount));
	const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
	const p = 2 * l - q;
	return int2Hex(hue2rgb(p, q, h + 1/3), hue2rgb(p, q, h), hue2rgb(p, q, h - 1/3));
};
