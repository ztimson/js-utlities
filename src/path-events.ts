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
 * Shorthand for creating PathedEvent from a string
 *
 * @example
 * ```ts
 * const event: PathedEvent = PE`users/system:*`;
 * ```
 *
 * @param {TemplateStringsArray} str String that will be parsed into PathedEvent
 * @param {string} args
 * @return {PathEvent} PathedEvent object
 */
export function PE(str: TemplateStringsArray, ...args: string[]) {
	const combined = [];
	for(let i = 0; i < str.length || i < args.length; i++) {
		if(str[i]) combined.push(str[i]);
		if(args[i]) combined.push(args[i]);
	}
	return new PathEvent(combined.join(''));
}

/**
 * Shorthand for creating PathedEvent strings, ensures paths are correct
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

/**
 * A pathed event broken down into its core components for easy processing
 * PathedEvent Structure: `module/path/name:property:method`
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
	methods!: Method[];
	/** All/Wildcard specified */
	all!: boolean;
	/** None specified */
	none!: boolean;
	/** Create method specified */
	create!: boolean;
	/** Read method specified */
	read!: boolean;
	/** Update method specified */
	update!: boolean;
	/** Delete method specified */
	delete!: boolean;

	constructor(pathedEvent: string | PathEvent) {
		if(typeof pathedEvent == 'object') return Object.assign(this, pathedEvent);
		let [p, scope, method] = pathedEvent.split(':');
		if(!method) method = scope || '*';
		if(p == '*' || !p && method == '*') {
			p = '';
			method = '*';
		}
		let temp = p.split('/').filter(p => !!p);
		this.module = temp.splice(0, 1)[0]?.toLowerCase() || '';
		this.fullPath = p;
		this.path = temp.join('/');
		this.name = temp.pop() || '';
		this.methods = <Method[]>method.split('');
		this.all = method?.includes('*');
		this.none = method?.includes('n');
		this.create = !method?.includes('n') && (method?.includes('*') || method?.includes('w') || method?.includes('c'));
		this.read = !method?.includes('n') && (method?.includes('*') || method?.includes('r'));
		this.update = !method?.includes('n') && (method?.includes('*') || method?.includes('w') || method?.includes('u'));
		this.delete = !method?.includes('n') && (method?.includes('*') || method?.includes('w') || method?.includes('d'));
	}

	/**
	 * Combine multiple pathed events into one parsed object. Longest path takes precedent, but all subsequent methods are
	 * combined until a "none" is reached
	 *
	 * @param {string | PathEvent} paths PathedEvents as strings or pre-parsed
	 * @return {PathEvent} Final combined permission
	 */
	static combine(paths: (string | PathEvent)[]): PathEvent {
		let hitNone = false;
		const combined = paths.map(p => new PathEvent(p))
			.toSorted((p1, p2) => {
				const l1 = p1.fullPath.length, l2 = p2.fullPath.length;
				return l1 < l2 ? 1 : (l1 > l2 ? -1 : 0);
			}).reduce((acc, p) => {
				if(p.none) hitNone = true;
				if(!acc) return p;
				if(hitNone) return acc;
				if(p.all) acc.all = true;
				if(p.all || p.create) acc.create = true;
				if(p.all || p.read) acc.read = true;
				if(p.all || p.update) acc.update = true;
				if(p.all || p.delete) acc.delete = true;
				acc.methods = [...acc.methods, ...p.methods];
				return acc;
			}, <any>null);
		if(combined.all) combined.methods = ['*'];
		if(combined.none) combined.methods = ['n'];
		combined.methods = new ASet(combined.methods); // Make unique
		combined.raw = PES`${combined.fullPath}:${combined.methods}`;
		return combined;
	}

	/**
	 * Squash 2 sets of paths & return true if any overlap is found
	 *
	 * @param {string | PathEvent | (string | PathEvent)[]} target Array of PathedEvents as strings or pre-parsed
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
			const combined = PathEvent.combine(filtered);
			return !combined.none && (combined.all || new ASet(combined.methods).intersection(new ASet(r.methods)).length);
		});
	}

	/**
	 * Squash 2 sets of paths & return true if the target has all paths
	 *
	 * @param {string | PathEvent | (string | PathEvent)[]} target Array of PathedEvents as strings or pre-parsed
	 * @param has Target must have all these paths
	 * @return {boolean} Whether there is any overlap
	 */
	static hasAll(target: string | PathEvent | (string | PathEvent)[], ...has: (string | PathEvent)[]): boolean {
		return has.filter(h => PathEvent.has(target, h)).length == has.length;
	}

	/**
	 * Same as `has` but raises an error if there is no overlap
	 *
	 * @param {string | string[]} target Array of PathedEvents as strings or pre-parsed
	 * @param has Target must have at least one of these path
	 */
	static hasFatal(target: string | PathEvent | (string | PathEvent)[], ...has: (string | PathEvent)[]): void {
		if(!PathEvent.has(target, ...has)) throw new Error(`Requires one of: ${makeArray(has).join(', ')}`);
	}

	/**
	 * Same as `hasAll` but raises an error if the target is missing any paths
	 *
	 * @param {string | string[]} target Array of PathedEvents as strings or pre-parsed
	 * @param has Target must have all these paths
	 */
	static hasAllFatal(target: string | PathEvent | (string | PathEvent)[], ...has: (string | PathEvent)[]): void {
		if(!PathEvent.hasAll(target, ...has)) throw new Error(`Requires all: ${makeArray(has).join(', ')}`);
	}

	/**
	 * Create pathed event string from its components
	 *
	 * @param {string | string[]} path Event path
	 * @param {Method} methods Event method
	 * @return {string} String representation of PathedEvent
	 */
	static toString(path: string | string[], methods: Method | Method[]): string {
		let p = makeArray(path).filter(p => p != null).join('/');
		if(methods?.length) p += `:${makeArray(methods).map(m => m.toLowerCase()).join('')}`;
		return p?.trim().replaceAll(/\/{2,}/g, '/').replaceAll(/(^\/|\/$)/g, '');
	}

	/**
	 * Create pathed event string from its components
	 *
	 * @return {string} String representation of PathedEvent
	 */
	toString() {
		return PathEvent.toString(this.fullPath, this.methods);
	}
}

export type PathListener = (event: PathEvent, ...args: any[]) => any;
export type PathUnsubscribe = () => void;

export interface IPathedEventEmitter {
	emit(event: string, ...args: any[]): void;
	off(listener: PathListener): void;
	on(event: string, listener: PathListener): PathUnsubscribe;
	once(event: string, listener?: PathListener): Promise<any>;
	relayEvents(emitter: PathedEventEmitter): void;
}

/**
 * Event emitter that uses paths allowing listeners to listen to different combinations of modules, paths & methods
 */
export class PathedEventEmitter implements IPathedEventEmitter{
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

	relayEvents(emitter: IPathedEventEmitter) {
		emitter.on('*', (event, ...args) => this.emit(event, ...args));
	}
}
