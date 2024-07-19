export type ProgressCallback = (progress: number) => any;

export class PromiseProgress<T> extends Promise<T> {
	private listeners: ProgressCallback[] = [];

	private _progress = 0;
	get progress() { return this._progress; }
	set progress(p: number) {
		if(p == this._progress) return;
		this._progress = p;
		this.listeners.forEach(l => l(p));
	}

	constructor(executor: (resolve: (value: T) => any, reject: (reason: any) => void, progress: (progress: number) => any) => void) {
		super((resolve, reject) => executor(
			(value: T) => resolve(value),
			(reason: any) => reject(reason),
			(progress: number) => this.progress = progress,
		));
	}

	static from<T>(promise: Promise<T>): PromiseProgress<T> {
		if(promise instanceof PromiseProgress) return promise;
		return new PromiseProgress<T>((res, rej) => promise
			.then((...args) => res(...args))
			.catch((...args) => rej(...args)));
	}

	private from(promise: Promise<T>): PromiseProgress<T> {
		const newPromise = PromiseProgress.from(promise);
		this.onProgress(p => newPromise.progress = p);
		return newPromise;
	}

	onProgress(callback: ProgressCallback) {
		this.listeners.push(callback);
		return this;
	}

	then(res?: (v: T) => any, rej?: (err: any) => any): PromiseProgress<any> {
		const resp = super.then(res, rej);
		return this.from(resp);
	}

	catch(rej?: (err: any) => any): PromiseProgress<any> {
		return this.from(super.catch(rej));
	}

	finally(res?: () => any): PromiseProgress<any> {
		return this.from(super.finally(res));
	}
}
