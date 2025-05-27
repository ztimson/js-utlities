import {ASet} from './aset.ts';

export type TableOptions = {
	name: string;
	key?: string;
};

export class Database {
	connection!: Promise<IDBDatabase>;
	tables!: TableOptions[];

	constructor(public readonly database: string, tables: (string | TableOptions)[], public version?: number) {
		this.connection = new Promise((resolve, reject) => {
			const req = indexedDB.open(this.database, this.version);
			this.tables = tables.map(t => {
				t = typeof t == 'object' ? t : {name: t};
				return {...t, name: t.name.toString()};
			});
			const tableNames = new ASet(this.tables.map(t => t.name));

			req.onerror = () => reject(req.error);

			req.onsuccess = () => {
				const db = req.result;
				if(tableNames.symmetricDifference(new ASet(Array.from(db.objectStoreNames))).length) {
					db.close();
					Object.assign(this, new Database(this.database, this.tables, db.version + 1));
				} else {
					this.version = db.version;
					resolve(db);
				}
			};

			req.onupgradeneeded = () => {
				const db = req.result;
				const existingTables = new ASet(Array.from(db.objectStoreNames));
				existingTables.difference(tableNames).forEach(name => db.deleteObjectStore(name));
				tableNames.difference(existingTables).forEach(name => db.createObjectStore(name));
			};
		});
	}

	includes(name: any): boolean {
		return !!this.tables.find(t => t.name == name.toString());
	}

	table<K extends IDBValidKey = any, T = any>(name: any): Table<K, T> {
		return new Table<K, T>(this, name.toString());
	}
}

export class Table<K extends IDBValidKey = any, T = any> {
	constructor(private readonly database: Database, public readonly name: string) {}

	async tx<R>(table: string, fn: (store: IDBObjectStore) => IDBRequest, readonly = false): Promise<R> {
		const db = await this.database.connection;
		const tx = db.transaction(table, readonly ? 'readonly' : 'readwrite');
		const store = tx.objectStore(table);
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
