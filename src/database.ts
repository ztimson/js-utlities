export type TableOptions = {
	name: string;
	key?: string;
};

export class Database {
	connection!: Promise<IDBDatabase>;

	constructor(public readonly database: string, public readonly tables: (string | TableOptions)[], public version?: number) {
		this.connection = new Promise((resolve, reject) => {
			const req = indexedDB.open(this.database, this.version);

			req.onerror = () => reject(req.error);

			req.onsuccess = () => {
				const db = req.result;
				if(tables.find(s => !db.objectStoreNames.contains(typeof s === 'string' ? s : s.name))) {
					db.close();
					Object.assign(this, new Database(this.database, this.tables, db.version + 1));
				} else {
					this.version = db.version;
					resolve(db);
				}
			};

			req.onupgradeneeded = () => {
				const db = req.result;
				Array.from(db.objectStoreNames)
					.filter(s => !this.tables.find(t => typeof t === 'string' ? t : t.name == s))
					.forEach(name => db.deleteObjectStore(name));
				tables.filter(t => !db.objectStoreNames.contains(typeof t === 'string' ? t : t.name))
					.forEach(t => {db.createObjectStore(typeof t === 'string' ? t : t.name, {
						keyPath: typeof t === 'string' ? undefined : t.key
					});
				});
			};
		});
	}

	includes(name: string): boolean {
		return this.tables.some(t => (typeof t === 'string' ? name === t : name === t.name));
	}

	table<K extends IDBValidKey = any, T = any>(name: string): Table<K, T> {
		return new Table<K, T>(this, name);
	}
}

export class Table<K extends IDBValidKey = any, T = any> {
	constructor(private readonly database: Database, public readonly name: string) {}

	async tx<R>(schema: string, fn: (store: IDBObjectStore) => IDBRequest, readonly = false): Promise<R> {
		const db = await this.database.connection;
		const tx = db.transaction(schema, readonly ? 'readonly' : 'readwrite');
		const store = tx.objectStore(schema);
		return new Promise<R>((resolve, reject) => {
			const request = fn(store);
			request.onsuccess = () => resolve(request.result as R); // ✅ explicit cast
			request.onerror = () => reject(request.error);
		});
	}

	add(value: T, key?: K): Promise<void> {
		return this.tx(this.name, store => store.add(value, key));
	}

	count(): Promise<number> {
		return this.tx(this.name, store => store.count(), true);
	}

	put(key: K, value: T): Promise<void> {
		return this.tx(this.name, store => store.put(value, key));
	}

	getAll(): Promise<T[]> {
		return this.tx(this.name, store => store.getAll(), true);
	}

	getAllKeys(): Promise<K[]> {
		return this.tx(this.name, store => store.getAllKeys(), true);
	}

	get(key: K): Promise<T> {
		return this.tx(this.name, store => store.get(key), true);
	}

	delete(key: K): Promise<void> {
		return this.tx(this.name, store => store.delete(key));
	}

	clear(): Promise<void> {
		return this.tx(this.name, store => store.clear());
	}
}
