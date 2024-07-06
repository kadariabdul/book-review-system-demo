class CustomError extends Error {
  statusCode: number;
  stack?: any;
  code?: string;

  constructor(message: string, statusCode: number,  code?: string, stack?: string) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.stack = stack;
  }
}

export default CustomError;
