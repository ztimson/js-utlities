import {makeArray} from './array.ts';
import {ASet} from './aset.ts';

/**
 * Available methods:
 * * - All/Wildcard
 * n - None
 * c - Create
 * r - Read
 * u - Update
 * d - Delete
 * x - Execute
 */
export type Method = '*' | 'n' | 'c' | 'r' | 'u' | 'd' | 'x';

/**
 * Shorthand for creating Event from a string
 *
 * @example
 * ```ts
 * const event: Event = PE`users/system:*`;
 * ```
 *
 * @param {TemplateStringsArray} str String that will be parsed into Event
 * @param {string} args
 * @return {PathEvent} Event object
 */
export function PE(str: TemplateStringsArray, ...args: any[]) {
	const combined = [];
	for(let i = 0; i < str.length || i < args.length; i++) {
		if(str[i]) combined.push(str[i]);
		if(args[i]) combined.push(args[i]);
	}
	return new PathEvent(combined.join('/'));
}

/**
 * Shorthand for creating Event strings, ensures paths are correct
 *
 * @param {TemplateStringsArray} str
 * @param {string} args
 * @return {string}
 * @constructor
 */
export function PES(str: TemplateStringsArray, ...args: any[]) {
	let combined = [];
	for(let i = 0; i < str.length || i < args.length; i++) {
		if(str[i]) combined.push(str[i]);
		if(args[i]) combined.push(args[i]);
	}
	const [paths, methods] = combined.join('').split(':');
	return PathEvent.toString(paths, <any>methods?.split(''));
}

export class PathError extends Error { }

/**
 * A  event broken down into its core components for easy processing
 * Event Structure: `module/path/name:property:method`
 * Example: `users/system:crud` or `storage/some/path/file.txt:r`
 */
export class PathEvent {
	/** First directory in path */
	module!: string;
	/** Entire path, including the module & name */
	fullPath!: string;
	/** Path including the name, excluding the module */
	path!: string;
	/** Last sagment of path */
	name!: string;
	/** List of methods */
	methods!: ASet<Method>;

	/** All/Wildcard specified */
	get all(): boolean { return this.methods.has('*') }
	set all(v: boolean) { v ? new ASet<Method>(['*']) : this.methods.delete('*'); }
	/** None specified */
	get none(): boolean { return this.methods.has('n') }
	set none(v: boolean) { v ? this.methods = new ASet<Method>(['n']) : this.methods.delete('n'); }
	/** Create method specified */
	get create(): boolean { return !this.methods.has('n') && (this.methods.has('*') || this.methods.has('c')) }
	set create(v: boolean) { v ? this.methods.delete('n').delete('*').add('c') : this.methods.delete('c'); }
	/** Read method specified */
	get read(): boolean { return !this.methods.has('n') && (this.methods.has('*') || this.methods.has('r')) }
	set read(v: boolean) { v ? this.methods.delete('n').delete('*').add('r') : this.methods.delete('r'); }
	/** Update method specified */
	get update(): boolean { return !this.methods.has('n') && (this.methods.has('*') || this.methods.has('u')) }
	set update(v: boolean) { v ? this.methods.delete('n').delete('*').add('u') : this.methods.delete('u'); }
	/** Delete method specified */
	get delete(): boolean { return !this.methods.has('n') && (this.methods.has('*') || this.methods.has('d')) }
	set delete(v: boolean) { v ? this.methods.delete('n').delete('*').add('d') : this.methods.delete('d'); }

	constructor(e: string | PathEvent) {
		if(typeof e == 'object') return Object.assign(this, e);
		let [p, scope, method] = e.replaceAll(/\/{2,}/g, '/').split(':');
		if(!method) method = scope || '*';
		if(p == '*' || !p && method == '*') {
			p = '';
			method = '*';
		}
		let temp = p.split('/').filter(p => !!p);
		this.module = temp.splice(0, 1)[0]?.toLowerCase() || '';
		this.path = temp.join('/');
		this.fullPath = `${this.module}${this.module && this.path ? '/' : ''}${this.path}`;
		this.name = temp.pop() || '';
		this.methods = new ASet(<any>method.split(''));
	}

	/**
	 * Combine multiple events into one parsed object. Longest path takes precedent, but all subsequent methods are
	 * combined until a "none" is reached
	 *
	 * @param {string | PathEvent} paths Events as strings or pre-parsed
	 * @return {PathEvent} Final combined permission
	 */
	static combine(...paths: (string | PathEvent)[]): PathEvent {
		let hitNone = false;
		const combined = paths.map(p => new PathEvent(p))
			.toSorted((p1, p2) => {
				const l1 = p1.fullPath.length, l2 = p2.fullPath.length;
				return l1 < l2 ? 1 : (l1 > l2 ? -1 : 0);
			}).reduce((acc, p) => {
				if(p.none) hitNone = true;
				if(!acc) return p;
				if(hitNone) return acc;
				acc.methods = [...acc.methods, ...p.methods];
				return acc;
			}, <any>null);
		combined.methods = new ASet<Method>(combined.methods);
		return combined;
	}

	/**
	 * Filter a set of paths based on the target
	 *
	 * @param {string | PathEvent | (string | PathEvent)[]} target Array of events that will filtered
	 * @param filter {...PathEvent} Must container one of
	 * @return {boolean} Whether there is any overlap
	 */
	static filter(target: string | PathEvent | (string | PathEvent)[], ...filter: (string | PathEvent)[]): PathEvent[] {
		const parsedTarget = makeArray(target).map(pe => new PathEvent(pe));
		const parsedFind = makeArray(filter).map(pe => new PathEvent(pe));
		return parsedTarget.filter(t => {
			if(!t.fullPath && t.all) return true;
			return !!parsedFind.find(f =>
				(t.fullPath.startsWith(f.fullPath) || f.fullPath.startsWith(t.fullPath)) &&
				(f.all || t.all || t.methods.intersection(f.methods).length));
		});
	}

