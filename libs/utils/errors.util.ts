export class NotFoundError extends Error{
    statusCode=404;

    constructor(message:string){
        super(message);
        Object.setPrototypeOf(this, NotFoundError.prototype);
    }
}

export class InternalServerError extends Error{
    statusCode=500;

    constructor(message:string){
        super(message);
        Object.setPrototypeOf(this,InternalServerError.prototype);

    }
}

export class ConflictError extends Error {
  statusCode = 409;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ConflictError.prototype);
  }
}

export class BadRequestError extends Error {
  statusCode = 400;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, BadRequestError.prototype);
  }
}

export class UnprocessableEntityError extends Error {
    statusCode=422;

    constructor(message:string){
        super(message);
        Object.setPrototypeOf(this,UnprocessableEntityError.prototype);
    }
}

export class ForbiddenError extends Error {
  statusCode = 403;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, ForbiddenError.prototype);
  }
}



export class TooManyRequestsError extends Error {
  statusCode = 429;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, TooManyRequestsError.prototype);
  }
}

export class RateLimitError extends Error {
  statusCode = 429;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, RateLimitError.prototype);
  }
}