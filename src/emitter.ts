export type Listener<T> = (event: T) => any;

export class Emitter<T> {
	private listeners: {[key: string]: Listener<T>} = {};

	constructor() { }

	emit(e: T) {
		Object.values(this.listeners).forEach(l => l(e));
	}

	listen(fn: Listener<T>): () => {};
	listen(key: string, fn: Listener<T>): () => {};
	listen(keyOrFn: string | Listener<T>, fn?: Listener<T>): () => {} {
		const func: any = fn ? fn : keyOrFn;
		const key: string = typeof keyOrFn == 'string' ? keyOrFn :
			`_${Object.keys(this.listeners).length.toString()}`;
		this.listeners[<any>key] = func;
		return () => delete this.listeners[<any>key];
	}

	once(fn: Listener<T>) {
		const stop = this.listen(e => {
			fn(e);
			stop();
		});
	}
}
