import { ApiResponse } from "./ApiResponse.js";

class ApiResponseBuilder {
  constructor() {
    this.statusCode = 200;
    this.message = "Success";
    this.data = null;
  }

  setStatusCode(code) {
    this.statusCode = code;
    return this;
  }

  setMessage(msg) {
    this.message = msg;
    return this;
  }

  setData(data) {
    this.data = data;
    return this;
  }

  build() {
    return new ApiResponse({
      statusCode: this.statusCode,
      message: this.message,
      data: this.data,
    });
  }
}

export {ApiResponseBuilder}