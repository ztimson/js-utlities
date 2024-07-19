import {PromiseProgress} from './promise-progress';

export type UploadOptions = {
	url: string;
	file: File;
	headers?: {[key: string]: string};
	withCredentials?: boolean;
}

export function uploadWithProgress(options: UploadOptions) {
	return new PromiseProgress((res, rej, prog) => {
		const xhr = new XMLHttpRequest();
		const formData = new FormData();
		formData.append('file', options.file);

		xhr.withCredentials = !!options.withCredentials
		Object.entries(options.headers || {}).forEach(([key, value]) => xhr.setRequestHeader(key, value));
		xhr.upload.addEventListener('progress', (event) => event.lengthComputable ? prog(event.loaded / event.total) : null);
		xhr.upload.addEventListener('load', (resp) => res(resp));
		xhr.upload.addEventListener('error', (err) => rej(err));

		xhr.open('POST', options.url);
		xhr.send(formData);
	});
}
