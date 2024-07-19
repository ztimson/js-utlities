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
