import {PathEvent} from '../src';

describe('Path Events', () => {
	describe('malformed', () => {
		test('starting slash', async () =>
			expect(new PathEvent('/module').toString()).toEqual('module:*'));
		test('trailing slash', async () =>
			expect(new PathEvent('module/').toString()).toEqual('module:*'));
		test('double slash', async () =>
			expect(new PathEvent('module////path').toString()).toEqual('module/path:*'));
	});

	describe('methods', () => {
		test('custom', async () => {
			expect(new PathEvent('module:t').methods.includes('t')).toBeTruthy();
			expect(new PathEvent('module:t').methods.includes('z')).toBeFalsy();
		});
		test('create', async () =>
			expect(new PathEvent('module:crud').create).toBeTruthy());
		test('read', async () =>
			expect(new PathEvent('module:crud').read).toBeTruthy());
		test('update', async () =>
			expect(new PathEvent('module:crud').update).toBeTruthy());
		test('delete', async () =>
			expect(new PathEvent('module:crud').delete).toBeTruthy());
		test('none', async () => {
			const event = new PathEvent('module:n');
			expect(event.none).toBeTruthy();
			expect(event.create).toBeFalsy();
			expect(event.read).toBeFalsy();
			expect(event.update).toBeFalsy();
			expect(event.delete).toBeFalsy()
		});
		test('wildcard', async () => {
			const event = new PathEvent('module:*');
			expect(event.none).toBeFalsy();
			expect(event.create).toBeTruthy();
			expect(event.read).toBeTruthy();
			expect(event.update).toBeTruthy();
			expect(event.delete).toBeTruthy()
		});
	});
});
