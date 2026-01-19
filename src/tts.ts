import {removeEmojis} from './string.ts';

export class TTS {
	private static readonly QUALITY_PATTERNS = ['Google', 'Microsoft', 'Samantha', 'Premium', 'Natural', 'Neural'];
	private static _errorHandlerInstalled = false;

	private _currentUtterance: SpeechSynthesisUtterance | null = null;
	private _voicesLoaded: Promise<void>;
	private _stoppedUtterances = new WeakSet<SpeechSynthesisUtterance>();

	private _rate: number = 1.0;
	get rate(): number { return this._rate; }
	set rate(value: number) {
		this._rate = value;
		if(this._currentUtterance) this._currentUtterance.rate = value;
	}

	private _pitch: number = 1.0;
	get pitch(): number { return this._pitch; }
	set pitch(value: number) {
		this._pitch = value;
		if(this._currentUtterance) this._currentUtterance.pitch = value;
	}

	private _volume: number = 1.0;
	get volume(): number { return this._volume; }
	set volume(value: number) {
		this._volume = value;
		if(this._currentUtterance) this._currentUtterance.volume = value;
	}

	private _voice: SpeechSynthesisVoice | undefined;
	get voice(): SpeechSynthesisVoice | undefined { return this._voice; }
	set voice(value: SpeechSynthesisVoice | undefined) {
		this._voice = value;
		if(this._currentUtterance && value) this._currentUtterance.voice = value;
	}

	constructor(config?: {rate?: number; pitch?: number; volume?: number; voice?: SpeechSynthesisVoice | null}) {
		TTS.installErrorHandler();
		this._voicesLoaded = this.initializeVoices();
		if(config) {
			if(config.rate !== undefined) this._rate = config.rate;
			if(config.pitch !== undefined) this._pitch = config.pitch;
			if(config.volume !== undefined) this._volume = config.volume;
			this._voice = config.voice === null ? undefined : (config.voice || undefined);
		}
	}

	private static installErrorHandler(): void {
		if(this._errorHandlerInstalled) return;
		window.addEventListener('unhandledrejection', (event) => {
			if(event.reason?.error === 'interrupted' && event.reason instanceof SpeechSynthesisErrorEvent) event.preventDefault();
		});
		this._errorHandlerInstalled = true;
	}

	private initializeVoices(): Promise<void> {
		return new Promise((resolve) => {
			const voices = window.speechSynthesis.getVoices();
			if(voices.length > 0) {
				if(!this._voice) this._voice = TTS.bestVoice();
				resolve();
			} else {
				const handler = () => {
					window.speechSynthesis.removeEventListener('voiceschanged', handler);
					if(!this._voice) this._voice = TTS.bestVoice();
					resolve();
				};
				window.speechSynthesis.addEventListener('voiceschanged', handler);
			}
		});
	}

	private static bestVoice(lang = 'en'): SpeechSynthesisVoice | undefined {
		const voices = window.speechSynthesis.getVoices();
		for (const pattern of this.QUALITY_PATTERNS) {
			const voice = voices.find(v => v.name.includes(pattern) && v.lang.startsWith(lang));
			if(voice) return voice;
		}
		return voices.find(v => v.lang.startsWith(lang));
	}

	private static cleanText(text: string): string {
		return removeEmojis(text)
			.replace(/```[\s\S]*?```/g, ' code block ')
			.replace(/[#*_~`]/g, '');
	}

	private createUtterance(text: string): SpeechSynthesisUtterance {
		const cleanedText = TTS.cleanText(text);
		const utterance = new SpeechSynthesisUtterance(cleanedText);
		const voice = this._voice || TTS.bestVoice();
		if(voice) utterance.voice = voice;
		utterance.rate = this._rate;
		utterance.pitch = this._pitch;
		utterance.volume = this._volume;
		return utterance;
	}

	async speak(text: string): Promise<void> {
		if(!text.trim()) return Promise.resolve();
		await this._voicesLoaded;
		return new Promise((resolve, reject) => {
			this._currentUtterance = this.createUtterance(text);
			const utterance = this._currentUtterance;
			utterance.onend = () => {
				this._currentUtterance = null;
				resolve();
			};
			utterance.onerror = (error) => {
				this._currentUtterance = null;
				if(this._stoppedUtterances.has(utterance) && error.error === 'interrupted') resolve();
				else reject(error);
			};
			window.speechSynthesis.speak(utterance);
		});
	}

	stop(): void {
		if(this._currentUtterance) this._stoppedUtterances.add(this._currentUtterance);
		window.speechSynthesis.cancel();
		this._currentUtterance = null;
	}

	speakStream(): {next: (text: string) => void, done: () => Promise<void>} {
		let buffer = '';
		let streamPromise: Promise<void> = Promise.resolve();
		const sentenceRegex = /[^.!?\n]+[.!?\n]+/g;
		return {
			next: (text: string): void => {
				buffer += text;
				const sentences = buffer.match(sentenceRegex);
				if(sentences) {
					sentences.forEach(sentence => streamPromise = this.speak(sentence.trim()));
					buffer = buffer.replace(sentenceRegex, '');
				}
			},
			done: async (): Promise<void> => {
				if(buffer.trim()) {
					streamPromise = this.speak(buffer.trim());
					buffer = '';
				}
				await streamPromise;
			}
		};
	}
}
