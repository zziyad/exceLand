async () => {

    const error = class AppError extends Error {
        constructor(msg, code) {
            super(msg);
            this.code = code;
            this.status = code >= `${code}`.startsWith(4) ? 'error' : 'fail';
            Error.captureStackTrace(this, this.constructor);
            this.msg = msg;
        }
    }

    return error;
}