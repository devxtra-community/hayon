import express, { Application } from "express";
import fs from "fs";
import cors from "cors";
import path from "path";
import https from "https";
import { createServer } from "http";

// [==={ dependencies }===]
import passport from "./config/passport";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

// [==={ config }===]
import connectDB from "./config/database";
import { connectRabbitMQ } from "./config/rabbitmq";
import { initSocket } from "./config/socket";
import { ENV } from "./config/env";

// [==={ routes }===]
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import profileRoutes from "./routes/profile.routes";
import generativeRoutes from "./routes/generative.routes";
import analyticsRoutes from "./routes/analytics.routes";
import platformRoutes from "./routes/platform.routes";
import postRoutes from "./routes/post.routes";
import adminRoutes from "./routes/admin.routes";
import notificationRoutes from "./routes/notification.routes";

// [==={ middleware / handlers }===]
import { notFoundHandler, serverErrorHandler } from "./middleware/error.middleware";

// [==={ utils }===]
import { SuccessResponse } from "./utils/responses";
import logger from "./utils/logger";

// [==={ cron job }===]
import { AnalyticsCronService } from "./services/cron/analytics.cron";

// =====================================================================================
// =====================================================================================

export let io: any;
const expressInstance: Application = express();

const bootstrap = async () => {
  await connectDB();
  await connectRabbitMQ();

  AnalyticsCronService.init();

  const corsOptions = {
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      if (!origin) return callback(null, true);

      if (origin === ENV.APP.FRONTEND_URL || origin === "http://localhost:3001") {
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
  appRouter.use("/generate", generativeRoutes);
  appRouter.use("/analytics", analyticsRoutes);
  appRouter.use("/admin", adminRoutes);
  appRouter.use("/notifications", notificationRoutes);

  expressInstance.use(notFoundHandler);
  expressInstance.use(serverErrorHandler);

  if (ENV.APP.NODE_ENV === "production") {
    expressInstance.enable("trust proxy");
    const httpServer = createServer(expressInstance);

    httpServer.listen(ENV.APP.PORT, () => {
      io = initSocket(httpServer);
      logger.info(`🚀 Production Server running on port ${ENV.APP.PORT}`);
      console.log(`Backend running at ${ENV.APP.FRONTEND_URL}`);
    });
  } else {
    const options = {
      key: fs.readFileSync(path.join(process.cwd(), "../dev.hayon.site+2-key.pem")),
      cert: fs.readFileSync(path.join(process.cwd(), "../dev.hayon.site+2.pem")),
    };

    const httpsServer = https.createServer(options, expressInstance);
    httpsServer.listen(ENV.APP.PORT, () => {
      io = initSocket(httpsServer);
      console.log(`Backend running at https://dev.hayon.site:5000`);
      logger.info(`Development Server running on port ${ENV.APP.PORT}`);
    });
  }
};

if (require.main === module) {
  bootstrap();
}
