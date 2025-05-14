import {Cache} from '../src';

describe('Cache', () => {
	type TestItem = { id: string; value: string; };

	let cache: Cache<string, TestItem>;
	let storageMock: Storage;
	let storageGetItemSpy: jest.SpyInstance;
	let storageSetItemSpy: jest.SpyInstance;

	beforeEach(() => {
		storageMock = {
			getItem: jest.fn(),
			setItem: jest.fn(),
			removeItem: jest.fn(),
			clear: jest.fn(),
			key: jest.fn(),
			length: 0,
		};
		storageGetItemSpy = jest.spyOn(storageMock, 'getItem');
		storageSetItemSpy = jest.spyOn(storageMock, 'setItem');
		cache = new Cache<string, TestItem>('id', {storage: storageMock, storageKey: 'cache'});
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	test('should add and get an item', () => {
		const item = {id: '1', value: 'a'};
		cache.add(item);
		expect(cache.get('1')).toEqual(item);
	});

	test('should not get an expired item when expired option not set', () => {
		const item = {id: '1', value: 'a'};
		cache.set('1', item);
		cache.options.expiryPolicy = 'keep';
		cache.expire('1');
		expect(cache.get('1')).toBeNull();
		expect(cache.get('1', true)).toEqual({...item, _expired: true});
	});

	test('should set and get via property access (proxy)', () => {
		(cache as any)['2'] = {id: '2', value: 'b'};
		expect((cache as any)['2']).toEqual({id: '2', value: 'b'});
	});

	test('should remove an item', () => {
		cache.set('1', {id: '1', value: 'a'});
		cache.delete('1');
		expect(cache.get('1')).toBeNull();
		expect(storageSetItemSpy).toHaveBeenCalled();
	});

	test('should clear the cache', () => {
		cache.add({id: '1', value: 'a'});
		cache.clear();
		expect(cache.get('1')).toBeNull();
		expect(cache.complete).toBe(false);
	});

	test('should add multiple items and mark complete', () => {
		const rows = [
			{id: 'a', value: '1'},
			{id: 'b', value: '2'},
		];
		cache.addAll(rows);
		expect(cache.all().length).toBe(2);
		expect(cache.complete).toBe(true);
	});

	test('should return all, keys, entries, and map', () => {
		cache.add({id: '1', value: 'a'});
		cache.add({id: '2', value: 'b'});
		expect(cache.all().length).toBe(2);
		expect(cache.keys().sort()).toEqual(['1', '2']);
		expect(cache.entries().length).toBe(2);
		expect(Object.keys(cache.map())).toContain('1');
		expect(Object.keys(cache.map())).toContain('2');
	});

	// test('should expire/delete items after TTL', () => {
	// 	jest.useFakeTimers();
	// 	cache = new Cache<string, TestItem>('id', {ttl: 0.1});
	// 	cache.add({id: '3', value: 'x'});
	// 	jest.advanceTimersByTime(250);
	// 	expect(cache.get('3')).toBeNull();
	// });

	test('should persist and restore from storage', () => {
		(storageMock.getItem as jest.Mock).mockReturnValueOnce(JSON.stringify({a: {id: 'a', value: 'from-storage'}}));
		const c = new Cache<string, TestItem>('id', {storage: storageMock, storageKey: 'cache'});
		expect(c.get('a')).toEqual({id: 'a', value: 'from-storage'});
	});

	test('should handle expiryPolicy "delete"', () => {
		cache.options.expiryPolicy = 'delete';
		cache.add({id: 'k1', value: 'KeepMe'});
		cache.expire('k1');
		expect(cache.get('k1', true)).toBeNull();
	});

	test('should handle expiryPolicy "keep"', () => {
		cache.options.expiryPolicy = 'keep';
		cache.add({id: 'k1', value: 'KeepMe'});
		cache.expire('k1');
		expect(cache.get('k1')).toBeNull();
		expect(cache.get('k1', true)?._expired).toBe(true);
	});
});
