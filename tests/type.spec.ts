import {Writable} from '../src';

describe('Type Utilities', () => {
	describe('Writable', () => {
		it('should create a writable version of a readonly type', () => {
			type ReadonlyPerson = {
				readonly name: string;
				readonly age: number;
			};
			type WritablePerson = Writable<ReadonlyPerson>;
			// Typescript: WritablePerson's properties should not be readonly
			const person: WritablePerson = { name: 'Alice', age: 40 };
			person.name = 'Bob'; // Should not error in TypeScript
			person.age = 41;     // Should not error in TypeScript
			expect(person).toEqual({ name: 'Bob', age: 41 });
		});
	});
});
