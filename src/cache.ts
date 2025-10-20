import {Database, Table} from './database.ts';
import {JSONSanitize} from './json.ts';
import {deepCopy, includes} from './objects.ts';

export type CacheOptions = {
	/** Delete keys automatically after x amount of seconds */
	ttl?: number;
	/** Storage to persist cache */
	persistentStorage?: {storage: Storage | Database, key: string} | string;
	/** Keep or delete cached items once expired, defaults to delete */
	expiryPolicy?: 'delete' | 'keep';
	/** Least Recently Used size limit */
	sizeLimit?: number;
}

export type CachedValue<T> = T & {_expired?: boolean};

/**
 * Map of data which tracks whether it is a complete collection & offers optional expiry of cached values
 */
export class Cache<K extends string | number | symbol, T> {
	private _loading!: Function;
	private store: Map<K, T> = new Map();
	private timers: Map<K, NodeJS.Timeout> = new Map();
	private lruOrder: K[] = [];

	/** Support index lookups */
	[key: string | number | symbol]: CachedValue<T> | any;
	/** Whether cache is complete */
	complete = false;
	/** Await initial loading */
	loading = new Promise<void>(r => this._loading = r);

	/**
	 * Create new cache
	 * @param {keyof T} key Default property to use as primary key
	 * @param options
	 */
	constructor(public readonly key?: keyof T, public readonly options: CacheOptions = {}) {
		// Persistent storage
		if(this.options.persistentStorage != null) {
			if(typeof this.options.persistentStorage == 'string')
				this.options.persistentStorage = {storage: localStorage, key: this.options.persistentStorage};

			if(this.options.persistentStorage?.storage?.database != undefined) {
				(async () => {
					const persists: any = this.options.persistentStorage;
					const table: Table<any, any> = await persists.storage.createTable({name: persists.key, key: this.key});
					const rows = await table.getAll();
					for(const row of rows) this.store.set(this.getKey(row), row);
					this._loading();
				})();
			} else if((<any>this.options.persistentStorage?.storage)?.getItem != undefined) {
				const {storage, key} = <{storage: Storage, key: string}>this.options.persistentStorage;
				const stored = storage.getItem(key);
				if(stored != null) {
					try {
						const obj = JSON.parse(stored);
						for(const k of Object.keys(obj)) this.store.set(<any>k, obj[k]);
					} catch { /* ignore */ }
				}
				this._loading();
			}
		} else {
			this._loading();
		}

		// Handle index lookups
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
		if((value as any)[this.key] === undefined) throw new Error(`${this.key.toString()} Doesn't exist on ${JSON.stringify(value, null, 2)}`);
		return <K>(value as any)[this.key];
	}

	private save(key?: K) {
		const persists: {storage: any, key: string} = <any>this.options.persistentStorage;
		if(!!persists?.storage) {
			if(persists.storage?.database != undefined) {
				(<Database>persists.storage).createTable({name: persists.key, key: <string>this.key}).then(table => {
					if(key !== undefined) {
						const value = this.get(key, true);
						if(value != null) table.set(value, key);
						else table.delete(key);
					} else {
						table.clear();
						this.all(true).forEach(row => table.add(row));
					}
				});
			} else if(persists.storage?.setItem != undefined) {
				const obj: Record<any, any> = {};
				for(const [k, v] of this.store.entries()) obj[k as any] = v;
				persists.storage.setItem(persists.key, JSONSanitize(obj));
			}
		}
	}

	private clearTimer(key: K) {
		const t = this.timers.get(key);
		if(t) { clearTimeout(t); this.timers.delete(key); }
	}

	private touchLRU(key: K) {
		if(!this.options.sizeLimit || this.options.sizeLimit <= 0) return;
		const idx = this.lruOrder.indexOf(key);
		if(idx >= 0) this.lruOrder.splice(idx, 1);
		this.lruOrder.push(key);
		while(this.lruOrder.length > (this.options.sizeLimit || 0)) {
			const lru = this.lruOrder.shift();
			if(lru !== undefined) this.delete(lru);
		}
	}

