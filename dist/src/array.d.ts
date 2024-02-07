export declare function addUnique<T>(array: T[], el: T): T[];
export declare function arrayDiff(a: any[], b: any[]): any[];
/**
 * Provides a shorthand for sorting arrays of complex objects by a string property
 *
 * @example
 * ```ts
 * let arr = [{a: 'Apple', b: 123}, {a: 'Carrot', b: 789}, {a: 'banana', b: 456}];
 * arr.sort(caseInsensitiveSort('a'));
 * ```
 *
 * @param {string} prop - Name of property to use, supports dot notation
 * @returns {(a, b) => (number)} - Function to handle sort (Meant to be passed to Array.prototype.sort or used in sortFn)
 */
export declare function caseInsensitiveSort(prop: string): (a: any, b: any) => number;
/**
 * Recursively flatten nested arrays
 *
 * @example
 * ```ts
 * const arr = [
 *     {label: null, url: '/'},
 *     {label: 'Model Admin', url: '/model-admin'},
 *     [
 *       {label: 'Elements', url: '/model-admin/elements'},
 *       {label: 'Example', url: null}
 *     ]
 * ];
 *
 * console.log(flattenArr(arr));
 * // Output:
 * [
 *     {label: null, url: '/'},
 *     {label: 'Model Admin', url: '/model-admin'},
 *     {label: 'Elements', url: '/model-admin/elements'},
 *     {label: 'Example', url: null}
 * ]
 * ```
 *
 * @param {any[]} arr - n-dimensional array
 * @param {any[]} result - Internal use only -- Keeps track of recursion
 * @returns {any[]} - Flattened array
 */
export declare function flattenArr(arr: any[], result?: any[]): any[];
/**
 * Provides a shorthand for sorting arrays of complex objects
 *
 * @example
 * ```ts
 * let arr = [{a: {b: 2}}, {a: {b: 3}}, {a: {b: 1}}];
 * arr.sort(sortByProp('a.b'));
 * ```
 *
 * @param {string} prop - Name of property to use, supports dot notation
 * @param {boolean} reverse - Reverse the order of the sort
 * @returns {(a, b) => (number)} - Function to handle sort (Meant to be passed to Array.prototype.sort)
 */
export declare function sortByProp(prop: string, reverse?: boolean): (a: any, b: any) => number;
export declare function findByProp(prop: string, value: any): (v: any) => boolean;
export declare function makeUnique(arr: any[]): any[];
/**
 * Make sure value is an array, if it isn't wrap it in one.
 * @param {T[] | T} value Value that should be an array
 * @returns {T[]} Value in an array
 */
export declare function makeArray<T>(value: T | T[]): T[];
//# sourceMappingURL=array.d.ts.map