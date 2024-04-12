import {TypedEmitter, type TypedEvents} from './emitter';
import {clean} from './objects';

export type Interceptor = (request: Response, next: () => void) => void;

export type RequestOptions = {
	url?: string;
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	headers?: {[key: string | symbol]: string | null | undefined};
	[key: string]: any;
}

export type XhrEvents = TypedEvents & {
	'REQUEST': (request: Promise<any>, options: RequestOptions) => any;
	'RESPONSE': (response: Response, options: RequestOptions) => any;
	'REJECTED': (response: Error, options: RequestOptions) => any;

};

export type XhrOptions = {
	interceptors?: Interceptor[];
	url?: string;
}

export class XHR extends TypedEmitter<XhrEvents> {
	private static headers: {[key: string]: string} = {};
	private static interceptors: {[key: string]: Interceptor} = {};

	private headers: {[key: string]: string} = {}
	private interceptors: {[key: string]: Interceptor} = {}

	constructor(public readonly opts: XhrOptions = {}) {
		super();
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

			this.emit(`${resp.status}`, resp, opts);
			if(!resp.ok) throw Error(resp.statusText);
			this.emit('RESPONSE', resp, opts);
			if(resp.headers.get('Content-Type')?.startsWith('application/json')) return await resp.json();
			if(resp.headers.get('Content-Type')?.startsWith('text/plain')) return await <any>resp.text();
			return resp;
		}).catch((err: Error) => {
			this.emit('REJECTED', err, opts);
			throw err;
		});
		this.emit('REQUEST', req, opts)
		return req;
	}
}
