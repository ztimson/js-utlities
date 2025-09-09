import { Cache } from '../src';

describe('Cache', () => {
	type TestItem = { id: string; value: string };

	let cache: Cache<string | symbol, TestItem>;
	let storageMock: Storage;
	let storageGetItemSpy: jest.SpyInstance;
	let storageSetItemSpy: jest.SpyInstance;

	beforeEach(() => {
		jest.useFakeTimers();

		storageMock = {
			constructor: { name: 'Storage' as any },
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

		cache = new Cache<string | symbol, TestItem>('id', {
			persistentStorage: { storage: storageMock, key: 'cache' },
		});

		jest.clearAllMocks();
	});

	afterEach(() => {
		jest.useRealTimers();
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

	it('clears the cache & cancels TTL timers', () => {
		cache.set('1', { id: '1', value: 'x' }, 1);
		cache.clear();
		// Even after timers advance, nothing should appear or throw
		jest.advanceTimersByTime(1500);
		expect(cache.get('1', true)).toBeNull();
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

	it('returns correct keys, entries, map, and values()', () => {
		cache.add({ id: 'x', value: 'foo' });
		cache.add({ id: 'y', value: 'bar' });
		expect(cache.keys().sort()).toEqual(['x', 'y']);
		expect(cache.entries().map(e => e[0]).sort()).toEqual(['x', 'y']);
		const m = cache.map();
		expect(Object.keys(m)).toEqual(expect.arrayContaining(['x', 'y']));
		expect(m['x'].value).toBe('foo');
		// CHANGE: values() was a snapshot field before; now it’s a method
		expect(cache.values().map(v => v.id).sort()).toEqual(['x', 'y']);
	});

	it('persists and restores from storage', () => {
		(storageMock.getItem as jest.Mock).mockReturnValueOnce(
			JSON.stringify({ z: { id: 'z', value: 'from-storage' } }),
		);
		const c = new Cache<string, TestItem>('id', {
			persistentStorage: { storage: storageMock, key: 'cache' },
		});
		expect(c.get('z')).toEqual({ id: 'z', value: 'from-storage' });
		// ensure it used the right storage key
		expect(storageGetItemSpy).toHaveBeenCalledWith('cache');
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

	it('TTL expiration deletes by default', () => {
		cache.add({ id: 'ttl1', value: 'tick' }, 1);
		jest.advanceTimersByTime(999);
		expect(cache.get('ttl1')).toEqual({ id: 'ttl1', value: 'tick' });
		jest.advanceTimersByTime(2);
		expect(cache.get('ttl1')).toBeNull();
	});

	it('TTL overwrite cancels previous timer', () => {
		cache.add({ id: 'ow', value: 'v1' }, 1);
		jest.advanceTimersByTime(500);
		cache.add({ id: 'ow', value: 'v2' }, 1);
		jest.advanceTimersByTime(600);
		expect(cache.get('ow')).toEqual({ id: 'ow', value: 'v2' });
		jest.advanceTimersByTime(500);
		expect(cache.get('ow')).toBeNull();
	});

	it('find() returns first match respecting expired flag', () => {
		cache.options.expiryPolicy = 'keep';
		cache.add({ id: 'f1', value: 'hello' });
		cache.add({ id: 'f2', value: 'world' });
		cache.expire('f1');
		expect(cache.find({ value: 'hello' })).toBeUndefined();
		expect(cache.find({ value: 'hello' }, true)).toEqual({ id: 'f1', value: 'hello', _expired: true });
	});

	it('symbol keys are supported when using set/get directly', () => {
		const s = Symbol('k');
		// NOTE: can’t use add() without a primary key; set works fine
		cache.set(s, { id: 'sym', value: 'ok' });
		expect(cache.get(s as any)).toEqual({ id: 'sym', value: 'ok' });
		// ensure keys() includes the symbol
		const keys = cache.keys(true);
		expect(keys.includes(s as any)).toBe(true);
	});

	it('LRU: evicts least-recently-used when over capacity', () => {
		const lruCache = new Cache<string, TestItem>('id', {
			sizeLimit: 2,
			persistentStorage: { storage: storageMock, key: 'cache' },
		});

		lruCache.add({ id: 'A', value: '1' });
		lruCache.add({ id: 'B', value: '2' });
		// touch A to make it MRU
		expect(lruCache.get('A')).toEqual({ id: 'A', value: '1' });
		// add C → should evict least-recently-used (B)
		lruCache.add({ id: 'C', value: '3' });

		expect(lruCache.get('B')).toBeNull();
		expect(lruCache.get('A')).toEqual({ id: 'A', value: '1' });
		expect(lruCache.get('C')).toEqual({ id: 'C', value: '3' });
	});

	it('delete() removes from LRU and cancels timer', () => {
		const lruCache = new Cache<string, TestItem>('id', { sizeLimit: 2 });
		lruCache.set('A', { id: 'A', value: '1' }, 1);
		lruCache.delete('A');
		jest.advanceTimersByTime(1200);
		expect(lruCache.get('A', true)).toBeNull();
	});

	it('throws when adding item missing the primary key', () => {
		const c = new Cache<'id', any>('id');
		expect(() => c.add({ nope: 'missing' } as any)).toThrow(/Doesn't exist/);
	});
});
