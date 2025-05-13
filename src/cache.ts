import {deepCopy} from './objects.ts';

export type CacheOptions = {
	/** Delete keys automatically after x amount of seconds */
	ttl?: number;
	/** Storage to persist cache */
	storage?: Storage;
	/** Key cache will be stored under */
	storageKey?: string;
	/** Keep or delete cached items once expired, defaults to delete */
	expiryPolicy?: 'delete' | 'keep';
}

export type CachedValue<T> = T & {_expired?: boolean};

/**
 * Map of data which tracks whether it is a complete collection & offers optional expiry of cached values
 */
export class Cache<K extends string | number | symbol, T> {
	private store: Record<K, T> = <any>{};

	/** Support index lookups */
	[key: string | number | symbol]: CachedValue<T> | any;
	/** Whether cache is complete */
	complete = false;

	/**
	 * Create new cache
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
				if(prop in target) return (target as any)[prop];
				return this.get(prop as K, true);
			},
			set: (target: this, prop: string | symbol, value: any) => {
				if(prop in target) (target as any)[prop] = value;
				else this.set(prop as K, value);
				return true;
			}
		});
	}

	private getKey(value: T): K {
		if(!this.key) throw new Error('No key defined');
		return <K>value[this.key];
	}

	private save() {
		if(this.options.storageKey && this.options.storage)
			this.options.storage.setItem(this.options.storageKey, JSON.stringify(this.store));
	}

	/**
	 * Get all cached items
	 * @return {T[]} Array of items
	 */
	all(expired?: boolean): CachedValue<T>[] {
		return deepCopy<any>(Object.values(this.store)
			.filter((v: any) => expired || !v._expired));
	}

	/**
	 * Add a new item to the cache. Like set, but finds key automatically
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
	 * @param {T[]} rows Several items that will be cached using the default key
	 * @param complete Mark cache as complete & reliable, defaults to true
	 * @return {this}
	 */
	addAll(rows: T[], complete = true): this {
		this.clear();
		rows.forEach(r => this.add(r));
		this.complete = complete;
		return this;
	}

	/**
	 * Remove all keys from cache
	 */
	clear() {
		this.complete = false;
		this.store = <any>{};
	}

	/**
	 * Delete an item from the cache
	 * @param {K} key Item's primary key
	 */
	delete(key: K) {
		delete this.store[key];
		this.save();
	}

	/**
	 * Return cache as an array of key-value pairs
	 * @return {[K, T][]} Key-value pairs array
	 */
	entries(expired?: boolean): [K, CachedValue<T>][] {
		return deepCopy<any>(Object.entries(this.store)
			.filter((v: any) => expired || !v?._expired));
	}

	/**
	 * Manually expire a cached item
	 * @param {K} key Key to expire
	 */
	expire(key: K) {
		this.complete = false;
		if(this.options.expiryPolicy == 'keep') (<any>this.store[key])._expired = true;
		else this.delete(key);
	}

	/**
	 * Get item from the cache
	 * @param {K} key Key to lookup
	 * @return {T} Cached item
	 */
	get(key: K, expired?: boolean): T | null {
		const cached = deepCopy<any>(this.store[key] ?? null);
		if(expired || !cached?._expired) return cached;
		return null;
	}

	/**
	 * Get a list of cached keys
	 * @return {K[]} Array of keys
	 */
	keys(expired?: boolean): K[] {
		return <K[]>Object.keys(this.store)
			.filter(k => expired || !(<any>this.store)[k]._expired);
	}

	/**
	 * Get map of cached items
	 * @return {Record<K, T>}
	 */
	map(expired?: boolean): Record<K, CachedValue<T>> {
		const copy: any = deepCopy(this.store);
		if(!expired) Object.keys(copy).forEach(k => {
			if(copy[k]._expired) delete copy[k]
		});
		return copy;
	}

	/**
	 * Add an item to the cache manually specifying the key
	 * @param {K} key Key item will be cached under
	 * @param {T} value Item to cache
	 * @param {number | undefined} ttl Override default expiry in seconds
	 * @return {this}
	 */
	set(key: K, value: T, ttl = this.options.ttl): this {
		if(this.options.expiryPolicy == 'keep') delete (<any>this.store[key])._expired;
		this.store[key] = value;
		this.save();
		if(ttl) setTimeout(() => {
			this.expire(key);
			this.save();
		}, ttl * 1000);
		return this;
	}

	/**
	 * Get all cached items
	 * @return {T[]} Array of items
	 */
	values = this.all();
}
