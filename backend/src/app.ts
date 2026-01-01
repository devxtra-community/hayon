import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/database";
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import passport from "./config/passport";
import { notFoundHandler, serverErrorHandler } from "./middleware/error.middleware";
import { ENV } from "./config/env";
import helmet from "helmet";
import { SuccessResponse } from "./utils/responses";
import morgan from "morgan";
import logger from "./utils/logger";

const expressInstance: Application = express();

connectDB();

const corsOptions = {
  origin: ENV.APP.FRONTEND_URL,
  credentials: true,
};

// TODO: use windston and morgan.

expressInstance.use(morgan("dev"));
expressInstance.use(cors(corsOptions));
expressInstance.use(helmet());
expressInstance.use(cookieParser());
expressInstance.use(express.json());
expressInstance.use(express.urlencoded({ extended: true }));
expressInstance.use(passport.initialize());

expressInstance.get("/health", (req, res) => {
  new SuccessResponse("Server is running").send(res);
});

const appRouter = express.Router();

expressInstance.use("/api", appRouter);

appRouter.use("/auth", authRoutes);
appRouter.use("/payments", paymentRoutes);

expressInstance.use(notFoundHandler);
expressInstance.use(serverErrorHandler);

expressInstance.listen(ENV.APP.PORT, () => {
  logger.info(`🚀 Server running on port ${ENV.APP.PORT}`);
});
