import { Request, Response } from "express";
import Stripe from "stripe";
import { SuccessResponse,ErrorResponse } from "../utils/responses";
import {ENV} from "../config/env";
import logger from "../utils/logger";

const stripe = new Stripe(ENV.STRIPE.SECRET_KEY as string);

export const createCheckoutSession = async (req: Request, res: Response): Promise<void> => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Pro Plan",
              description: "Monthly subscription",
            },
            unit_amount: 999,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${ENV.APP.FRONTEND_URL}/payment/success`,
      cancel_url: `${ENV.APP.FRONTEND_URL}/payment/cancel`,
    });

    new SuccessResponse("Checkout session created", { data: { url: session.url } }).send(res);

  } catch (error) {
    logger.error("Stripe error:", error);
    new ErrorResponse("Payment session creation failed", { status: 500 }).send(res);
  }
};
