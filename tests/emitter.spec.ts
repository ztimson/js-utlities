import {TypedEmitter} from '../src';

describe('TypedEmitter', () => {
	describe('Instance', () => {
		type Events = {
			foo: (data: string) => void;
			bar: (x: number, y: number) => void;
			'*': (event: string, ...args: any[]) => void;
		};
		let emitter: TypedEmitter<Events>;

		beforeEach(() => {
			emitter = new TypedEmitter<Events>();
		});

		it('calls the correct listener on emit', () => {
			const fooHandler = jest.fn();
			emitter.on('foo', fooHandler);

			emitter.emit('foo', 'hello');
			expect(fooHandler).toHaveBeenCalledWith('hello');
		});

		it('does NOT call listener after off', () => {
			const fooHandler = jest.fn();
			emitter.on('foo', fooHandler);
			emitter.off('foo', fooHandler);
			emitter.emit('foo', 'test');
			expect(fooHandler).not.toHaveBeenCalled();
		});

		it('returns unsubscribe function that removes handler', () => {
			const handler = jest.fn();
			const unsubscribe = emitter.on('foo', handler);
			unsubscribe();
			emitter.emit('foo', 'x');
			expect(handler).not.toHaveBeenCalled();
		});

		it('calls wildcard listener for all events', () => {
			const wildcard = jest.fn();
			emitter.on('*', wildcard);

			emitter.emit('foo', 'data');
			emitter.emit('bar', 1, 2);

			expect(wildcard).toHaveBeenCalledWith('foo', 'data');
			expect(wildcard).toHaveBeenCalledWith('bar', 1, 2);
		});

		it('once() resolves with argument and auto-unsubscribes', async () => {
			const p = emitter.once('foo');
			emitter.emit('foo', 'only-once');
			expect(await p).toBe('only-once');

			// no more handlers
			const cb = jest.fn();
			emitter.on('foo', cb);
			emitter.emit('foo', 'again');
			expect(cb).toHaveBeenCalledWith('again');
		});

		it('once() calls optional listener and Promise resolves', async () => {
			const listener = jest.fn();
			const oncePromise = emitter.once('bar', listener);

			emitter.emit('bar', 1, 2);

			expect(listener).toHaveBeenCalledWith(1, 2);
			expect(await oncePromise).toEqual([1, 2]);
		});
	});

	describe('Static', () => {
		beforeEach(() => {
			// Clear static listeners between tests
			(TypedEmitter as any).listeners = {};
		});

		it('calls static listeners with emit', () => {
			const spy = jest.fn();
			TypedEmitter.on('event', spy);

			TypedEmitter.emit('event', 1, 'a');
			expect(spy).toHaveBeenCalledWith(1, 'a');
		});

		it('wildcard static listeners receive all event types', () => {
			const spy = jest.fn();
			TypedEmitter.on('*', spy);

			TypedEmitter.emit('xy', 123);
			expect(spy).toHaveBeenCalledWith('xy', 123);
		});

		it('only calls listener once with once()', async () => {
			const handler = jest.fn();
			const p = TypedEmitter.once('ping', handler);

			TypedEmitter.emit('ping', 'pong');

			expect(handler).toHaveBeenCalledWith('pong');
			await expect(p).resolves.toBe('pong');

			handler.mockClear();
			TypedEmitter.emit('ping', 'other');
			expect(handler).not.toHaveBeenCalled();
		});

		it('removes static listener with off', () => {
			const h = jest.fn();
			TypedEmitter.on('offevent', h);
			TypedEmitter.off('offevent', h);
			TypedEmitter.emit('offevent', 42);
			expect(h).not.toHaveBeenCalled();
		});
	});
});
