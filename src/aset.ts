import {isEqual} from './objects.ts';

/**
 * An array which functions as a set. It guarantees unique elements
 * and provides set functions for comparisons
 */
export class ASet<T> extends Array {
	/** Number of elements in set */
	get size() {
		return this.length;
	}

	/**
	 * Array to create set from, duplicate values will be removed
	 * @param {T[]} elements Elements which will be added to set
	 */
	constructor(elements: T[] = []) {
		super();
		if(!!elements?.['forEach'])
			elements.forEach(el => this.add(el));
	}

	/**
	 * Add elements to set if unique
	 * @param items
	 */
	add(...items: T[]) {
		items.filter(el => !this.has(el)).forEach(el => this.push(el));
		return this;
	}

	/**
	 * Delete elements from set
	 * @param items Elements that will be deleted
	 */
	delete(...items: T[]) {
		items.forEach(el => {
			const index = this.indexOf(el);
			if(index != -1) this.splice(index, 1);
		})
		return this;
	}

	/**
	 * Create list of elements this set has which the comparison set does not
	 * @param {ASet<T>} set Set to compare against
	 * @return {ASet<T>} Different elements
	 */
	difference(set: ASet<T>) {
		return new ASet<T>(this.filter(el => !set.has(el)));
	}

	/**
	 * Check if set includes element
	 * @param {T} el Element to look for
	 * @return {boolean} True if element was found, false otherwise
	 */
	has(el: T) {
		return this.indexOf(el) != -1;
	}

	/**
	 * Find index number of element, or -1 if it doesn't exist. Matches by equality not reference
	 *
	 * @param {T} search Element to find
	 * @param {number} fromIndex Starting index position
	 * @return {number} Element index number or -1 if missing
	 */
	indexOf(search: T, fromIndex?: number): number {
		return super.findIndex((el: T) => isEqual(el, search), fromIndex);
	}

	/**
	 * Create list of elements this set has in common with the comparison set
	 * @param {ASet<T>} set Set to compare against
	 * @return {boolean} Set of common elements
	 */
	intersection(set: ASet<T>) {
		return new ASet<T>(this.filter(el => set.has(el)));
	}

	/**
	 * Check if this set has no elements in common with the comparison set
	 * @param {ASet<T>} set Set to compare against
	 * @return {boolean} True if nothing in common, false otherwise
	 */
	isDisjointFrom(set: ASet<T>) {
		return this.intersection(set).size == 0;
	}

	/**
	 * Check if all elements in this set are included in the comparison set
	 * @param {ASet<T>} set Set to compare against
	 * @return {boolean} True if all elements are included, false otherwise
	 */
	isSubsetOf(set: ASet<T>) {
		return this.findIndex(el => !set.has(el)) == -1;
	}

	/**
	 * Check if all elements from comparison set are included in this set
	 * @param {ASet<T>} set Set to compare against
	 * @return {boolean} True if all elements are included, false otherwise
	 */
	isSuperset(set: ASet<T>) {
		return set.findIndex(el => !this.has(el)) == -1;
	}

	/**
	 * Create list of elements that are only in one set but not both (XOR)
	 * @param {ASet<T>} set Set to compare against
	 * @return {ASet<T>} New set of unique elements
	 */
	symmetricDifference(set: ASet<T>) {
		return new ASet([...this.difference(set), ...set.difference(this)]);
	}

	/**
	 * Create joined list of elements included in this & the comparison set
	 * @param {ASet<T>} set Set join
	 * @return {ASet<T>} New set of both previous sets combined
	 */
	union(set: ASet<T> | Array<T>) {
		return new ASet([...this, ...set]);
	}
}
