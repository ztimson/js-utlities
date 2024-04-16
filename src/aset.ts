export class ASet<T> extends Array {
	get size() {
		return this.length;
	}

	constructor(elements: T[] = []) {
		super();
		if(!!elements?.['forEach'])
			elements.forEach(el => this.add(el));
	}

	add(el: T) {
		if(!this.has(el)) this.push(el);
	}

	delete(el: T) {
		const index = this.indexOf(el);
		if(index != -1) this.slice(index, 1);
	}

	difference(set: ASet<T>) {
		return new ASet<T>(this.reduce((acc, el) => {
			if(!set.has(el)) acc.push(el);
			return acc;
		}, []));
	}

	has(el: T) {
		return this.indexOf(el) != -1;
	}

	intersection(set: ASet<T>) {
		return new ASet<T>(this.reduce((acc, el) => {
			if(set.has(el)) acc.push(el);
			return acc;
		}, []));
	}

	isDisjointFrom(set: ASet<T>) {
		return this.intersection(set).size == 0;
	}

	isSubsetOf(set: ASet<T>) {
		return this.findIndex(el => !set.has(el)) == -1;
	}

	isSuperset(set: ASet<T>) {
		return set.findIndex(el => !this.has(el)) == -1;
	}

	symmetricDifference(set: ASet<T>) {
		return new ASet([...this.difference(set), ...set.difference(this)]);
	}

	union(set: ASet<T> | Array<T>) {
		return new ASet([...this, ...set]);
	}
}
