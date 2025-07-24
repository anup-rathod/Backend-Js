import { ApiError } from "./ApiError.js";


class ApiErrorBuilder {
  constructor() {
    this.statusCode = 500;
    this.message = "Something went wrong";
    this.errors = [];
    this.stack = "";
  }

  setStatusCode(statusCode) {
    this.statusCode = statusCode;
    return this;
  }

  setMessage(message) {
    this.message = message;
    return this;
  }

  setErrors(errors) {
    this.errors = errors;
    return this;
  }

  setStack(stack) {
    this.stack = stack;
    return this;
  }

  build() {
    return new ApiError({
      statusCode: this.statusCode,
      message: this.message,
      errors: this.errors,
      stack: this.stack,
    });
  }
}

export { ApiErrorBuilder };
