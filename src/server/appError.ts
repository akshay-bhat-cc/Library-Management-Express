export enum StatusCode {
  VALIDATION_ERROR = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  SERVER_ERROR = 500,
}

class AppError {
  status: number;
  title: string;
  message: string;
  stackTrace: string | undefined;

  constructor(statusCode: StatusCode, err: Error) {
    this.status = statusCode;
    this.title = "";
    this.message = err.message;
    this.stackTrace = err.stack;

    switch (statusCode) {
      case StatusCode.VALIDATION_ERROR:
        this.title = "Validation Failed";
        break;
      case StatusCode.UNAUTHORIZED:
        this.title = "Unauthorized";
        break;
      case StatusCode.FORBIDDEN:
        this.title = "Forbidden";
        break;
      case StatusCode.NOT_FOUND:
        this.title = "Not Found";
        break;
      case StatusCode.SERVER_ERROR:
        this.title = "Server Error";
        break;
      default:
        this.title = "Unknown Error";
        this.message = "An unexpected error occurred.";
        this.stackTrace = undefined;
    }
  }
}

export default AppError;