	/**
	 * Get all cached items
	 * @return {T[]} Array of items
	 */
	all(expired?: boolean): CachedValue<T>[] {
		const out: CachedValue<T>[] = [];
		for(const v of this.store.values()) {
			const val: any = v;
			if(expired || !val?._expired) out.push(deepCopy<any>(val));
		}
		return out;
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
	clear(): this {
		this.complete = false;
		for (const [k, t] of this.timers) clearTimeout(t);
		this.timers.clear();
		this.lruOrder = [];
		this.store.clear();
		this.save();
		return this;
	}

	/**
	 * Delete an item from the cache
	 * @param {K} key Item's primary key
	 */
	delete(key: K): this {
		this.clearTimer(key);
		const idx = this.lruOrder.indexOf(key);
		if(idx >= 0) this.lruOrder.splice(idx, 1);
		this.store.delete(key);
		this.save(key);
		return this;
	}

	/**
	 * Return cache as an array of key-value pairs
	 * @return {[K, T][]} Key-value pairs array
	 */
	entries(expired?: boolean): [K, CachedValue<T>][] {
		const out: [K, CachedValue<T>][] = [];
		for(const [k, v] of this.store.entries()) {
			const val: any = v;
			if(expired || !val?._expired) out.push([k, deepCopy<any>(val)]);
		}
		return out;
	}

	/**
	 * Manually expire a cached item
	 * @param {K} key Key to expire
	 */
	expire(key: K): this {
		this.complete = false;
		if(this.options.expiryPolicy == 'keep') {
			const v: any = this.store.get(key);
			if(v) {
				v._expired = true;
				this.store.set(key, v);
				this.save(key);
			}
		} else this.delete(key);
		return this;
	}

	/**
	 * Find the first cached item to match a filter
	 * @param {Partial<T>} filter Partial item to match
	 * @param {Boolean} expired Include expired items, defaults to false
	 * @returns {T | undefined} Cached item or undefined if nothing matched
	 */
	find(filter: Partial<T>, expired?: boolean): T | undefined {
		for(const v of this.store.values()) {
			const row: any = v;
			if((expired || !row._expired) && includes(row, filter)) return deepCopy<any>(row);
		}
		return undefined;
	}

	/**
	 * Get item from the cache
	 * @param {K} key Key to lookup
	 * @param expired Include expired items
	 * @return {T} Cached item
	 */
	get(key: K, expired?: boolean): CachedValue<T> | null {
		const raw = this.store.get(key);
		if(raw == null) return null;
		const cached: any = deepCopy<any>(raw);
		this.touchLRU(key);
		if(expired || !cached?._expired) return cached;
		return null;
	}

	/**
	 * Get a list of cached keys
	 * @return {K[]} Array of keys
	 */
	keys(expired?: boolean): K[] {
		const out: K[] = [];
		for(const [k, v] of this.store.entries()) {
			const val: any = v;
			if(expired || !val?._expired) out.push(k);
		}
		return out;
	}

	/**
	 * Get map of cached items
	 * @return {Record<K, T>}
	 */
	map(expired?: boolean): Record<K, CachedValue<T>> {
		const copy: any = {};
		for(const [k, v] of this.store.entries()) {
			const val: any = v;
			if(expired || !val?._expired) copy[k as any] = deepCopy<any>(val);
		}
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
		if(this.options.expiryPolicy == 'keep') delete (<any>value)._expired;
		this.clearTimer(key);
		this.store.set(key, value);
		this.touchLRU(key);
		this.save(key);
		if(ttl) {
			const t = setTimeout(() => {
				this.expire(key);
				this.save(key);
			}, (ttl || 0) * 1000);
			this.timers.set(key, t);
		}
		return this;
	}

	/**
	 * Get all cached items
	 * @return {T[]} Array of items
	 */
	values = this.all
}
