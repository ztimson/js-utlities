import {PathError, PathEvent, PathEventEmitter, PE, PES} from '../src';

describe('Path Events', () => {
	describe('PE', () => {
		it('creates PathEvent from template string', () => {
			const e = PE`users/system:cr`;
			expect(e).toBeInstanceOf(PathEvent);
			expect(e.fullPath).toBe('users/system');
			expect(e.create).toBe(true);
			expect(e.read).toBe(true);
		});

		it('handles interpolation', () => {
			const path = 'users/system';
			const meth = 'r';
			const e = PE`${path}:${meth}`;
			expect(e.fullPath).toBe('users/system');
			expect(e.read).toBe(true);
		});
	});

	describe('PES', () => {
		it('creates string for event', () => {
			expect(PES`users/system:cr`).toBe('users/system:cr');
		});
	});

	describe('PathEvent', () => {
		it('parses event string', () => {
			const pe = new PathEvent('users/system:cr');
			expect(pe.module).toBe('users');
			expect(pe.fullPath).toBe('users/system');
			expect(pe.name).toBe('system');
			expect(pe.create).toBe(true);
			expect(pe.read).toBe(true);
		});

		it('parses wildcard', () => {
			const pe = new PathEvent('*');
			expect(pe.all).toBe(true);
			expect(pe.fullPath).toBe('');
			expect(pe.methods.has('*')).toBe(true);
		});

		it('parses none method', () => {
			const pe = new PathEvent('users/system:n');
			expect(pe.none).toBe(true);
			pe.none = false;
			expect(pe.none).toBe(false);
		});

		it('setters for methods', () => {
			const pe = new PathEvent('users/system:r');
			pe.create = true;
			expect(pe.methods.has('c')).toBe(true);
			pe.update = true;
			expect(pe.methods.has('u')).toBe(true);
			pe.delete = true;
			expect(pe.methods.has('d')).toBe(true);
			pe.read = false;
			expect(pe.methods.has('r')).toBe(false);
		});

		it('combine merges longest path and methods', () => {
			const a = new PathEvent('users/sys:cr');
			const b = new PathEvent('users/sys:u');
			const c = PathEvent.combine(a, b);
			expect(c.fullPath).toBe('users/sys');
			expect(c.methods.has('c')).toBe(true);
			expect(c.methods.has('r')).toBe(true);
			expect(c.methods.has('u')).toBe(true);
		});

		it('combine stops at none', () => {
			const a = new PathEvent('data/collection/doc:c');
			const b = new PathEvent('data/collection:r');
			const c = new PathEvent('data:n');
			const d = PathEvent.combine(a, b, c);
			expect(d.fullPath).toBe(a.fullPath);
			expect(d.create).toBe(true);
			expect(d.read).toBe(true);
			expect(d.update).toBe(false);
			expect(d.none).toBe(false);
		});

		it('filter finds overlap by path and methods', () => {
			const events = [
				new PathEvent('users/sys:cr'),
				new PathEvent('users/sys:r'),
				new PathEvent('files/sys:r')
			];
			const filtered = PathEvent.filter(events, 'users/sys:r');
			expect(filtered.length).toBe(2);
		});

		it('filter handles wildcard', () => {
			const events = [
				new PathEvent('*'),
				new PathEvent('users/sys:r')
			];
			const filtered = PathEvent.filter(events, 'users/sys:r');
			expect(filtered.length).toBe(2);
		});

		it('has returns true for overlapping', () => {
			const events = [new PathEvent('users/sys:cr')];
			expect(PathEvent.has(events, 'users/sys:r')).toBeTruthy();
			expect(PathEvent.has(events, 'users/nope:r')).toBeFalsy();
		});

		it('hasAll returns true only if all overlap', () => {
			const events = [
				new PathEvent('users/sys:cr'),
				new PathEvent('users/sys:u'),
			];
			expect(PathEvent.hasAll(events, 'users/sys:c', 'users/sys:u')).toBe(true);
			expect(PathEvent.hasAll(events, 'users/sys:c', 'users/sys:no')).toBe(false);
		});

		it('hasFatal throws if not found', () => {
			expect(() => PathEvent.hasFatal('users/sys:r', 'users/other:r')).toThrow(PathError);
			expect(() => PathEvent.hasFatal('users/sys:r', 'users/sys:r')).not.toThrow();
		});

		it('hasAllFatal throws if missing', () => {
			expect(() => PathEvent.hasAllFatal(['users/sys:r'], 'users/sys:r', 'users/sys:c')).toThrow(PathError);
		});

		it('toString creates correct event string', () => {
			const s = PathEvent.toString('users/sys', ['c', 'r']);
			expect(s).toBe('users/sys:cr');
			const pe = new PathEvent('users/sys:cr');
			expect(pe.toString()).toBe('users/sys:cr');
		});

		it('filter instance filters as expected', () => {
			const pe = new PathEvent('users/sys:r');
			const arr = ['users/sys:r', 'users/other:r'];
			const filtered = pe.filter(arr);
			expect(filtered[0].fullPath).toBe('users/sys');
		});
	});

	describe('PathEventEmitter', () => {
		it('wildcard', done => {
			const emitter = new PathEventEmitter();
			emitter.on('*', (event) => {
				expect(event.fullPath).toBe('system');
				done();
			});
			emitter.emit('system:c');
		});

		it('scoped', done => {
			const emitter = new PathEventEmitter('users');
			emitter.on(':cud', (event) => {
				expect(event.fullPath).toBe('users/system');
				done();
			});
			emitter.emit('system:u');
		});

		it('calls listener on matching emit', done => {
			const emitter = new PathEventEmitter();
			const fn = jest.fn((event) => {
				expect(event.fullPath).toBe('users/sys');
				done();
			});
			emitter.on('users/sys:r', fn);
			emitter.emit('users/sys:r');
		});

		it('off removes listener', () => {
			const emitter = new PathEventEmitter();
			const fn = jest.fn();
			emitter.on('users/sys:r', fn);
			emitter.off(fn);
			emitter.emit('users/sys:r');
			expect(fn).not.toHaveBeenCalled();
		});

		it('on returns unsubscribe function', () => {
			const emitter = new PathEventEmitter();
			const fn = jest.fn();
			const unsub = emitter.on('users/sys:r', fn);
			unsub();
			emitter.emit('users/sys:r');
			expect(fn).not.toHaveBeenCalled();
		});

		it('emit supports prefix', () => {
			const emitter = new PathEventEmitter('foo');
			emitter.once('*', (event) =>
				expect(event.fullPath).toBe('foo/bar'));
			emitter.emit('bar:r');
		});
	});
});
