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
import platformRoutes from "./routes/platform.routes";
import session from "express-session"

const expressInstance: Application = express();

connectDB();

const corsOptions = {
  origin: ENV.APP.FRONTEND_URL,
  credentials: true,
};


expressInstance.use(
  session({
    name: "tumblr.sid",
    secret: "tumblr-secret",
    resave: false,
    saveUninitialized: true, // IMPORTANT for OAuth 1.0a
    cookie: {
      secure: false, // true only on HTTPS
      sameSite: "lax",
    },
  })
);
expressInstance.use(morgan("dev"));
expressInstance.use(cors(corsOptions));
expressInstance.use(helmet());
expressInstance.use(cookieParser());
expressInstance.use(express.json());
expressInstance.use(express.urlencoded({ extended: true }));
expressInstance.use(passport.initialize());
expressInstance.use(passport.session());

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

expressInstance.use(notFoundHandler);
expressInstance.use(serverErrorHandler);

expressInstance.listen(ENV.APP.PORT, () => {
  logger.info(`🚀 Server running on port ${ENV.APP.PORT}`);
});
