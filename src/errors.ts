import {XHR} from './xhr';

XHR.addInterceptor((resp: Response, next: () => {}) => {
	if(resp.status == 200) return next();
	if(resp.status == 400) throw new BadRequestError(resp.statusText);
	if(resp.status == 401) throw new UnauthorizedError(resp.statusText);
	if(resp.status == 403) throw new ForbiddenError(resp.statusText);
	if(resp.status == 404) throw new NotFoundError(resp.statusText);
	if(resp.status == 500) throw new InternalServerError(resp.statusText);
	throw new CustomError(resp.statusText, resp.status);
});

export class CustomError extends Error {
	static code = 500;

	private _code?: number;
	get code(): number { return this._code || (<any>this).constructor.code; }
	set code(c: number) { this._code = c; }

	constructor(message?: string, code?: number) {
		super(message);
		if(code != null) this._code = code;
	}

	static from(err: Error): CustomError {
		const code = Number((<any>err).statusCode) ?? Number((<any>err).code);
		const newErr = new this(err.message || err.toString());
		return Object.assign(newErr, {
			stack: err.stack,
			...err,
			code: code ?? undefined
		});
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code != undefined;
	}

	toString() {
		return this.message || super.toString();
	}
}

export class BadRequestError extends CustomError {
	static code = 400;

	constructor(message: string = 'Bad Request') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class UnauthorizedError extends CustomError {
	static code = 401;

	constructor(message: string = 'Unauthorized') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class ForbiddenError extends CustomError {
	static code = 403;

	constructor(message: string = 'Forbidden') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class NotFoundError extends CustomError {
	static code = 404;

	constructor(message: string = 'Not Found') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class InternalServerError extends CustomError {
	static code = 500;

	constructor(message: string = 'Internal Server Error') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}
