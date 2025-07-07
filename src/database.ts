import {findByProp} from './array.ts';
import {ASet} from './aset.ts';
import {sleepWhile} from './time.ts';

export type TableOptions = {
	name: string;
	key?: string;
	autoIncrement?: boolean;
};

class AsyncLock {
	private p = Promise.resolve();
	run<T>(fn: () => Promise<T>): Promise<T> {
		const res = this.p.then(fn, fn);
		this.p = res.then(() => {}, () => {});
		return res;
}
	}

export class Database {
	private schemaLock = new AsyncLock();
	private upgrading = false;

	connection!: Promise<IDBDatabase>;
	tables!: TableOptions[];

	get ready() { return !this.upgrading; }

	constructor(public readonly database: string, tables?: (string | TableOptions)[], public version?: number) {
		this.connection = new Promise((resolve, reject) => {
			const req = indexedDB.open(this.database, this.version);
			this.tables = !tables ? [] : tables.map(t => {
				t = typeof t == 'object' ? t : {name: t};
				return {...t, name: t.name.toString()};
			});

			req.onerror = () => reject(req.error);

			req.onsuccess = () => {
				const db = req.result;
				const existing = Array.from(db.objectStoreNames);
				if(!tables) this.tables = existing.map(t => {
					const tx = db.transaction(t, 'readonly');
					const store = tx.objectStore(t);
					return {name: t, key: <string>store.keyPath};
				});
				const desired = new ASet((tables || []).map(t => typeof t == 'string' ? t : t.name));
				if(tables && desired.symmetricDifference(new ASet(existing)).length) {
					db.close();
					Object.assign(this, new Database(this.database, this.tables, db.version + 1));
					this.connection.then(resolve);
				} else {
					this.version = db.version;
					resolve(db);
				}
				this.upgrading = false;
			};

			req.onupgradeneeded = () => {
				this.upgrading = true;
				const db = req.result;
				const existingTables = new ASet(Array.from(db.objectStoreNames));
				if(tables) {
					const desired = new ASet((tables || []).map(t => typeof t == 'string' ? t : t.name));
					existingTables.difference(desired).forEach(name => db.deleteObjectStore(name));
					desired.difference(existingTables).forEach(name => {
						const t = this.tables.find(findByProp('name', name));
						db.createObjectStore(name, {
							keyPath: t?.key,
							autoIncrement: t?.autoIncrement || !t?.key,
						});
					});
				}
			};
		});
	}

	waitForUpgrade = () => sleepWhile(() => this.upgrading);

	async createTable<K extends IDBValidKey = any, T = any>(table: string | TableOptions): Promise<Table<K, T>> {
		return this.schemaLock.run(async () => {
			if (typeof table == 'string') table = { name: table };
			const conn = await this.connection;
			if (!this.includes(table.name)) {
				const newDb = new Database(this.database, [...this.tables, table], (this.version ?? 0) + 1);
				conn.close();
				Object.assign(this, newDb);
				await this.connection;
			}
			return this.table<K, T>(table.name);
		});
	}


	async deleteTable(table: string | TableOptions): Promise<void> {
		return this.schemaLock.run(async () => {
			if (typeof table == 'string') table = { name: table };
			if (!this.includes(table.name)) return;
			const conn = await this.connection;
			const newDb = new Database(this.database, this.tables.filter(t => t.name != (<TableOptions>table).name), (this.version ?? 0) + 1);
			conn.close();
			Object.assign(this, newDb);
			await this.connection;
		});

	}

	includes(name: any): boolean {
		return !!this.tables.find(t => t.name == (typeof name == 'object' ? name.name : name.toString()));
	}

	table<K extends IDBValidKey = any, T = any>(name: any): Table<K, T> {
		return new Table<K, T>(this, name.toString());
	}
}

export class Table<K extends IDBValidKey = any, T = any> {
	constructor(private readonly database: Database, public readonly name: string, public readonly key: keyof T | string = 'id') {
		this.database.connection.then(() => {
			const exists = !!this.database.tables.find(findByProp('name', this.name));
			if(!exists) this.database.createTable(this.name);
		});
	}

	async tx<R>(table: string, fn: (store: IDBObjectStore) => IDBRequest, readonly = false): Promise<R> {
		await this.database.waitForUpgrade();
		const db = await this.database.connection;
		const tx = db.transaction(table, readonly ? 'readonly' : 'readwrite');
		const store = tx.objectStore(table);
		return new Promise<R>((resolve, reject) => {
			const request = fn(store);
			request.onsuccess = () => resolve(request.result as R);
			request.onerror = () => reject(request.error);
		});
	}

	add(value: T, key?: K): Promise<void> {
		return this.tx(this.name, store => store.add(value, key));
	}

	all = this.getAll;

	clear(): Promise<void> {
		return this.tx(this.name, store => store.clear());
	}

	count(): Promise<number> {
		return this.tx(this.name, store => store.count(), true);
	}

	create = this.add;

	delete(key: K): Promise<void> {
		return this.tx(this.name, store => store.delete(key));
	}

	get(key: K): Promise<T> {
		return this.tx(this.name, store => store.get(key), true);
	}

	getAll(): Promise<T[]> {
		return this.tx(this.name, store => store.getAll(), true);
	}

	getAllKeys(): Promise<K[]> {
		return this.tx(this.name, store => store.getAllKeys(), true);
	}

	put(value: T, key?: string): Promise<void> {
		return this.tx(this.name, store => {
			if (store.keyPath) return store.put(value);
			return store.put(value, key);
		});
	}

	read(): Promise<T[]>;
	read(key: K): Promise<T>;
	read(key?: K): Promise<T | T[]> {
		return key ? this.get(key) : this.getAll();
	}

	set(value: T, key?: K): Promise<void> {
		if(key) (<any>value)[this.key] = key;
		if(!(<any>value)[this.key]) return this.add(value);
		return this.put(value);
	}

	update = this.set;
}
