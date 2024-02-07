/**
 * Convert data into a form encoded format.
 *
 * @param {any} data - data to convert
 * @returns {string} - Ecodeded form data
 */
export declare function formEncode(data: any): string;
/**
 * Get profile image from Gravatar
 *
 * @param {string} email Account email address
 * @returns {string} Gravatar URL
 */
export declare function gravatar(email: string): string;
/** Parts of a URL */
export type ParsedUrl = {
    protocol?: string;
    subdomain?: string;
    domain: string;
    host: string;
    port?: number;
    path?: string;
    query?: {
        [name: string]: string;
    };
    fragment?: string;
};
/**
 *
 * @param {string} url
 * @returns {RegExpExecArray}
 */
export declare function urlParser(url: string): ParsedUrl;
//# sourceMappingURL=misc.d.ts.map