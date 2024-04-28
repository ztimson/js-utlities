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
			(progress: number) => this.progress = progress
		));
	}

	onProgress(callback: ProgressCallback) {
		this.listeners.push(callback);
		return this;
	}
}
