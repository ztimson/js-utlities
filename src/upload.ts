import {TypedEmitter, TypedEvents} from './emitter';

export type UploadEvents = TypedEvents & {
	complete: () => any;
	failed: (err: Error) => any;
	progress: (progress: number) => any;
}

function uploadProgress(files : File | FileList, url: string) {
	const xhr = new XMLHttpRequest();
	const progress = new TypedEmitter<UploadEvents>();
	const formData = new FormData();
	(Array.isArray(files) ? files : [files])
		.forEach(f => formData.append('file', f));

	xhr.upload.addEventListener("progress", (event) => {
		if(event.lengthComputable) progress.emit('progress', event.loaded / event.total);
	});

	xhr.onreadystatechange = () => {
		if (xhr.readyState === 4) {
			if(xhr.status >= 200 && xhr.status < 300) progress.emit('complete');
			else progress.emit('failed', new Error(xhr.responseText));
		}
	};

	xhr.open("POST", url, true);
	xhr.send(formData);
	return progress;
}
