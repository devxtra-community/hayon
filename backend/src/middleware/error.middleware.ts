import express from "express"

export function serverErrorHandler(err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
};

 
export function notFoundHandler(req: express.Request, res: express.Response) {
  res.status(404).json({
    success: false,
    message: "Route not found",
  })
}