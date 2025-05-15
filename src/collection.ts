export class Collection<K extends IDBValidKey, T> {
	private database: Promise<IDBDatabase>;

	constructor(public readonly db: string, public readonly collection: string, public readonly version?: number, private setup?: (db: IDBDatabase, event: IDBVersionChangeEvent) => void) {
		this.database = new Promise((resolve, reject) => {
			const req = indexedDB.open(this.db, this.version);
			req.onerror = () => reject(req.error);
			req.onsuccess = () => resolve(req.result);
			req.onupgradeneeded = (event) => {
				const db = req.result;
				if(!db.objectStoreNames.contains(collection)) db.createObjectStore(collection, {keyPath: undefined});
				if (this.setup) this.setup(db, event as IDBVersionChangeEvent);
			};
		});
	}

	async tx<T>(collection: string, fn: ((store: IDBObjectStore) => IDBRequest), readonly?: boolean): Promise<T> {
		const db = await this.database;
		const tx = db.transaction(collection, readonly ? 'readonly' : 'readwrite');
		const store = tx.objectStore(collection);
		return new Promise((resolve, reject) => {
			const request = fn(store);
			request.onsuccess = () => resolve(request.result);
			request.onerror = () => reject(request.error);
		});
	}

	add(value: T, key?: K): Promise<void> {
		return this.tx(this.collection, store => store.add(value, key));
	}

	count(): Promise<number> {
		return this.tx(this.collection, store => store.count(), true);
	}

	put(key: K, value: T): Promise<void> {
		return this.tx(this.collection, store => store.put(value, key));
	}

	getAll(): Promise<T[]> {
		return this.tx(this.collection, store => store.getAll(), true);
	}

	getAllKeys(): Promise<K[]> {
		return this.tx(this.collection, store => store.getAllKeys(), true);
	}

	get(key: K): Promise<T> {
		return this.tx(this.collection, store => store.get(key), true);
	}

	delete(key: K): Promise<void> {
		return this.tx(this.collection, store => store.delete(key));
	}

	clear(): Promise<void> {
		return this.tx(this.collection, store => store.clear());
	}
}
