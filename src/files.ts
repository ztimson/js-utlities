import {makeArray} from './array.ts';
import {JSONAttemptParse} from './json.ts';
import {PromiseProgress} from './promise-progress';
import {formatDate} from './time.ts';

/**
 * Download blob as a file
 *
 * @param {Blob} blob File as a blob
 * @param {string} name Name blob will be downloaded as
 */
export function downloadFile(blob: Blob | string | string[], name: string) {
	if(!(blob instanceof Blob)) blob = new Blob(makeArray(blob));
	const url = URL.createObjectURL(blob);
	downloadUrl(url, name);
	URL.revokeObjectURL(url);
}

/**
 * Download a file from a URL
 *
 * @param href URL that will be downloaded
 * @param {string} name Override download name
 */
export function downloadUrl(href: any, name?: string) {
	const a = document.createElement('a');
	a.href = href;
	a.download = name || href.split('/').pop();
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
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
 * Extract text from a file
 *
 * @param file File to extract text from
 * @return {Promise<string | null>} File contents
 */
export function fileText(file: any): Promise<string | null> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(<string>reader.result);
		reader.onerror = () => reject(reader.error);
		reader.readAsText(file);
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
	const timestamp = formatDate('YYYY-MM-DD_HH-mm', date);
	return name ? name.replace('{{TIMESTAMP}}', timestamp) : timestamp;
}

/**
 * Upload file to URL with progress callback using PromiseProgress
 * Works in both browser (with progress) and Node.js (fallback without progress)
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
	// Browser environment - use XMLHttpRequest for progress
	if (typeof XMLHttpRequest !== 'undefined') {
		return new PromiseProgress<T>((res, rej, prog) => {
			const xhr = new XMLHttpRequest();
			const formData = new FormData();
			options.files.forEach(f => formData.append('files', f));

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

	// Node.js environment - fallback to fetch without progress
	return new PromiseProgress<T>(async (res, rej) => {
		try {
			const formData = new FormData();
			options.files.forEach(f => formData.append('files', f));
			const response = await fetch(options.url, {method: 'POST', headers: options.headers || {}, body: formData});
			if(!response.ok) {
				const error = await response.text();
				rej(JSONAttemptParse(error));
			} else {
				const result = await response.text();
				res(<T>JSONAttemptParse(result));
			}
		} catch (error) {
			rej(error);
		}
	});
}