	/**
	 * Squash 2 sets of paths & return true if any overlap is found
	 *
	 * @param {string | PathEvent | (string | PathEvent)[]} target Array of Events as strings or pre-parsed
	 * @param has Target must have at least one of these path
	 * @return {boolean} Whether there is any overlap
	 */
	static has(target: string | PathEvent | (string | PathEvent)[], ...has: (string | PathEvent)[]): boolean {
		const parsedRequired = makeArray(has).map(pe => new PathEvent(pe));
		const parsedTarget = makeArray(target).map(pe => new PathEvent(pe));
		return !!parsedRequired.find(r => {
			if(!r.fullPath && r.all) return true;
			const filtered = parsedTarget.filter(p => r.fullPath.startsWith(p.fullPath));
			if(!filtered.length) return false;
			const combined = PathEvent.combine(...filtered);
			return (!combined.none && (combined.all || r.all)) || combined.methods.intersection(r.methods).length;
		});
	}

	/**
	 * Squash 2 sets of paths & return true if the target has all paths
	 *
	 * @param {string | PathEvent | (string | PathEvent)[]} target Array of Events as strings or pre-parsed
	 * @param has Target must have all these paths
	 * @return {boolean} Whether there is any overlap
	 */
	static hasAll(target: string | PathEvent | (string | PathEvent)[], ...has: (string | PathEvent)[]): boolean {
		return has.filter(h => PathEvent.has(target, h)).length == has.length;
	}

	/**
	 * Same as `has` but raises an error if there is no overlap
	 *
	 * @param {string | string[]} target Array of Events as strings or pre-parsed
	 * @param has Target must have at least one of these path
	 */
	static hasFatal(target: string | PathEvent | (string | PathEvent)[], ...has: (string | PathEvent)[]): void {
		if(!PathEvent.has(target, ...has)) throw new PathError(`Requires one of: ${makeArray(has).join(', ')}`);
	}

	/**
	 * Same as `hasAll` but raises an error if the target is missing any paths
	 *
	 * @param {string | string[]} target Array of Events as strings or pre-parsed
	 * @param has Target must have all these paths
	 */
	static hasAllFatal(target: string | PathEvent | (string | PathEvent)[], ...has: (string | PathEvent)[]): void {
		if(!PathEvent.hasAll(target, ...has)) throw new PathError(`Requires all: ${makeArray(has).join(', ')}`);
	}

	/**
	 * Create event string from its components
	 *
	 * @param {string | string[]} path Event path
	 * @param {Method} methods Event method
	 * @return {string} String representation of Event
	 */
	static toString(path: string | string[], methods: Method | Method[]): string {
		let p = makeArray(path).filter(p => !!p).join('/');
		p = p?.trim().replaceAll(/\/{2,}/g, '/').replaceAll(/(^\/|\/$)/g, '');
		if(methods?.length) p += `:${makeArray(methods).map(m => m.toLowerCase()).join('')}`;
		return p;
	}

	/**
	 * Filter a set of paths based on this event
	 *
	 * @param {string | PathEvent | (string | PathEvent)[]} target Array of events that will filtered
	 * @return {boolean} Whether there is any overlap
	 */
	filter(target: string | PathEvent | (string | PathEvent)[]): PathEvent[] {
		return PathEvent.filter(target, this);
	}

	/**
	 * Create  event string from its components
	 *
	 * @return {string} String representation of Event
	 */
	toString() {
		return PathEvent.toString(this.fullPath, this.methods);
	}
}

export type PathListener = (event: PathEvent, ...args: any[]) => any;
export type PathUnsubscribe = () => void;

export interface IPathEventEmitter {
	emit(event: string, ...args: any[]): void;
	off(listener: PathListener): void;
	on(event: string, listener: PathListener): PathUnsubscribe;
	once(event: string, listener?: PathListener): Promise<any>;
	relayEvents(emitter: PathEventEmitter): void;
}

/**
 * Event emitter that uses paths allowing listeners to listen to different combinations of modules, paths & methods
 */
export class PathEventEmitter implements IPathEventEmitter{
	private listeners: [PathEvent, PathListener][] = [];

	emit(event: string | PathEvent, ...args: any[]) {
		const parsed = new PathEvent(event);
		this.listeners.filter(l => PathEvent.has(l[0], event))
			.forEach(async l => l[1](parsed, ...args));
	};

	off(listener: PathListener) {
		this.listeners = this.listeners.filter(l => l[1] != listener);
	}

	on(event: string | string[], listener: PathListener): PathUnsubscribe {
		makeArray(event).forEach(e => this.listeners.push([new PathEvent(e), listener]));
		return () => this.off(listener);
	}

	once(event: string | string[], listener?: PathListener): Promise<any> {
		return new Promise(res => {
			const unsubscribe = this.on(event, (event: PathEvent, ...args: any[]) => {
				res(args.length < 2 ? args[0] : args);
				if(listener) listener(event, ...args);
				unsubscribe();
			});
		});
	}

	relayEvents(emitter: IPathEventEmitter) {
		emitter.on('*', (event, ...args) => this.emit(event, ...args));
	}
}
