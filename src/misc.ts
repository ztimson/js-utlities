import {md5} from './string';

/**
 * Convert data into a form encoded format.
 *
 * @param {any} data - data to convert
 * @returns {string} - Ecodeded form data
 */
export function formEncode(data: any): string {
	return Object.entries(data).map(([key, value]) =>
		encodeURIComponent(key) + '=' + encodeURIComponent(<any>value)
	).join('&');
}

/**
 * Get profile image from Gravatar
 *
 * @param {string} email Account email address
 * @returns {string} Gravatar URL
 */
export function gravatar(email: string) {
	if(!email) return '';
	return `https://www.gravatar.com/avatar/${md5(email)}`;
}

/** Parts of a URL */
export type ParsedUrl = {
	protocol?: string,
	subdomain?: string,
	domain: string,
	host: string,
	port?: number,
	path?: string,
	query?: {[name: string]: string}
	fragment?: string
}

/**
 *
 * @param {string} url
 * @returns {RegExpExecArray}
 */
export function urlParser(url: string): ParsedUrl {
	const processed = new RegExp(
		'(?:(?<protocol>[\\w\\d]+)\\:\\/\\/)?(?:(?<user>.+)\\@)?(?<host>(?<domain>[^:\\/\\?#@\\n]+)(?:\\:(?<port>\\d*))?)(?<path>\\/.*?)?(?:\\?(?<query>.*?))?(?:#(?<fragment>.*?))?$',
		'gm').exec(url);
	const groups: ParsedUrl = <any>processed?.groups ?? {};
	const domains = groups.domain.split('.');
	if(groups['port'] != null) groups.port = Number(groups.port);
	if(domains.length > 2) {
		groups.domain = domains.splice(-2, 2).join('.');
		groups.subdomain = domains.join('.');
	}
	if(groups.query) {
		const split = (<any>groups.query).split('&'), query = {};
		split.forEach(q => {
			const [key, val] = q.split('=');
			query[key] = val;
		});
		groups.query = query;
	}
	return groups;
}
