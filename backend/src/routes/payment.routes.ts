import express from 'express';
import { createCheckoutSession } from '../controllers/payment.controller';

const router = express.Router();

router.post('/create-checkout-session', createCheckoutSession);

export default router;