import { ApiResponseBuilder } from "./ApiResponseBuilder.js";

class ApiResponse {
  constructor({ statusCode, data, message }) {
    this.statusCode = statusCode;
    this.data = data;
    this.message = message || "Success";
    this.success = statusCode < 400;
  }

  static builder() {
    return new ApiResponseBuilder();
  }
}

export { ApiResponse };
