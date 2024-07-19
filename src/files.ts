import {PromiseProgress} from './promise-progress.ts';

export function download(href: any, name: string) {
	const a = document.createElement('a');
	a.href = href;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

export function downloadBlob(blob: Blob, name: string) {
	const url = URL.createObjectURL(blob);
	download(url, name);
	URL.revokeObjectURL(url);
}

export function fileBrowser(options: {accept?: string, multiple?: boolean} = {}): Promise<File[]> {
	return new Promise(res => {
		const input = document.createElement('input');
		input.type = 'file';
		input.accept = options.accept || '*';
		input.style.display='none';
		input.multiple = !!options.multiple;
		input.onblur = input.onchange = async () => {
			res(Array.from(<any>input.files));
			input.remove();
		}
		document.body.appendChild(input);
		input.click();
	});
}

export function uploadWithProgress(options: {
	url: string;
	file: File;
	headers?: {[key: string]: string};
	withCredentials?: boolean;
}) {
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
