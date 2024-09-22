import {JSONAttemptParse} from './objects.ts';
import {PromiseProgress} from './promise-progress';

/**
 * Download a file from a URL
 *
 * @param href URL that will be downloaded
 * @param {string} name Override download name
 */
export function download(href: any, name?: string) {
	const a = document.createElement('a');
	a.href = href;
	a.download = name || href.split('/').pop();
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

/**
 * Download blob as a file
 *
 * @param {Blob} blob File as a blob
 * @param {string} name Name blob will be downloaded as
 */
export function downloadBlob(blob: Blob, name: string) {
	const url = URL.createObjectURL(blob);
	download(url, name);
	URL.revokeObjectURL(url);
}

/**
 * Open filebrowser & return selected file
 *
 * @param {{accept?: string, multiple?: boolean}} options accept - selectable mimetypes, multiple - Allow selecting more than 1 file
 * @return {Promise<File[]>} Array of selected files
 */
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

/**
 * Create timestamp intended for filenames from a date
 *
 * @param {string} name Name of file, `{{TIMESTAMP}}` will be replaced
 * @param {Date | number | string} date Date to use for timestamp
 * @return {string} Interpolated filename, or the raw timestamp if name was omitted
 */
export function timestampFilename(name?: string, date: Date | number | string = new Date()) {
	if(typeof date == 'number' || typeof date == 'string') date = new Date(date);
	const timestamp = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}_${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
	return name ? name.replace('{{TIMESTAMP}}', timestamp) : timestamp;
}

/**
 * Upload file to URL with progress callback using PromiseProgress
 *
 * @param {{url: string, files: File[], headers?: {[p: string]: string}, withCredentials?: boolean}} options
 * @return {PromiseProgress<T>} Promise of request with `onProgress` callback
 */
export function uploadWithProgress<T>(options: {
	url: string;
	files: File[];
	headers?: {[key: string]: string};
	withCredentials?: boolean;
}): PromiseProgress<T> {
	return new PromiseProgress<T>((res, rej, prog) => {
		const xhr = new XMLHttpRequest();
		const formData = new FormData();
		options.files.forEach(f => formData.append('file', f));

		xhr.withCredentials = !!options.withCredentials;
		xhr.upload.addEventListener('progress', (event) => event.lengthComputable ? prog(event.loaded / event.total) : null);
		xhr.addEventListener('loadend', () => res(<T>JSONAttemptParse(xhr.responseText)));
		xhr.addEventListener('error', () => rej(JSONAttemptParse(xhr.responseText)));
		xhr.addEventListener('timeout', () => rej({error: 'Request timed out'}));

		xhr.open('POST', options.url);
		Object.entries(options.headers || {}).forEach(([key, value]) => xhr.setRequestHeader(key, value));
		xhr.send(formData);
	});
}
