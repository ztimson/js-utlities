export type FetchInterceptor = (resp: Response, next: () => any) => any;

export class XHR<T> {
	private static interceptors: {[key: number]: FetchInterceptor} = {};
	static headers: Record<string, string | null> = {};

	private interceptors: {[key: string]: FetchInterceptor} = {};

	constructor(public readonly baseUrl: string,
				public readonly headers: Record<string, string | null> = {}
	) { }

	static addInterceptor(fn: FetchInterceptor): () => {};
	static addInterceptor(key: string, fn: FetchInterceptor): () => {};
	static addInterceptor(keyOrFn: string | FetchInterceptor, fn?: FetchInterceptor): () => {} {
		const func: any = fn ? fn : keyOrFn;
		const key: string = typeof keyOrFn == 'string' ? keyOrFn :
			`_${Object.keys(XHR.interceptors).length.toString()}`;
		XHR.interceptors[<any>key] = func;
		return () => delete XHR.interceptors[<any>key];
	}

	addInterceptor(fn: FetchInterceptor): () => {};
	addInterceptor(key: string, fn: FetchInterceptor): () => {};
	addInterceptor(keyOrFn: string | FetchInterceptor, fn?: FetchInterceptor): () => {} {
		const func: any = fn ? fn : keyOrFn;
		const key: string = typeof keyOrFn == 'string' ? keyOrFn :
			`_${Object.keys(this.interceptors).length.toString()}`;
		this.interceptors[<any>key] = func;
		return () => delete this.interceptors[<any>key];
	}

	getInterceptors() {
		return [...Object.values(XHR.interceptors), ...Object.values(this.interceptors)];
	}

	fetch<T2 = T>(href?: string, body?: any, opts: any = {}): Promise<T2> {
		const headers =  {
			'Content-Type': (body && !(body instanceof FormData)) ? 'application/json' : undefined,
			...XHR.headers,
			...this.headers,
			...opts.headers
		};
		Object.keys(headers).forEach(h => { if(!headers[h]) delete headers[h]; });
		return fetch(`${this.baseUrl}${href || ''}`.replace(/([^:]\/)\/+/g, '$1'), {
			headers,
			method: opts.method || (body ? 'POST' : 'GET'),
			body: (headers['Content-Type']?.startsWith('application/json') && body) ? JSON.stringify(body) : body
		}).then(async resp => {
			for(let fn of this.getInterceptors()) {
				const wait = new Promise(res =>
					fn(resp, () => res(null)));
				await wait;
			}
			if(resp.headers.has('Content-Type')) {
				if(resp.headers.get('Content-Type')?.startsWith('application/json')) return await resp.json();
				if(resp.headers.get('Content-Type')?.startsWith('text/plain')) return await resp.text();
			}
			return resp;
		});
	}

	delete<T2 = void>(url?: string, opts?: any): Promise<T2> {
		return this.fetch(url, null, {method: 'delete', ...opts});
	}

	get<T2 = T>(url?: string, opts?: any): Promise<T2> {
		return this.fetch(url, null, {method: 'get', ...opts});
	}

	patch<T2 = T>(data: T2, url?: string, opts?: any): Promise<T2> {
		return this.fetch(url, data, {method: 'patch', ...opts});
	}

	post<T2 = T>(data: T2, url?: string, opts?: any): Promise<T2> {
		return this.fetch(url, data, {method: 'post', ...opts});
	}

	put<T2 = T>(data: Partial<T2>, url?: string, opts?: any): Promise<T2> {
		return this.fetch(url, data, {method: 'put', ...opts});
	}

	new<T2 = T>(href: string, headers: Record<string, string | null>): XHR<T2> {
		const fetch = new XHR<T2>(`${this.baseUrl}${href}`, {
			...this.headers,
			...headers,
		});
		Object.entries(this.interceptors).map(([key, value]) =>
			fetch.addInterceptor(key, value));
		return fetch;
	}
}
