import {dotNotation, isEqual} from './objects';

/**
 * Only add element to array if it isn't already included
 *
 * @example
 * ```js
 * const arr = addUnique([1, 2, 3], 3);
 * console.log(arr); // Output: [1, 2, 3]
 * ```
 *
 * @param {T[]} array Target array element will be added to
 * @param {T} el Unique element to add
 * @return {T[]} Array with element if it was unique
 * @deprecated Use ASet to create unique arrays
 */
export function addUnique<T>(array: T[], el: T): T[] {
	if(array.indexOf(el) === -1) array.push(el);
	return array;
}

/**
 * Find all unique elements in arrays
 *
 * @param {any[]} a First array to compare
 * @param {any[]} b Second array to compare
 * @return {any[]} Unique elements
 * @deprecated Use ASet to perform Set operations on arrays
 */
export function arrayDiff(a: any[], b: any[]): any[] {
	return makeUnique([
		...a.filter(v1 => !b.includes((v2: any) => isEqual(v1, v2))),
		...b.filter(v1 => !a.includes((v2: any) => isEqual(v1, v2))),
	]);
}

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
export function caseInsensitiveSort(prop: string) {
	return function (a: any, b: any) {
		const aVal = dotNotation<string>(a, prop);
		const bVal = dotNotation<string>(b, prop);
		if(typeof aVal !== 'string' || typeof bVal !== 'string') return 1;
		return aVal.toLowerCase().localeCompare(bVal.toLowerCase());
	};
}

/**
 * Shorthand to find objects with a property value
 *
 * @example
 * ```js
 * const found = [
 *   {name: 'Batman'},
 *   {name: 'Superman'},
 * ].filter(findByProp('name', 'Batman'));
 * ```
 *
 * @param {string} prop Property to compare (Dot nation supported)
 * @param value Value property must have
 * @return {(v: any) => boolean} Function used by `filter` or `find`
 */
export function findByProp(prop: string, value: any) {
	return (v: any) => isEqual(dotNotation(v, prop), value);
}

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
export function flattenArr(arr: any[], result: any[] = []): any[] {
	arr.forEach(el => Array.isArray(el) ? flattenArr(el, result) : result.push(el));
	return result;
}

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
export function sortByProp(prop: string, reverse = false) {
	return function (a: any, b: any) {
		const aVal = dotNotation<any>(a, prop);
		const bVal = dotNotation<any>(b, prop);
		if(typeof aVal == 'number' && typeof bVal == 'number')
			return (reverse ? -1 : 1) * (aVal - bVal);
		if(aVal > bVal) return reverse ? -1 : 1;
		if(aVal < bVal) return reverse ? 1 : -1;
		return 0;
	};
}

/**
 * Make sure every element in array is unique
 *
 * @param {any[]} arr Array that will be filtered in place
 * @return {any[]} Original array
 * @deprecated Please use ASet to create a guaranteed unique array
 */
export function makeUnique(arr: any[]) {
	for(let i = arr.length - 1; i >= 0; i--) {
		if(arr.slice(0, i).find(n => isEqual(n, arr[i]))) arr.splice(i, 1);
	}
	return arr;
}

/**
 * Make sure value is an array, if it isn't wrap it in one
 *
 * @param {T[] | T} value Value that should be an array
 * @returns {T[]} Value in an array
 */
export function makeArray<T>(value: T | T[]): T[] {
	return Array.isArray(value) ? value : [value];
}
