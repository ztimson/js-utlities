import {isEqual} from './objects.ts';

/**
 * An array which functions as a set. It guarantees unique elements
 * and provides set functions for comparisons.
 *
 * This optimized version uses a Map internally for efficient lookups
 * while maintaining an array for ordered iteration and array-like methods.
 */
export class ASet<T> extends Array<T> {
	private readonly _valueMap: Map<string, T>; // Stores string representation -> actual value for quick lookups

	/** Number of elements in set */
	get size(): number {
		return this.length;
	}

	/**
	 * Array to create set from, duplicate values will be removed
	 * @param {T[]} elements Elements which will be added to set
	 */
	constructor(elements: T[] = []) {
		super();
		this._valueMap = new Map<string, T>(); // Initialize the map

		if (Array.isArray(elements)) {
			elements.forEach(el => this.add(el));
		}
	}

	/**
	 * Helper to generate a unique key for the map.
	 * This is crucial for using a Map with custom equality.
	 * For primitive types, `String(el)` is often sufficient.
	 * For objects, you'll need a robust serialization or a unique ID.
	 * If isEqual handles deep equality, the key generation must reflect that.
	 *
	 * @param el Element to generate a key for
	 * @returns A string key
	 */
	private _getKey(el: T): string {
		// IMPORTANT: This is a critical point for isEqual to work correctly with Map.
		// If isEqual performs deep comparison, _getKey must produce the same string
		// for deeply equal objects. JSON.stringify can work for simple objects,
		// but can fail for objects with circular references, functions, or undefined values.
		// For more complex scenarios, consider a library like 'fast-json-stable-stringify'
		// or a custom hashing function that respects isEqual.
		try {
			return JSON.stringify(el);
		} catch (e) {
			// Fallback for objects that cannot be stringified (e.g., circular structures)
			// This might lead to less optimal performance or incorrect uniqueness for such objects.
			// A more robust solution for complex objects might involve unique object IDs
			// or a custom comparison function for Map keys if JS allowed it.
			return String(el);
		}
	}

	/**
	 * Add elements to set if unique.
	 * Optimized to use the internal Map for O(1) average time lookups.
	 * @param items
	 */
	add(...items: T[]): this {
		for (const item of items) {
			const key = this._getKey(item);
			if (!this._valueMap.has(key)) {
				// Also ensures isEqual is respected by checking against existing values
				let found = false;
				for (const existingItem of this) {
					if (isEqual(existingItem, item)) {
						found = true;
						break;
					}
				}

				if (!found) {
					super.push(item); // Add to the array
					this._valueMap.set(key, item); // Add to the map
				}
			}
		}
		return this;
	}

	/**
	 * Remove all elements.
	 * Optimized to clear both the array and the map.
	 */
	clear(): this {
		super.splice(0, this.length);
		this._valueMap.clear();
		return this;
	}

	/**
	 * Delete elements from set.
	 * Optimized to use the internal Map for O(1) average time lookups for key existence.
	 * Still requires array splice which can be O(N) in worst case for shifting.
	 * @param items Elements that will be deleted
	 */
	delete(...items: T[]): this {
		for (const item of items) {
			const key = this._getKey(item);
			if (this._valueMap.has(key)) {
				// Find the actual element in the array using isEqual
				const index = super.findIndex((el: T) => isEqual(el, item));
				if (index !== -1) {
					super.splice(index, 1); // Remove from the array
					this._valueMap.delete(key); // Remove from the map
				}
			}
		}
		return this;
	}

	/**
	 * Create list of elements this set has which the comparison set does not.
	 * Optimized to use `has` which is now faster.
	 * @param {ASet<T>} set Set to compare against
	 * @return {ASet<T>} Different elements
	 */
	difference(set: ASet<T>): ASet<T> {
		const result = new ASet<T>();
		for (const el of this) {
			if (!set.has(el)) {
				result.add(el);
			}
		}
		return result;
	}

