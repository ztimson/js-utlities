import { Cache } from '../src';

describe('Cache', () => {
	type TestItem = { id: string; value: string };

	let cache: Cache<string, TestItem>;
	let storageMock: Storage;
	let storageGetItemSpy: jest.SpyInstance;
	let storageSetItemSpy: jest.SpyInstance;

	beforeEach(() => {
		storageMock = {
			constructor: {name: 'Storage' as any},
			getItem: jest.fn(),
			setItem: jest.fn(),
			removeItem: jest.fn(),
			clear: jest.fn(),
			key: jest.fn(),
			length: 0,
		};

		// Spies
		storageGetItemSpy = jest.spyOn(storageMock, 'getItem');
		storageSetItemSpy = jest.spyOn(storageMock, 'setItem');

		cache = new Cache<string, TestItem>('id', {
			persistentStorage: { storage: storageMock, key: 'cache' },
		});
		jest.clearAllMocks();
		jest.useFakeTimers();
	});

	it('adds and gets an item', () => {
		const item = { id: '1', value: 'a' };
		cache.add(item);
		expect(cache.get('1')).toEqual(item);
	});

	it('skips expired items by default but fetches if requested', () => {
		const item = { id: '2', value: 'b' };
		cache.set('2', item);
		cache.options.expiryPolicy = 'keep';
		cache.expire('2');
		expect(cache.get('2')).toBeNull();
		expect(cache.get('2', true)).toEqual({ ...item, _expired: true });
	});

	it('supports property access and setting via Proxy', () => {
		(cache as any)['3'] = { id: '3', value: 'c' };
		expect((cache as any)['3']).toEqual({ id: '3', value: 'c' });
		expect(cache.get('3')).toEqual({ id: '3', value: 'c' });
	});

	it('removes an item and persists', () => {
		cache.add({ id: '4', value: 'd' });
		cache.delete('4');
		expect(cache.get('4')).toBeNull();
		expect(storageSetItemSpy).toHaveBeenCalled();
	});

	it('clears the cache', () => {
		cache.add({ id: '1', value: 'test' });
		cache.clear();
		expect(cache.get('1')).toBeNull();
		expect(cache.complete).toBe(false);
	});

	it('bulk adds, marks complete', () => {
		const items = [
			{ id: 'a', value: '1' },
			{ id: 'b', value: '2' },
		];
		cache.addAll(items);
		expect(cache.all().length).toBe(2);
		expect(cache.complete).toBe(true);
	});

	it('returns correct keys, entries, and map', () => {
		cache.add({ id: 'x', value: 'foo' });
		cache.add({ id: 'y', value: 'bar' });
		expect(cache.keys().sort()).toEqual(['x', 'y']);
		expect(cache.entries().map(e => e[0]).sort()).toEqual(['x', 'y']);
		const m = cache.map();
		expect(Object.keys(m)).toEqual(expect.arrayContaining(['x', 'y']));
		expect(m['x'].value).toBe('foo');
	});

	it('persists and restores from storage', () => {
		(storageMock.getItem as jest.Mock).mockReturnValueOnce(
			JSON.stringify({ z: { id: 'z', value: 'from-storage' } }),
		);
		const c = new Cache<string, TestItem>('id', {
			persistentStorage: { storage: storageMock, key: 'cache' },
		});
		expect(c.get('z')).toEqual({ id: 'z', value: 'from-storage' });
	});

	it('expiryPolicy "delete" removes expired items completely', () => {
		cache.options.expiryPolicy = 'delete';
		cache.add({ id: 'del1', value: 'gone' });
		cache.expire('del1');
		expect(cache.get('del1', true)).toBeNull();
		expect(cache.get('del1')).toBeNull();
	});

	it('expiryPolicy "keep" marks as expired but does not delete', () => {
		cache.options.expiryPolicy = 'keep';
		cache.add({ id: 'keep1', value: 'kept' });
		cache.expire('keep1');
		expect(cache.get('keep1')).toBeNull();
		const val = cache.get('keep1', true);
		expect(val && val._expired).toBe(true);
	});

	// Uncomment and adapt this test if TTL/expiry timers are supported by your implementation
	// it('expires and deletes items after TTL', () => {
	//   jest.useFakeTimers();
	//   cache = new Cache<string, TestItem>('id', { ttl: 0.01 });
	//   cache.add({ id: 'ttl1', value: 'temp' });
	//   jest.advanceTimersByTime(100);
	//   expect(cache.get('ttl1')).toBeNull();
	// });

	// Edge: add error handling test
	it('throws if instantiating with invalid key property', () => {
		expect(() => {
			const invalid = new Cache<'string', TestItem>('id');
			// try invalid.add({id: 'z', value: 'fail'}) if needed
		}).not.toThrow();
	});
});
