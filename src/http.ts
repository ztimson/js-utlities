import {clean} from './objects';
import {PromiseProgress} from './promise-progress';

export type DecodedResponse<T> = Response & {data: T | null}

export type HttpInterceptor = (response: Response, next: () => void) => void;

export type HttpRequestOptions = {
	body?: any;
	decode?: boolean;
	fragment?: string;
	headers?: {[key: string | symbol]: string | null | undefined};
	method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
	query?: {key: string, value: string}[] | {[key: string]: string};
	url?: string;
	[key: string]: any;
}

export type HttpDefaults = {
	headers?: {[key: string | symbol]: string | null | undefined};
	interceptors?: HttpInterceptor[];
	url?: string;
}

export class Http {
	private static interceptors: {[key: string]: HttpInterceptor} = {};

	static headers: {[key: string]: string | null | undefined} = {};

	private interceptors: {[key: string]: HttpInterceptor} = {}

	headers: {[key: string]: string | null | undefined} = {}
	url!: string | null;

	constructor(defaults: HttpDefaults = {}) {
		this.url = defaults.url ?? null;
		this.headers = defaults.headers || {};
		if(defaults.interceptors) {
			defaults.interceptors.forEach(i => Http.addInterceptor(i));
		}
	}

	static addInterceptor(fn: HttpInterceptor): () => void {
		const key = Object.keys(Http.interceptors).length.toString();
		Http.interceptors[key] = fn;
		return () => { Http.interceptors[key] = <any>null; }
	}

	addInterceptor(fn: HttpInterceptor): () => void {
		const key = Object.keys(this.interceptors).length.toString();
		this.interceptors[key] = fn;
		return () => { this.interceptors[key] = <any>null; }
	}

	request<T>(opts: HttpRequestOptions = {}): PromiseProgress<DecodedResponse<T>>  {
		if(!this.url && !opts.url) throw new Error('URL needs to be set');
		let url = (opts.url?.startsWith('http') ? opts.url : (this.url || '') + (opts.url || '')).replace(/([^:]\/)\/+/g, '$1');
		if(opts.fragment) url.includes('#') ? url.replace(/#.*(\?|\n)/g, (match, arg1) => `#${opts.fragment}${arg1}`) : url += '#' + opts.fragment;
		if(opts.query) {
			const q = Array.isArray(opts.query) ? opts.query :
				Object.keys(opts.query).map(k => ({key: k, value: (<any>opts.query)[k]}))
			url += (url.includes('?') ? '&' : '?') + q.map(q => `${q.key}=${q.value}`).join('&');
		}

		// Prep headers
		const headers = <any>clean({
			'Content-Type': !opts.body ? undefined : (opts.body instanceof FormData ? 'multipart/form-data' : 'application/json'),
			...Http.headers,
			...this.headers,
			...opts.headers
		});

		if(typeof opts.body == 'object' && opts.body != null && headers['Content-Type'] == 'application/json')
			opts.body = JSON.stringify(opts.body);

		// Send request
		return new PromiseProgress((res, rej, prog) => {
			fetch(url, {
				headers,
				method: opts.method || (opts.body ? 'POST' : 'GET'),
				body: opts.body
			}).then(async (resp: any) => {
				for(let fn of [...Object.values(Http.interceptors), ...Object.values(this.interceptors)]) {
					await new Promise<void>(res => fn(resp, () => res()));
				}

				const contentLength = resp.headers.get('Content-Length');
				const total = contentLength ? parseInt(contentLength, 10) : 0;
				let loaded = 0;

				const reader = resp.body?.getReader();
				const stream = new ReadableStream({
					start(controller) {
						function push() {
							reader?.read().then((event: any) => {
								if(event.done) return controller.close();
								loaded += event.value.byteLength;
								prog(loaded / total);
								controller.enqueue(event.value);
								push();
							}).catch((error: any) => controller.error(error));
						}
						push();
					}
				});

				resp.data = new Response(stream);
				if(opts.decode == null || opts.decode) {
					const content = resp.headers.get('Content-Type')?.toLowerCase();
					if(content?.includes('form')) resp.data = <T>await resp.data.formData();
					else if(content?.includes('json')) resp.data = <T>await resp.data.json();
					else if(content?.includes('text')) resp.data = <T>await resp.data.text();
					else if(content?.includes('application')) resp.data = <T>await resp.data.blob();
				}

				if(resp.ok) res(resp);
				else rej(resp);
			})
		});
	}
}
