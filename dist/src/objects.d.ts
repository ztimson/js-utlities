/**
 *  Removes any null values from an object in-place
 *
 * @example
 * ```ts
 * let test = {a: 0, b: false, c: null, d: 'abc'}
 * console.log(clean(test)); // Output: {a: 0, b: false, d: 'abc'}
 * ```
 *
 * @param {T} obj Object reference that will be cleaned
 * @returns {Partial<T>} Cleaned object
 */
export declare function clean<T>(obj: T, includeNull?: boolean): Partial<T>;
/**
 * Create a deep copy of an object (vs. a shallow copy of references)
 *
 * Should be replaced by `structuredClone` once released.
 *
 * @param {T} value Object to copy
 * @returns {T} Type
 */
export declare function deepCopy<T>(value: T): T;
/**
 * Get/set a property of an object using dot notation
 *
 * @example
 * ```ts
 * // Get a value
 * const name = dotNotation<string>(person, 'firstName');
 * const familyCarMake = dotNotation(family, 'cars[0].make');
 * // Set a value
 * dotNotation(family, 'cars[0].make', 'toyota');
 * ```
 *
 * @type T Return type
 * @param {Object} obj source object to search
 * @param {string} prop property name (Dot notation & indexing allowed)
 * @param {any} set  Set object property to value, omit to fetch value instead
 * @return {T} property value
 */
export declare function dotNotation<T>(obj: any, prop: string, set: T): T;
export declare function dotNotation<T>(obj: any, prop: string): T | undefined;
/**
 * Check that an object has the following values
 *
 * @example
 * ```ts
 * const test = {a: 2, b: 2};
 * includes(test, {a: 1}); // true
 * includes(test, {b: 1, c: 3}); // false
 * ```
 *
 * @param target Object to search
 * @param values Criteria to check against
 * @param allowMissing Only check the keys that are available on the target
 * @returns {boolean} Does target include all the values
 */
export declare function includes(target: any, values: any, allowMissing?: boolean): boolean;
/**
 * Deep check if two objects are equal
 *
 * @param {any} a - first item to compare
 * @param {any} b - second item to compare
 * @returns {boolean} True if they match
 */
export declare function isEqual(a: any, b: any): boolean;
//# sourceMappingURL=objects.d.ts.map