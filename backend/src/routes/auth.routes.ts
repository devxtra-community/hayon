import express from "express";
import passport from "../config/passport";
import { googleOAuthCallback } from "../controllers/oauth.controller";
import {
  signup,
  login,
  getCurrentUser,
  logout,
  requestOtp,
  verifyOtp,
  refresh,
  logoutAll,
  sendRsetPasswordEmail,
  resetPassword,
  adminLogin,
  getDevices,
  logoutDevice,
} from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validate } from "../middleware/validate.middleware";
import {
  requestOtpSchema,
  verifyOtpSchema,
  signupSchema,
  loginSchema,
  adminLoginSchema,
  sendResetEmailSchema,
  resetPasswordSchema,
} from "@hayon/schemas";
import { ENV } from "../config/env";
import logger from "../utils/logger";
// import { Request, Response, NextFunction } from "express";
// import { AuthenticateCallback } from "passport";
import axios from "axios";
// import { SuccessResponse } from "../utils/responses";
// import { SuccessResponse } from "../utils/responses";

// import { logoutAllService } from "../services/auth.service";

const router = express.Router();

router.post("/signup", validate(signupSchema), signup);
router.post("/login", validate(loginSchema), login);
router.post("/admin-login", validate(adminLoginSchema), adminLogin);
router.post("/request-otp", validate(requestOtpSchema), requestOtp);
router.post("/verify-otp", validate(verifyOtpSchema), verifyOtp);
router.post("/refresh", refresh);

router.get("/me", authenticate, getCurrentUser);
router.post("/send-reset-email", validate(sendResetEmailSchema), sendRsetPasswordEmail);
router.post("/reset-password", validate(resetPasswordSchema), resetPassword);

// Logout user
router.delete("/logout", logout);
router.delete("/logout/all", authenticate, logoutAll);

// Device management
router.get("/devices", authenticate, getDevices);
router.delete("/devices/:tokenId", authenticate, logoutDevice);

// Google OAuth Routes
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      // ✅ Custom callback to handle errors
      if (err) {
        logger.error("Google OAuth error:", err);
        return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=google_auth_failed`);
      }

      if (!user) {
        // ✅ Handle specific error messages
        const errorMessage = info?.message || "google_auth_failed";
        return res.redirect(`${ENV.APP.FRONTEND_URL}/login?error=${errorMessage}`);
      }

      req.user = user;
      return next();
    })(req, res, next);
  },
  googleOAuthCallback,
);


// ==========================================
// FACEBOOK & INSTAGRAM CONNECTION
// ==========================================
router.get('/facebook/connect', (req, res) => {
  logger.info("Initializing Facebook connection...");
  const fbScopes = [
    'instagram_basic', 'instagram_content_publish', 'instagram_manage_insights',
    'pages_show_list', 'pages_read_engagement', 'public_profile', 'business_management'
  ].join(',');

  const redirectUri = process.env.META_REDIRECT_URI; // e.g. .../api/auth/facebook/callback
  const appId = process.env.META_APP_ID;

  const authUrl = `https://www.facebook.com/v24.0/dialog/oauth?` +
    `client_id=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${fbScopes}` +
    `&response_type=code`;

  res.redirect(authUrl);
});

