import express, { Application } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import passport from "passport";
import dotenv from "dotenv";
import connectDB from "./config/database";
import authRoutes from "./routes/auth.routes";
import paymentRoutes from "./routes/payment.routes";
import "./config/passport";

dotenv.config();

const expressInstance: Application = express();
const PORT = process.env.PORT || 5000;

connectDB();

const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
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

appRouter.use("/auth", authRoutes);
appRouter.use("/payments", paymentRoutes);
// /api/<routename>

expressInstance("/api", appRouter);

// Separate to middleware folder
expressInstance.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// TODO: Separte to its own file
expressInstance.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error",
  });
});

expressInstance.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
