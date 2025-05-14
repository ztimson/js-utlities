/** Mark all properties as writable */
export type Writable<T> = {
	-readonly [P in keyof T]: T[P]
};
