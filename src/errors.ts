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

export class PaymentRequiredError extends CustomError {
	static code = 402;

	constructor(message: string = 'Payment Required') {
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

export class MethodNotAllowedError extends CustomError {
	static code = 405;

	constructor(message: string = 'Method Not Allowed') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class NotAcceptableError extends CustomError {
	static code = 406;

	constructor(message: string = 'Not Acceptable') {
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

export class NotImplementedError extends CustomError {
	static code = 501;

	constructor(message: string = 'Not Implemented') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class BadGatewayError extends CustomError {
	static code = 502;

	constructor(message: string = 'Bad Gateway') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class ServiceUnavailableError extends CustomError {
	static code = 503;

	constructor(message: string = 'Service Unavailable') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}

export class GatewayTimeoutError extends CustomError {
	static code = 504;

	constructor(message: string = 'Gateway Timeout') {
		super(message);
	}

	static instanceof(err: Error) {
		return (<any>err).constructor.code == this.code;
	}
}
