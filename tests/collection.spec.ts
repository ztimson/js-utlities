import {Collection} from '../src';
import 'fake-indexeddb/auto';

describe('IndexedDb and Collection', () => {
	const data = {id: 1, name: 'Alice', age: 30, email: '<EMAIL>'};
	const data2 = {id: 2, name: 'Bob', age: 39, email: '<EMAIL>'};
	let collection = new Collection<number, typeof data>('database', 'collection');

	afterEach(() => collection.clear());

	test('can set and get an item', async () => {
		await collection.put(data.id, data);
		const result = await collection.get(data.id);
		expect(result).toEqual(data);
	});

	test('can remove an item', async () => {
		await collection.put(data.id, data);
		await collection.put(data2.id, data2);
		await collection.delete(data.id);
		const result = await collection.get(data.id);
		const result2 = await collection.get(data2.id);
		expect(result).toBeUndefined();
		expect(result2).toEqual(data2);
	});

	test('can clear all items', async () => {
		await collection.put(data.id, data);
		await collection.put(data2.id, data2);
		await collection.clear();
		const result = await collection.get(data.id);
		const result2 = await collection.get(data2.id);
		expect(result).toBeUndefined();
		expect(result2).toBeUndefined();
	});

	test('getItem on missing key returns undefined', async () => {
		const result = await collection.get(-1);
		expect(result).toBeUndefined();
	});

	test('count returns number of items', async () => {
		expect(await collection.count()).toBe(0);
		await collection.put(data.id, data);
		expect(await collection.count()).toBe(1);
		await collection.delete(data.id);
		expect(await collection.count()).toBe(0);
	});

	test('can get all items', async () => {
		await collection.put(data.id, data);
		await collection.put(data2.id, data2);
		const allItems = await collection.getAll();
		expect(allItems).toEqual(expect.arrayContaining([data, data2]));
		expect(allItems.length).toBe(2);
	});

	test('can get all keys', async () => {
		await collection.put(data.id, data);
		await collection.put(data2.id, data2);
		const keys = await collection.getAllKeys();
		expect(keys).toEqual(expect.arrayContaining([data.id, data2.id]));
		expect(keys.length).toBe(2);
	});
});
