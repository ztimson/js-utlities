export type Listener = (...args: any[]) => any;
export type TypedEvents = {[k in string | symbol]: Listener} & {'*': (event: string, ...args: any[]) => any};

export class TypedEmitter<T extends TypedEvents = TypedEvents> {
	private static listeners: {[key: string]: Listener[]} = {};

	private listeners: { [key in keyof T]?: Listener[] } = {};

	static emit(event: any, ...args: any[]) {
		(this.listeners['*'] || []).forEach(l => l(event, ...args));
		(this.listeners[event.toString()] || []).forEach(l => l(...args));
	};

	static off(event: any, listener: Listener) {
		const e = event.toString();
		this.listeners[e] = (this.listeners[e] || []).filter(l => l === listener);
	}

	static on(event: any, listener: Listener) {
		const e = event.toString();
		if(!this.listeners[e]) this.listeners[e] = [];
		this.listeners[e]?.push(listener);
		return () => this.off(event, listener);
	}

	static once(event: any, listener?: Listener): Promise<any> {
		return new Promise(res => {
			const unsubscribe = this.on(event, <any>((...args: any) => {
				res(args.length == 1 ? args[0] : args);
				if(listener) listener(...args);
				unsubscribe();
			}));
		});
	}

	emit<K extends keyof T>(event: K, ...args: Parameters<T[K]>) {
		(this.listeners['*'] || []).forEach(l => l(event, ...args));
		(this.listeners[event] || []).forEach(l => l(...args));
	};

	off<K extends keyof T = string>(event: K, listener: T[K]) {
		this.listeners[event] = (this.listeners[event] || []).filter(l => l === listener);
	}

	on<K extends keyof T = string>(event: K, listener: T[K]) {
		if(!this.listeners[event]) this.listeners[event] = [];
		this.listeners[event]?.push(listener);
		return () => this.off(event, listener);
	}

	once<K extends keyof T = string>(event: K, listener?: T[K]): Promise<any> {
		return new Promise(res => {
			const unsubscribe = this.on(event, <any>((...args: any) => {
				res(args.length == 1 ? args[0] : args);
				if(listener) listener(...args);
				unsubscribe();
			}));
		});
	}
}
