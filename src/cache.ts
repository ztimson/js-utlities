/**
 * Map of data which tracks whether it is a complete collection & offers optional expiry of cached values
 */
export class Cache<K, T> {
	private store: any = {};

	/** Whether cache is complete */
	complete = false;

	/**
	 * Create new cache
	 *
	 * @param {keyof T} key Default property to use as primary key
	 * @param {number} ttl Default expiry in milliseconds
	 */
	constructor(public readonly key: keyof T, public ttl?: number) { }

	private getKey(value: T): K {
		return <K>value[this.key];
	}

	/**
	 * Get all cached items
	 *
	 * @return {T[]} Array of items
	 */
	all(): T[] {
		return Object.values(this.store);
	}

	/**
	 * Add a new item to the cache. Like set, but finds key automatically
	 *
	 * @param {T} value Item to add to cache
	 * @param {number | undefined} ttl Override default expiry
	 * @return {this}
	 */
	add(value: T, ttl = this.ttl): this {
		const key = this.getKey(value);
		this.set(key, value, ttl);
		return this;
	}

	/**
	 * Add several rows to the cache
	 *
	 * @param {T[]} rows Several items that will be cached using the default key
	 * @param complete Mark cache as complete & reliable, defaults to true
	 * @return {this}
	 */
	addAll(rows: T[], complete = true): this {
		rows.forEach(r => this.add(r));
		this.complete = complete;
		return this;
	}

	/**
	 * Delete an item from the cache
	 *
	 * @param {K} key Item's primary key
	 */
	delete(key: K) {
		delete this.store[key];
	}

	/**
	 * Return cache as an array of key-value pairs
	 * @return {[K, T][]} Key-value pairs array
	 */
	entries(): [K, T][] {
		return <[K, T][]>Object.entries(this.store);
	}

	/**
	 * Get a list of cached keys
	 *
	 * @return {K[]} Array of keys
	 */
	keys(): K[] {
		return <K[]>Object.keys(this.store);
	}

	/**
	 * Add an item to the cache manually specifying the key
	 *
	 * @param {K} key Key item will be cached under
	 * @param {T} value Item to cache
	 * @param {number | undefined} ttl Override default expiry
	 * @return {this}
	 */
	set(key: K, value: T, ttl = this.ttl): this {
		this.store[key] = value;
		if(ttl) setTimeout(() => {
			this.complete = false;
			this.delete(key);
		}, ttl);
		return this;
	}

	/**
	 * Get all cached items
	 *
	 * @return {T[]} Array of items
	 */
	values = this.all();
}
