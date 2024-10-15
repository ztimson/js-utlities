export type CacheOptions = {
	/** Delete keys automatically after x amount of seconds */
	ttl?: number;
	/** Storage to persist cache */
	storage?: Storage;
	/** Key cache will be stored under */
	storageKey?: string;
}

/**
 * Map of data which tracks whether it is a complete collection & offers optional expiry of cached values
 */
export class Cache<K extends string | number | symbol, T> {
	private store = <Record<K, T>>{};

	/** Support index lookups */
	[key: string | number | symbol]: T | any;
	/** Whether cache is complete */
	complete = false;

	/**
	 * Create new cache
	 *
	 * @param {keyof T} key Default property to use as primary key
	 * @param options
	 */
	constructor(public readonly key?: keyof T, public readonly options: CacheOptions = {}) {
		if(options.storageKey && !options.storage && typeof(Storage) !== 'undefined')
			options.storage = localStorage;
		if(options.storageKey && options.storage) {
			const stored = options.storage.getItem(options.storageKey);
			if(stored) {
				try { Object.assign(this.store, JSON.parse(stored)); }
				catch { }
			}
		}
		return new Proxy(this, {
			get: (target: this, prop: string | symbol) => {
				if (prop in target) return (target as any)[prop];
				return target.store[prop as K];
			},
			set: (target: this, prop: string | symbol, value: any) => {
				if (prop in target) (target as any)[prop] = value;
				else target.store[prop as K] = value;
				return true;
			}
		});
	}

	private getKey(value: T): K {
		if(!this.key) throw new Error('No key defined');
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
	 * Remove all keys from cache
	 */
	clear() {
		this.store = <Record<K, T>>{};
	}

	/**
	 * Delete an item from the cache
	 *
	 * @param {K} key Item's primary key
	 */
	delete(key: K) {
		delete this.store[key];
		if(this.options.storageKey && this.options.storage)
			this.options.storage.setItem(this.options.storageKey, JSON.stringify(this.store));
	}

	/**
	 * Return cache as an array of key-value pairs
	 * @return {[K, T][]} Key-value pairs array
	 */
	entries(): [K, T][] {
		return <[K, T][]>Object.entries(this.store);
	}

	/**
	 * Get item from the cache
	 * @param {K} key Key to lookup
	 * @return {T} Cached item
	 */
	get(key: K): T {
		return this.store[key];
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
	 * Get map of cached items
	 *
	 * @return {Record<K, T>}
	 */
	map(): Record<K, T> {
		return structuredClone(this.store);
	}

	/**
	 * Add an item to the cache manually specifying the key
	 *
	 * @param {K} key Key item will be cached under
	 * @param {T} value Item to cache
	 * @param {number | undefined} ttl Override default expiry in seconds
	 * @return {this}
	 */
	set(key: K, value: T, ttl = this.options.ttl): this {
		this.store[key] = value;
		if(this.options.storageKey && this.options.storage)
			this.options.storage.setItem(this.options.storageKey, JSON.stringify(this.store));
		if(ttl) setTimeout(() => {
			this.complete = false;
			this.delete(key);
		}, ttl * 1000);
		return this;
	}

	/**
	 * Get all cached items
	 *
	 * @return {T[]} Array of items
	 */
	values = this.all();
}
