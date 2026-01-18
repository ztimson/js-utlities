import {removeEmojis} from './string.ts';

export class TTS {
	private static readonly QUALITY_PATTERNS = ['Google', 'Microsoft', 'Samantha', 'Premium', 'Natural', 'Neural'];

	private _currentUtterance: SpeechSynthesisUtterance | null = null;
	private _voicesLoaded: Promise<void>;
	private _isStopping: boolean = false;

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

	/** Create a TTS instance with optional configuration */
	constructor(config?: {rate?: number; pitch?: number; volume?: number; voice?: SpeechSynthesisVoice | null}) {
		this._voicesLoaded = this.initializeVoices();
		if(config) {
			if(config.rate !== undefined) this._rate = config.rate;
			if(config.pitch !== undefined) this._pitch = config.pitch;
			if(config.volume !== undefined) this._volume = config.volume;
			this._voice = config.voice === null ? undefined : (config.voice || undefined);
		}
	}

	/** Initializes voice loading and sets default voice if needed */
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

	/**
	 * Selects the best available TTS voice, prioritizing high-quality options
	 * @param lang Speaking language
	 * @returns Highest quality voice
	 */
	private static bestVoice(lang = 'en'): SpeechSynthesisVoice | undefined {
		const voices = window.speechSynthesis.getVoices();
		for (const pattern of this.QUALITY_PATTERNS) {
			const voice = voices.find(v => v.name.includes(pattern) && v.lang.startsWith(lang));
			if(voice) return voice;
		}
		return voices.find(v => v.lang.startsWith(lang));
	}

	/** Cleans text for TTS by removing emojis, markdown and code block */
	private static cleanText(text: string): string {
		return removeEmojis(text)
			.replace(/```[\s\S]*?```/g, ' code block ')
			.replace(/[#*_~`]/g, '');
	}

	/** Creates a speech utterance with current options */
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

	/** Speaks text and returns a Promise which resolves once complete */
	async speak(text: string): Promise<void> {
		if(!text.trim()) return Promise.resolve();
		await this._voicesLoaded;
		return new Promise((resolve, reject) => {
			this._currentUtterance = this.createUtterance(text);
			this._currentUtterance.onend = () => {
				this._currentUtterance = null;
				resolve();
			};
			this._currentUtterance.onerror = (error) => {
				this._currentUtterance = null;
				if(this._isStopping && error.error === 'interrupted') resolve();
				else reject(error);
			};
			window.speechSynthesis.speak(this._currentUtterance);
		});
	}

	/** Stops all TTS */
	stop(): void {
		this._isStopping = true;
		window.speechSynthesis.cancel();
		this._currentUtterance = null;
		setTimeout(() => { this._isStopping = false; }, 0);
	}

	/**
	 * Initialize a stream that chunks text into sentences and speak them.
	 *
	 * @example
	 * const stream = tts.speakStream();
	 * stream.next("Hello ");
	 * stream.next("World. How");
	 * stream.next(" are you?");
	 * await stream.done();
	 *
	 * @returns Object with next function for passing chunk of streamed text and done for completing the stream
	 */
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
