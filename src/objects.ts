export type Delta = { [key: string]: any | Delta | null };

/**
 * Applies deltas in order to modify `target`.
 * @param target - Object to mutate
 * @param deltas - List of deltas to apply
 * @returns Mutated target
 */
export function applyDeltas(target: any, deltas: Delta[]): any {
	for(const delta of deltas) {
		for(const [key, value] of Object.entries(delta)) {
			if(value === null) {
				delete target[key]; // remove
			} else if(typeof value === 'object' && !Array.isArray(value)) {
				if(typeof target[key] !== 'object' || Array.isArray(target[key])) {
					target[key] = {}; // nested obj
				}
				applyDeltas(target[key], [value]); // recurse
			} else {
				target[key] = value; // restore
			}
		}
	}
	return target;
}

/**
 * Creates a nested delta that reverts `target` back to `old`.
 * @param old - Original object
 * @param target - Modified object
 * @returns Delta to revert changes
 */
export function calcDelta(old: any, target: any): Delta {
	const delta: Delta = {};
	const keys = new Set([...Object.keys(old || {}), ...Object.keys(target || {})]);
	for(const key of keys) {
		const val1 = old?.[key];
		const val2 = target?.[key];
		if(!(key in target)) {
			delta[key] = val1; // removed
		} else if(!(key in old)) {
			delta[key] = null; // added
		} else if(
			typeof val1 === 'object' && typeof val2 === 'object' &&
			val1 && val2 && !Array.isArray(val1)
		) {
			const nested = calcDelta(val1, val2);
			if(Object.keys(nested).length) delta[key] = nested;
		} else if(val1 !== val2) {
			delta[key] = val1; // changed
		}
	}
	return delta;
}

/**
 * Removes any null values from an object in-place
 *
 * @example
 * ```ts
 * let test = {a: 0, b: false, c: null, d: 'abc'}
 * console.log(clean(test)); // Output: {a: 0, b: false, d: 'abc'}
 * ```
 *
 * @param {T} obj Object reference that will be cleaned
 * @param undefinedOnly Ignore null values
 * @returns {Partial<T>} Cleaned object
 */
export function clean<T>(obj: T, undefinedOnly = false): Partial<T> {
	if(obj == null) throw new Error("Cannot clean a NULL value");
	if(Array.isArray(obj)) {
		obj = <any>obj.filter(o => undefinedOnly ? o !== undefined : o != null);
	} else {
		Object.entries(obj).forEach(([key, value]) => {
			if((undefinedOnly && value === undefined) || (!undefinedOnly && value == null)) delete (<any>obj)[key];
		});
	}
	return <any>obj;
}

/**
 * Create a deep copy of an object (vs. a shallow copy of references)
 *
 * Should be replaced by `structuredClone` once released.
 * @param {T} value Object to copy
 * @returns {T} Type
 */
export function deepCopy<T>(value: T): T {
	try {return structuredClone(value); }
	catch { return JSON.parse(JSONSanitize(value)); }
}

/**
 * Merge any number of objects into the target
 *
 * @param target Destination of all properties
 * @param sources Objects that will copied into target
 * @return {any} The des
 */
export function deepMerge<T>(target: any, ...sources: any[]): T {
	sources.forEach(s => {
		for(const key in s) {
			if(s[key] && typeof s[key] == 'object' && !Array.isArray(s[key])) {
				if(!target[key]) target[key] = {};
				deepMerge(target[key], s[key]);
			} else {
				target[key] = s[key];
			}
		}
	});
	return target;
}

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
export function dotNotation<T>(obj: any, prop: string, set: T): T;
export function dotNotation<T>(obj: any, prop: string): T | undefined;
export function dotNotation<T>(obj: any, prop: string, set?: T): T | undefined {
	if(obj == null || !prop) return undefined;
	// Split property string by '.' or [index]
	return <T>prop.split(/[.[\]]/g).filter(prop => prop.length).reduce((obj, prop,  i, arr) => {
		if(prop[0] == '"' || prop[0] == "'") prop = prop.slice(1, -1); // Take quotes out
		if(!obj?.hasOwnProperty(prop)) {
			if(set == undefined) return undefined;
			obj[prop] = {};
		}
		if(set !== undefined && i == arr.length - 1)
			return obj[prop] = set;
		return obj[prop];
	}, obj);
}

/**
 * Convert object into URL encoded query string
 *
 * @example
 * ```js
 * const query = encodeQuery({page: 1, size: 20});
 * console.log(query); // Output: "page=1&size=20"
 * ```
 *
 * @param {any} data - data to convert
 * @returns {string} - Encoded form data
 */
export function encodeQuery(data: any): string {
	return Object.entries(data).map(([key, value]) =>
		encodeURIComponent(key) + '=' + encodeURIComponent(<any>value)
	).join('&');
}

