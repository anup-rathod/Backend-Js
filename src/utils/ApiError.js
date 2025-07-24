import { ApiErrorBuilder } from "./ApiErrorBuilder.js";

class ApiError extends Error {
  constructor({ statusCode, message, errors, stack }) {
    super(message || "Something went wrong");
    this.statusCode = statusCode || 500;
    this.errors = errors || [];
    this.data = null;
    this.success = false;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.constructor);
    }
  }

    // Static builder entry
    static builder() {
        return new ApiErrorBuilder();
    }
}

export { ApiError }