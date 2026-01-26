import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import connectDB from "./config/database";
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import profileRoutes from "./routes/profile.routes";
import passport from "./config/passport";
import { notFoundHandler, serverErrorHandler } from "./middleware/error.middleware";
import { ENV } from "./config/env";
import helmet from "helmet";
import { SuccessResponse } from "./utils/responses";
import morgan from "morgan";
import logger from "./utils/logger";
import https from "https";
import fs from "fs";
import path from "path";
import platformRoutes from "./routes/platform.routes";
import testRoutes from "./routes/test.routes"; // ⚠️ TESTING ONLY - REMOVE BEFORE PRODUCTION
import postRoutes from "./routes/post.routes";
import { connectRabbitMQ } from "./config/rabbitmq";

const expressInstance: Application = express();

const bootstrap = async () => {
  await connectDB();
  await connectRabbitMQ();

  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      if (origin === ENV.APP.FRONTEND_URL || origin === "http://localhost:3000") {
        return callback(null, true);
      } else {
        logger.warn(`Blocked CORS request from origin: ${origin}`);
        return callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  };

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

  // routes
  appRouter.use("/auth", authRoutes);
  appRouter.use("/payments", paymentRoutes);
  appRouter.use("/profile", profileRoutes);
  appRouter.use("/platform", platformRoutes);
  appRouter.use("/posts", postRoutes);
  appRouter.use("/test", testRoutes); // ⚠️ TESTING ONLY - REMOVE BEFORE PRODUCTION

  expressInstance.use(notFoundHandler);
  expressInstance.use(serverErrorHandler);

  if (ENV.APP.NODE_ENV === "production") {
    expressInstance.enable("trust proxy");

    expressInstance.listen(ENV.APP.PORT, () => {
      logger.info(`🚀 Production Server running on port ${ENV.APP.PORT}`);
      console.log(`Backend running at ${ENV.APP.FRONTEND_URL}`);
    });
  } else {
    const options = {
      key: fs.readFileSync(path.join(process.cwd(), "../dev.hayon.site+2-key.pem")),
      cert: fs.readFileSync(path.join(process.cwd(), "../dev.hayon.site+2.pem")),
    };

    https.createServer(options, expressInstance).listen(ENV.APP.PORT, () => {
      console.log(`Backend running at https://dev.hayon.site:5000`);
      logger.info(`Development Server running on port ${ENV.APP.PORT}`);
    });
  }
};

bootstrap();
