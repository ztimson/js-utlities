export declare function countChars(text: string, pattern: RegExp): number;
export declare function createHex(length: number): string;
export declare function formatPhoneNumber(number: string): string;
/**
 * Insert a string into another string at a given position
 *
 * @example
 * ```
 * console.log(insertAt('Hello world!', ' glorious', 5);
 * // Output: Hello glorious world!
 * ```
 *
 * @param {string} target - Parent string you want to modify
 * @param {string} str - Value that will be injected to parent
 * @param {number} index - Position to inject string at
 * @returns {string} - New string
 */
export declare function insertAt(target: string, str: string, index: number): String;
/**
 * Generate a string of random characters.
 *
 * @example
 * ```ts
 * const random = randomString();
 * const randomByte = randomString(8, "01")
 * ```
 *
 * @param {number} length - length of generated string
 * @param {string} pool - character pool to generate string from
 * @return {string} generated string
 */
export declare function randomString(length: number, pool?: string): string;
/**
 * Generate a random string with fine control over letters, numbers & symbols
 *
 * @example
 * ```ts
 * const randomLetter = randomString(1, true);
 * const randomChar = randomString(1, true, true, true);
 * ```
 *
 * @param {number} length - length of generated string
 * @param {boolean} letters - Add letters to pool
 * @param {boolean} numbers - Add numbers to pool
 * @param {boolean} symbols - Add symbols to pool
 * @return {string} generated string
 */
export declare function randomStringBuilder(length: number, letters?: boolean, numbers?: boolean, symbols?: boolean): string;
/**
 * Find all substrings that match a given pattern.
 *
 * Roughly based on `String.prototype.matchAll`.
 *
 * @param {string} value - String to search.
 * @param {RegExp | string} regex - Regular expression to match.
 * @return {RegExpExecArray[]} Found matches.
 */
export declare function matchAll(value: string, regex: RegExp | string): RegExpExecArray[];
/**
 * Create MD5 hash using native javascript
 * @param d String to hash
 * @returns {string} Hashed string
 */
export declare function md5(d: any): string;
/**
 * Check if email is valid
 *
 * @param {string} email - Target
 * @returns {boolean} - Follows format
 */
export declare function validateEmail(email: string): boolean;
//# sourceMappingURL=string.d.ts.map