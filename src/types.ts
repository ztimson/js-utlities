/**
 * Return keys on a type as an array of strings
 *
 * @example
 * ```ts
 * type Person = {
 * 	  firstName: string;
 * 	  lastName: string;
 * 	  age: number;
 * }
 *
 * const keys = typeKeys<Person>();
 * console.log(keys); // Output: ["firstName", "lastName", "age"]
 * ```
 *
 * @return {Array<keyof T>} Available keys
 */
export function typeKeys<T extends object>() {
	return Object.keys(<T>{}) as Array<keyof T>;
}