/**
 * Recursively flatten a nested object, while maintaining key structure
 *
 * @example
 * ```ts
 * const car = {honda: {model: "Civic"}};
 * console.log(flattenObj(car)); //Output {honda.model: "Civic"}
 * ```
 *
 * @param obj - Object to flatten
 * @param parent - Recursively check if key is a parent key or not
 * @param result - Result
 * @returns {object} - Flattened object
 */
export function flattenObj(obj: any, parent?: any, result: any = {}) {
	if(typeof obj === "object" && !Array.isArray(obj)) {
		for(const key of Object.keys(obj)) {
			const propName = parent ? `${parent}.${key}` : key;
			if(typeof obj[key] === 'object' && obj[key] != null && !Array.isArray(obj[key])) {
				flattenObj(obj[key], propName, result);
			} else {
				result[propName] = obj[key];
			}
		}
		return result;
	}
}

/**
 * Convert object to FormData
 *
 * @param target - Object to convert
 * @return {FormData} - Form object
 */
export function formData(target: any): FormData {
	const data = new FormData();
	Object.entries(target).forEach(([key, value]) => data.append(key, <any>value));
	return data;
}

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
export function includes(target: any, values: any, allowMissing = false): boolean {
	if(target == undefined) return allowMissing;
	if(Array.isArray(values)) return values.findIndex((e: any, i: number) => !includes(target[i], values[i], allowMissing)) == -1;
	const type = typeof values;
	if(type != typeof target) return false;
	if(type == 'object') {
		return Object.keys(values).find(key => !includes(target[key], values[key], allowMissing)) == null;
	}
	if(type == 'function') return target.toString() == values.toString();
	return target == values;
}

/**
 * Deep check if two items are equal.
 * Handles primitives, objects, arrays, functions, Date, RegExp, and circular references.
 *
 * @param {any} a - first item to compare
 * @param {any} b - second item to compare
 * @param {WeakMap<object, object>} [seen] - Internal parameter to track circular references
 * @returns {boolean} True if they match
 */
export function isEqual(a: any, b: any, seen = new WeakMap<object, object>()): boolean {
	// Simple cases
	if(a === b) return true;
	if(a instanceof Date && b instanceof Date) return a.getTime() === b.getTime();
	if(a instanceof RegExp && b instanceof RegExp) return a.source === b.source && a.flags === b.flags;

	// Null checks
	if(typeof a !== 'object' || a === null || typeof b !== 'object' || b === null) {
		if(Number.isNaN(a) && Number.isNaN(b)) return true;
		if(typeof a === 'function' && typeof b === 'function') return a.toString() === b.toString()
		return false;
	}

	// Circular references
	if(seen.has(a)) return seen.get(a) === b;
	seen.set(a, b);
	const isArrayA = Array.isArray(a);
	const isArrayB = Array.isArray(b);

	// Array checks
	if(isArrayA && isArrayB) {
		if(a.length !== b.length) return false;
		for(let i = 0; i < a.length; i++) {
			if(!isEqual(a[i], b[i], seen)) return false;
		}
		return true;
	}
	if(isArrayA !== isArrayB) return false;

	// Key & value deep comparison
	const keysA = Object.keys(a);
	const keysB = Object.keys(b);
	if(keysA.length !== keysB.length) return false;
	for(const key of keysA) {
		if(!Object.prototype.hasOwnProperty.call(b, key) || !isEqual(a[key], b[key], seen)) return false;
	}
	return true;
}

/**
 * Experimental: Combine multiple object prototypes into one
 *
 * @param target Object that will have prototypes added
 * @param {any[]} constructors Additionally prototypes that should be merged into target
 */
export function mixin(target: any, constructors: any[]) {
	constructors.forEach(c => {
		Object.getOwnPropertyNames(c.prototype).forEach((name) => {
			Object.defineProperty(
				target.prototype,
				name,
				Object.getOwnPropertyDescriptor(c.prototype, name) ||
				Object.create(null)
			);
		});
	});
}

/**
 * Parse JSON but return the original string if it fails
 *
 * @param {any} json JSON string to parse
 * @return {string | T} Object if successful, original string otherwise
 */
export function JSONAttemptParse<T1, T2>(json: T2): T1 | T2 {
	try { return JSON.parse(<any>json); }
	catch { return json; }
}

/**
 * Stringifies objects & skips primitives
 *
 * @param {any} obj Object to convert to serializable value
 * @return {string | T} Serialized value
 */
export function JSONSerialize<T1>(obj: T1): T1 | string {
	if(typeof obj == 'object' && obj != null) return JSONSanitize(obj);
	return obj;
}

/**
 * Convert an object to a JSON string avoiding any circular references.
 *
 * @param obj Object to convert to JSON
 * @param {number} space Format the JSON with spaces
 * @return {string} JSON string
 */
export function JSONSanitize(obj: any, space?: number): string {
	const cache: any[] = [];
	return JSON.stringify(obj, (key, value) => {
		if (typeof value === 'object' && value !== null) {
			if (cache.includes(value)) return '[Circular]';
			cache.push(value);
		}
		return value;
	}, space);
}
