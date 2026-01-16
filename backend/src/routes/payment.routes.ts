import express from "express";
import { createCheckoutSession } from "../controllers/payment.controller";

const paymentRouter = express.Router();

paymentRouter.post("/create-checkout-session", createCheckoutSession);

export default paymentRouter;
