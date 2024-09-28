/**
 * Map of data which tracks whether it is a complete collection & offers optional expiry of cached values
 */
export class Cache<K, T> extends Map<K, T> {

	/** Whether cache is complete */
	complete = false;

	/**
	 * Create new cache
	 *
	 * @param {keyof T} key Default property to use as primary key
	 * @param {number} ttl Default expiry in milliseconds
	 */
	constructor(public readonly key: keyof T, public ttl?: number) {
		super();
	}

	private getKey(value: T): K {
		return <K>value[this.key];
	}

	/**
	 * Get all cached items
	 *
	 * @return {T[]} Array of items
	 */
	all() {
		return Array.from(this.values());
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
	 * Add an item to the cache manually specifying the key
	 * @param {K} key Key item will be cached under
	 * @param {T} value Item to cache
	 * @param {number | undefined} ttl Override default expiry
	 * @return {this}
	 */
	set(key: K, value: T, ttl = this.ttl): this {
		super.set(key, value);
		if(ttl) setTimeout(() => {
			this.complete = false;
			super.delete(key)
		}, ttl);
		return this;
	}
}
