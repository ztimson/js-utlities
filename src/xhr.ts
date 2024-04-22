import {clean} from './objects';

export type Interceptor = (request: Response, next: () => void) => void;

export type RequestOptions = {
	url?: string;
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	body?: any;
	headers?: {[key: string | symbol]: string | null | undefined};
	skipConverting?: boolean;
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

	download(opts: RequestOptions & {url: string}) {
		this.request<Response>({...opts, skipConverting: true}).then(async resp => {
			const blob = await resp.blob();
			download(URL.createObjectURL(blob), <string>opts.url.split('/').pop());
			URL.revokeObjectURL(opts.url);
		});
	}

	async request<T>(opts: RequestOptions = {}): Promise<T>  {
		if(!this.opts.url && !opts.url) throw new Error('URL needs to be set');
		const url = (opts.url?.startsWith('http') ? opts.url : (this.opts.url || '') + (opts.url || '')).replace(/([^:]\/)\/+/g, '$1');

		// Prep headers
		const headers = <any>clean({
			'Content-Type': (opts.body && !(opts.body instanceof FormData)) ? 'application/json' : undefined,
			...XHR.headers,
			...this.headers,
			...opts.headers
		});

		// Send request
		return fetch(url, {
			headers,
			method: opts.method || (opts.body ? 'POST' : 'GET'),
			body: (headers['Content-Type']?.startsWith('application/json') && opts.body) ? JSON.stringify(opts.body) : opts.body
		}).then(async resp => {
			for(let fn of [...Object.values(XHR.interceptors), ...Object.values(this.interceptors)]) {
				await new Promise<void>(res => fn(resp, () => res()));
			}

			if(!resp.ok) throw new Error(resp.statusText);
			if(!opts.skipConverting && resp.headers.get('Content-Type')?.startsWith('application/json')) return await resp.json();
			if(!opts.skipConverting && resp.headers.get('Content-Type')?.startsWith('text/plain')) return await <any>resp.text();
			return resp;
		});
	}
}

export function download(href: any, name: string) {
	const a = document.createElement('a');
	a.href = href;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}