	/**
	 * Check if set includes element.
	 * Optimized to use the internal Map for O(1) average time lookups.
	 * @param {T} el Element to look for
	 * @return {boolean} True if element was found, false otherwise
	 */
	has(el: T): boolean {
		const key = this._getKey(el);
		// First check map for existence. If it exists, then verify with isEqual
		// as the key might be generic but isEqual is precise.
		if (this._valueMap.has(key)) {
			const storedValue = this._valueMap.get(key);
			// This second check with isEqual is necessary if _getKey doesn't perfectly
			// represent the equality criteria of isEqual, which is often the case
			// for complex objects where JSON.stringify might produce different strings
			// for isEqual objects (e.g., key order in objects).
			// If _getKey is guaranteed to produce identical keys for isEqual objects,
			// this isEqual check can be simplified or removed for performance.
			return isEqual(storedValue, el);
		}
		return false;
	}

	/**
	 * Find index number of element, or -1 if it doesn't exist. Matches by equality not reference.
	 * This method still inherently needs to iterate the array to find the *index*.
	 * While `has` can be O(1), `indexOf` for custom equality remains O(N).
	 *
	 * @param {T} search Element to find
	 * @param {number} fromIndex Starting index position
	 * @return {number} Element index number or -1 if missing
	 */
	indexOf(search: T, fromIndex?: number): number {
		// Can't use the map directly for index lookup, must iterate the array
		return super.findIndex((el: T) => isEqual(el, search), fromIndex);
	}

	/**
	 * Create list of elements this set has in common with the comparison set.
	 * Optimized to use `has` which is now faster.
	 * @param {ASet<T>} set Set to compare against
	 * @return {ASet<T>} Set of common elements
	 */
	intersection(set: ASet<T>): ASet<T> {
		const result = new ASet<T>();
		// Iterate over the smaller set for efficiency
		const [smallerSet, largerSet] = this.size < set.size ? [this, set] : [set, this];

		for (const el of smallerSet) {
			if (largerSet.has(el)) {
				result.add(el);
			}
		}
		return result;
	}

	/**
	 * Check if this set has no elements in common with the comparison set.
	 * Optimized to use `intersection` and check its size.
	 * @param {ASet<T>} set Set to compare against
	 * @return {boolean} True if nothing in common, false otherwise
	 */
	isDisjointFrom(set: ASet<T>): boolean {
		return this.intersection(set).size === 0;
	}

	/**
	 * Check if all elements in this set are included in the comparison set.
	 * Optimized to use `has` which is now faster.
	 * @param {ASet<T>} set Set to compare against
	 * @return {boolean} True if all elements are included, false otherwise
	 */
	isSubsetOf(set: ASet<T>): boolean {
		if (this.size > set.size) { // A larger set cannot be a subset of a smaller one
			return false;
		}
		for (const el of this) {
			if (!set.has(el)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Check if all elements from comparison set are included in this set.
	 * Optimized to use `has` which is now faster.
	 * @param {ASet<T>} set Set to compare against
	 * @return {boolean} True if all elements are included, false otherwise
	 */
	isSuperset(set: ASet<T>): boolean {
		if (this.size < set.size) { // A smaller set cannot be a superset of a larger one
			return false;
		}
		for (const el of set) {
			if (!this.has(el)) {
				return false;
			}
		}
		return true;
	}

	/**
	 * Create list of elements that are only in one set but not both (XOR).
	 * Uses optimized `difference` method.
	 * @param {ASet<T>} set Set to compare against
	 * @return {ASet<T>} New set of unique elements
	 */
	symmetricDifference(set: ASet<T>): ASet<T> {
		return new ASet<T>([...this.difference(set), ...set.difference(this)]);
	}

	/**
	 * Create joined list of elements included in this & the comparison set.
	 * Uses optimized `add` method.
	 * @param {ASet<T> | Array<T>} set Set to join
	 * @return {ASet<T>} New set of both previous sets combined
	 */
	union(set: ASet<T> | Array<T>): ASet<T> {
		const result = new ASet<T>(this);
		result.add(...Array.from(set));
		return result;
	}
}
