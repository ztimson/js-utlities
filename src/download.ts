import {TypedEmitter, TypedEvents} from './emitter.ts';

export type downloadEvents = TypedEvents & {
	complete: (blob: Blob) => any;
	progress: (progress: number) => any;
}

export function download(href: any, name: string) {
	const a = document.createElement('a');
	a.href = href;
	a.download = name;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
}

/**
 * Download a URL using fetch so progress can be tracked. Uses Typed Emitter to emit a "progress" &
 * "complete" event.
 *
 * @param {string} url
 * @param {string} downloadName
 * @return {TypedEmitter<downloadEvents>}
 */
export function downloadProgress(url: string, downloadName?: string) {
	const emitter = new TypedEmitter<downloadEvents>();
	fetch(url).then(response => {
		const contentLength = response.headers.get('Content-Length') || '0';
		const total = parseInt(contentLength, 10);
		let chunks: any[] = [], loaded = 0;
		const reader = response.body?.getReader();
		reader?.read().then(function processResult(result) {
			if(result.done) {
				const blob = new Blob(chunks);
				if(downloadName) {
					const url = URL.createObjectURL(blob);
					download(url, downloadName);
					URL.revokeObjectURL(url);
				}
				emitter.emit('complete', blob);
			} else {
				const chunk = result.value;
				chunks.push(chunk);
				loaded += chunk.length;
				const progress = loaded / total;
				emitter.emit('progress', progress);
				reader.read().then(processResult);
			}
		});
	});
	return emitter;
}
