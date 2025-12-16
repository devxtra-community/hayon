import { Response } from "express";

interface SuccessOptions {
  data?: any;
  status?: number;
}

export class SuccessResponse {
  constructor(
    private message: string,
    private options: SuccessOptions = {}
  ) {}

  send(res: Response) {
    const { data = null, status = 200 } = this.options;

    return res.status(status).json({
      success: true,
      message: this.message,
      data,
    });
  }
}




interface ErrorOptions {
  data?: any;
  status?: number;
}

export class ErrorResponse {
  constructor(
    private message: string,
    private options: ErrorOptions = {}
  ) {}

  send(res: Response) {
    const { data = null, status = 400 } = this.options;

    return res.status(status).json({
      success: false,
      message: this.message,
      data,
    });
  }
}
