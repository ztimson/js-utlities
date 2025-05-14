import {
	CustomError,
	BadRequestError,
	UnauthorizedError,
	PaymentRequiredError,
	ForbiddenError,
	NotFoundError,
	MethodNotAllowedError,
	NotAcceptableError,
	InternalServerError,
	NotImplementedError,
	BadGatewayError,
	ServiceUnavailableError,
	GatewayTimeoutError,
	errorFromCode
} from '../src';

describe('CustomError Hierarchy', () => {
	it('CustomError basic properties and code getter/setter', () => {
		const err = new CustomError('Test', 501);
		expect(err.message).toBe('Test');
		expect(err.code).toBe(501);
		err.code = 404;
		expect(err.code).toBe(404);
		// default code if not provided
		const noCodeError = new CustomError('No code');
		expect(noCodeError.code).toBe(500);
	});

	it('CustomError static from method copies properties and stack', () => {
		const orig: any = new Error('oops');
		orig.code = 402;
		orig.stack = 'FAKE_STACK';
		const custom = CustomError.from(orig);
		expect(custom).toBeInstanceOf(CustomError);
		expect(custom.message).toBe('oops');
		expect(custom.code).toBe(500);
		expect(custom.stack).toBe('FAKE_STACK');
	});

	it('CustomError instanceof works', () => {
		expect(CustomError.instanceof(new CustomError())).toBe(true);
		expect(CustomError.instanceof(new Error())).toBe(false);
	});

	it('CustomError toString returns message', () => {
		const err = new CustomError('foo');
		expect(err.toString()).toBe('foo');
	});

	const cases = [
		[BadRequestError, 400, 'Bad Request'],
		[UnauthorizedError, 401, 'Unauthorized'],
		[PaymentRequiredError, 402, 'Payment Required'],
		[ForbiddenError, 403, 'Forbidden'],
		[NotFoundError, 404, 'Not Found'],
		[MethodNotAllowedError, 405, 'Method Not Allowed'],
		[NotAcceptableError, 406, 'Not Acceptable'],
		[InternalServerError, 500, 'Internal Server Error'],
		[NotImplementedError, 501, 'Not Implemented'],
		[BadGatewayError, 502, 'Bad Gateway'],
		[ServiceUnavailableError, 503, 'Service Unavailable'],
		[GatewayTimeoutError, 504, 'Gateway Timeout'],
	] as const;

	describe.each(cases)(
		'%p (code=%i, defaultMessage="%s")',
		(ErrClass, code, defMsg) => {
			it('has static code, default message, and instanceof', () => {
				const e = new ErrClass();
				expect(e).toBeInstanceOf(ErrClass);
				expect(e.code).toBe(code);
				expect(e.message).toBe(defMsg);
				expect(ErrClass.instanceof(e)).toBe(true);
			});

			it('supports custom messages', () => {
				const msg = 'Custom msg';
				const e = new ErrClass(msg);
				expect(e.message).toBe(msg);
			});
		}
	);

	describe('errorFromCode', () => {
		it.each(cases)(
			'returns %p for code %i',
			(ErrClass, code, defMsg) => {
				const err = errorFromCode(code);
				expect(err).toBeInstanceOf(ErrClass);
				expect(err.code).toBe(code);
				expect(err.message).toBe(defMsg);
			}
		);
		it('overrides message if provided', () => {
			const err = errorFromCode(404, 'Nope');
			expect(err).toBeInstanceOf(NotFoundError);
			expect(err.message).toBe('Nope');
		});
		it('fallbacks to CustomError for unknown codes', () => {
			const err = errorFromCode(999, 'xyz');
			expect(err).toBeInstanceOf(CustomError);
			expect(err.code).toBe(999);
			expect(err.message).toBe('xyz');
		});
		it('handles missing message gracefully', () => {
			const err = errorFromCode(555);
			expect(err).toBeInstanceOf(CustomError);
			expect(err.code).toBe(555);
		});
	});
});
