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