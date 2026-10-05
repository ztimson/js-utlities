export interface ProgressMeta {
	start: number;
	end: number | null;
	elapsed: number; // seconds
	speed: number;   // bytes/sec
	progress: number; // 0-1
	size: number;    // bytes transferred
	total: number;   // total bytes
	eta: number | null; // seconds remaining
}

export type ProgressCallback = (meta: ProgressMeta) => any;

/**
 * A promise that tracks transfer progress (size/total/speed/eta/elapsed) via `onProgress` callback & direct getters
 *
 * @example
 * ```js
 * const promise = new PromiseProgress((resolve, reject, progress) => {
 *   const total = 100;
 * 	 for(let i = 0; i <= total; i++) progress(i, total);
 * 	 resolve(1);
 * });
 *
 * console.log(promise.progress, promise.speed, promise.eta);
 *
 * promise.onProgress(m => console.log(m.progress, m.eta))
 *        .then(console.log)
 *        .catch(console.error)
 *        .finally(...);
 * ```
 */
export class PromiseProgress<T> extends Promise<T> {
	private listeners: ProgressCallback[] = [];
	private _meta: ProgressMeta = {start: Date.now(), end: null, elapsed: 0, speed: 0, progress: 0, size: 0, total: 0, eta: null};

	get meta() { return this._meta; }
	get start() { return this._meta.start; }
	get end() { return this._meta.end; }
	get elapsed() { return this._meta.elapsed; }
	get speed() { return this._meta.speed; }
	get progress() { return this._meta.progress; }
	get size() { return this._meta.size; }
	get total() { return this._meta.total; }
	get eta() { return this._meta.eta; }

	private update(size: number, total: number) {
		const elapsed = (Date.now() - this._meta.start) / 1000;
		const speed = elapsed ? size / elapsed : 0;
		const progress = total ? size / total : this._meta.progress;
		this._meta = {...this._meta, size, total, progress, elapsed, speed, eta: speed && total ? (total - size) / speed : null};
		(this.listeners ||= []).forEach(l => l(this._meta));
	}

	constructor(executor: (resolve: (value: T) => any, reject: (reason: any) => void, progress: (size: number, total?: number) => any) => void) {
		super((resolve, reject) => executor(
			(value: T) => { this._meta = {...this._meta, end: Date.now()}; resolve(value); },
			(reason: any) => { this._meta = {...this._meta, end: Date.now()}; reject(reason); },
			(size: number, total?: number) => this.update(size, total ?? this._meta.total),
		));
	}

	static from<T>(promise: Promise<T>): PromiseProgress<T> {
		if(promise instanceof PromiseProgress) return promise;
		return new PromiseProgress<T>((res, rej) => promise.then(res).catch(rej));
	}

	private from(promise: Promise<T>): PromiseProgress<T> {
		const newPromise = PromiseProgress.from(promise);
		this.onProgress(m => newPromise.update(m.size, m.total));
		return newPromise;
	}

	onProgress(callback: ProgressCallback) {
		(this.listeners ||= []).push(callback);
		return this;
	}

	then(res?: (v: T) => any, rej?: (err: any) => any): PromiseProgress<any> {
		return this.from(super.then(res, rej));
	}

	catch(rej?: (err: any) => any): PromiseProgress<any> {
		return this.from(super.catch(rej));
	}

	finally(res?: () => any): PromiseProgress<any> {
		return this.from(super.finally(res));
	}
}
