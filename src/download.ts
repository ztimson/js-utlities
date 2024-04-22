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

export function downloadStream(url: string, name?: string) {
	const emitter = new TypedEmitter<downloadEvents>();
	fetch(url).then(response => {
		const contentLength = response.headers.get('Content-Length') || '0';
		const total = parseInt(contentLength, 10);
		let chunks: any[] = [], loaded = 0;
		const reader = response.body?.getReader();
		reader?.read().then(function processResult(result) {
			if(result.done) {
				const blob = new Blob(chunks);
				emitter.emit('progress', 1);
				if(name) {
					const url = URL.createObjectURL(blob);
					download(url, name);
					URL.revokeObjectURL(url);
				}
				emitter.emit('complete', blob);
				return;
			} else {
				const chunk = result.value;
				chunks.push(chunk);
				loaded += chunk.length;
				const progress = Math.round((loaded / total) * 100);
				emitter.emit('progress', progress);
				reader.read().then(processResult);
			}
		});
	});
	return emitter;
}
