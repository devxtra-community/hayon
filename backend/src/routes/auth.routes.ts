import express from 'express';
import passport from 'passport';
import { signup, login, getCurrentUser, logout, requestOtp, verifyOtp } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { generateToken } from '../utils/jwt';
import cookieParser from 'cookie-parser';

const router = express.Router();

router.use(cookieParser())


router.post('/signup', signup);
router.post('/login', login);
router.post("/auth/request-otp", requestOtp);
router.post("/auth/verify-otp", verifyOtp);

router.get('/me', authenticate, getCurrentUser);

// Logout user
router.delete('/logout',logout)

// Google OAuth Routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    session: false,
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google_auth_failed`,
  }),
  (req, res) => {
    try {
      const user = req.user as any;
      
      const token = generateToken({
        userId: user._id.toString(),
        email: user.email,
        role: user.role,
      });

      // Set token in HTTP-only cookie (NOT in URL)
      res.cookie('token', token, {
        httpOnly: true,      // JavaScript can't access it
        secure: process.env.NODE_ENV === 'production', // HTTPS only in production
        sameSite: 'lax',     // CSRF protection
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });
      
      // Redirect WITHOUT token in URL
      res.redirect(`${process.env.FRONTEND_URL}/auth/callback?success=true`);
    } catch (error) {
      res.redirect(`${process.env.FRONTEND_URL}/login?error=token_generation_failed`);
    }
  }
);

export default router;