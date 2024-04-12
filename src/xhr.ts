import {clean} from './objects';

export type Interceptor = (request: Response, next: () => void) => void;

export type RequestOptions = {
	url?: string;
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	headers?: {[key: string | symbol]: string | null | undefined};
	[key: string]: any;
}

export type XhrOptions = {
	headers?: {[key: string | symbol]: string | null | undefined};
	interceptors?: Interceptor[];
	url?: string;
}

export class XHR {
	private static interceptors: {[key: string]: Interceptor} = {};

	static headers: {[key: string]: string | null | undefined} = {};

	private interceptors: {[key: string]: Interceptor} = {}

	headers: {[key: string]: string | null | undefined} = {}

	constructor(public readonly opts: XhrOptions = {}) {
		this.headers = opts.headers || {};
		if(opts.interceptors) {
			opts.interceptors.forEach(i => XHR.addInterceptor(i));
		}
	}

	static addInterceptor(fn: Interceptor): () => void {
		const key = Object.keys(XHR.interceptors).length.toString();
		XHR.interceptors[key] = fn;
		return () => { XHR.interceptors[key] = <any>null; }
	}

	addInterceptor(fn: Interceptor): () => void {
		const key = Object.keys(this.interceptors).length.toString();
		this.interceptors[key] = fn;
		return () => { this.interceptors[key] = <any>null; }
	}

	async request<T>(opts: RequestOptions = {}): Promise<T>  {
		if(!this.opts.url && !opts.url) throw new Error('Momentum server URL needs to be set');
		const url = (opts.url?.startsWith('http') ? opts.url : (this.opts.url || '') + opts.url).replace(/([^:]\/)\/+/g, '$1');

		// Prep headers
		const headers = <any>clean({
			'Content-Type': (opts.body && !(opts.body instanceof FormData)) ? 'application/json' : undefined,
			...XHR.headers,
			...this.headers,
			...opts.headers
		});

		// Send request
		const req = fetch(url, {
			headers,
			method: opts.method || (opts.body ? 'POST' : 'GET'),
			body: (headers['Content-Type']?.startsWith('application/json') && opts.body) ? JSON.stringify(opts.body) : opts.body
		}).then(async resp => {
			for(let fn of [...Object.values(XHR.interceptors), ...Object.values(this.interceptors)]) {
				const wait = new Promise(res => fn(resp, () => res(null)));
				await wait;
			}

			if(!resp.ok) throw Error(resp.statusText);
			if(resp.headers.get('Content-Type')?.startsWith('application/json')) return await resp.json();
			if(resp.headers.get('Content-Type')?.startsWith('text/plain')) return await <any>resp.text();
			return resp;
		}).catch((err: Error) => {
			throw err;
		});
		return req;
	}
}
