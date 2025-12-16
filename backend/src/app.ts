import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config();
import connectDB from "./config/database";
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import passport from "./config/passport";
import { notFoundHandler, serverErrorHandler } from "./middleware/error.middleware";
import { ENV } from "./config/env";


const expressInstance: Application = express();

connectDB();

const corsOptions = {
  origin: ENV.APP.FRONTEND_URL,
  credentials: true,
};

// TODO: use windston and morgan.
// TODO: create a single file to import all envs,

expressInstance.use(cors(corsOptions));

// TODO: use helmet


expressInstance.use(cookieParser());
expressInstance.use(express.json());
expressInstance.use(express.urlencoded({ extended: true }));
expressInstance.use(passport.initialize());

expressInstance.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

const appRouter = express.Router();

expressInstance.use("/api", appRouter);

appRouter.use("/auth", authRoutes);
appRouter.use("/payments", paymentRoutes);


expressInstance.use(notFoundHandler);
expressInstance.use(serverErrorHandler)


expressInstance.listen(ENV.APP.PORT, () => {
  console.log(`🚀 Server running on port ${ENV.APP.PORT}`);
});