router.get('/facebook/callback', async (req, res) => {
  const { code } = req.query;
  logger.info(`Facebook Callback received with code: ${code ? 'Yes' : 'No'}`);

  if (!code) {
    return res.status(400).send("Error: No code received from Facebook.");
  }

  try {
    // 1. Get Short-Lived Access Token
    const redirectUri = process.env.META_REDIRECT_URI;
    const response = await axios.get('https://graph.facebook.com/v24.0/oauth/access_token', {
      params: {
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        redirect_uri: redirectUri,
        code
      }
    });
    const shortToken = response.data.access_token;

    // 2. Upgrade to Long-Lived Token
    const longLivedRes = await axios.get('https://graph.facebook.com/v24.0/oauth/access_token', {
      params: {
        grant_type: 'fb_exchange_token',
        client_id: process.env.META_APP_ID,
        client_secret: process.env.META_APP_SECRET,
        fb_exchange_token: shortToken
      }
    });
    const fbLongToken = longLivedRes.data.access_token;

    // 3. DEBUG: Check Permissions
    try {
      const permissionsMock = await axios.get(`https://graph.facebook.com/me/permissions?access_token=${fbLongToken}`);
      logger.info("GRANTED PERMISSIONS:", JSON.stringify(permissionsMock.data, null, 2));
    } catch (permErr) {
      logger.error("Could not fetch permissions", permErr);
    }

    // 4. Find Page and IG
    let pageInfo = "No Page Found";
    let igInfo = "No IG Account Found";
    logger.info("Fetching FB Accounts...");
    const pages = await axios.get(`https://graph.facebook.com/me/accounts?access_token=${fbLongToken}`);

    logger.info("FULL PAGES RESPONSE:", JSON.stringify(pages.data, null, 2));

    const pageData = pages.data.data;


    if (pageData && pageData.length > 0) {
      const pageId = pageData[0].id;
      const pageName = pageData[0].name;
      pageInfo = `Page ID: ${pageId}, Name: ${pageName}`;

      try {
        const igAccount = await axios.get(`https://graph.facebook.com/${pageId}?fields=instagram_business_account&access_token=${fbLongToken}`);
        if (igAccount.data.instagram_business_account) {
          const igId = igAccount.data.instagram_business_account.id;
          igInfo = `IG Business ID: ${igId}`;
        }
      } catch (igErr) {
        logger.error("Error fetching IG account:", igErr);
        igInfo = "Error fetching IG account";
      }
    }

    res.send(`
      <h1>Facebook & Instagram Connected!</h1>
      <pre>
      FB Long Token: ${fbLongToken.substring(0, 10)}...
      Facebook Page: ${pageInfo}
      Instagram: ${igInfo}
      </pre>
      <p>Now go back and connect Threads.</p>
    `);

  } catch (error: any) {
    logger.error("FB Connect Error:", error.response?.data || error.message);
    res.status(500).send(`<h1>FB Connection Failed</h1><pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>`);
  }
});

// ==========================================
// THREADS CONNECTION
// ==========================================
router.get('/threads/connect', (req, res) => {
  logger.info("Initializing Threads connection...");
  const threadsScopes = [
    'threads_basic', 'threads_content_publish', 'threads_manage_insights'
  ].join(',');

  // Construct Threads Redirect URI (must be separate or handled carefully)
  // Assuming user will set THREADS_REDIRECT_URI or we derive it
  const redirectUri = process.env.THREADS_REDIRECT_URI
  //  || (process.env.META_REDIRECT_URI ? process.env.META_REDIRECT_URI.replace('facebook/callback', 'threads/callback').replace('meta/callback', 'threads/callback') : '');

  const appId = process.env.THREADS_APP_ID; // Usually same App ID

  logger.info(`Threads Connect Params: RedirectURI=${redirectUri}`);

  const authUrl = `https://threads.net/oauth/authorize?` +
    `client_id=${appId}` +
    `&redirect_uri=${redirectUri}` +
    `&scope=${threadsScopes}` +
    `&response_type=code`;

  res.redirect(authUrl);
});

router.get('/threads/callback', async (req, res) => {
  const { code } = req.query;
  logger.info(`Threads Callback received with code: ${code ? 'Yes' : 'No'}`);

  if (!code) {
    return res.status(400).send("Error: No code received from Threads.");
  }

  try {
    const redirectUri = process.env.THREADS_REDIRECT_URI ||
      (process.env.META_REDIRECT_URI ? process.env.META_REDIRECT_URI.replace('facebook/callback', 'threads/callback').replace('meta/callback', 'threads/callback') : '');

    // 1. Get Short-Lived Threads Token
    // Note: Threads uses POST for this exchange
    const formData = new URLSearchParams();
    formData.append('client_id', process.env.THREADS_APP_ID as string);
    formData.append('client_secret', process.env.THREADS_APP_SECRET as string);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', code as string);

    const response = await axios.post('https://graph.threads.net/oauth/access_token', formData);
    const shortToken = response.data.access_token;
    const userId = response.data.user_id; // Threads ID

    // 2. Exchange for Long-Lived Token
    const longLivedRes = await axios.get('https://graph.threads.net/access_token', {
      params: {
        grant_type: 'th_exchange_token',
        client_secret: process.env.THREADS_APP_SECRET,
        access_token: shortToken
      }
    });
    const longToken = longLivedRes.data.access_token;

    res.send(`
      <h1>Threads Connected!</h1>
      <pre>
      Threads User ID: ${userId}
      Long Token: ${longToken.substring(0, 10)}...
      </pre>
    `);

  } catch (error: any) {
    logger.error("Threads Connect Error:", error.response?.data || error.message);
    res.status(500).send(`<h1>Threads Connection Failed</h1><pre>${JSON.stringify(error.response?.data || error.message, null, 2)}</pre>`);
  }
});


export default router;
