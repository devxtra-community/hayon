// config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy, Profile as FacebookProfile } from "passport-facebook";
import User from "../models/user.model";
import { ENV } from "./env";

/* =========================
   GOOGLE STRATEGY (UNCHANGED)
   ========================= */
passport.use(
  new GoogleStrategy(
    {
      clientID: ENV.GOOGLE.CLIENT_ID as string,
      clientSecret: ENV.GOOGLE.CLIENT_SECRET as string,
      callbackURL: ENV.GOOGLE.CALLBACK_URL as string,
    },
    async (_accessToken, _refreshToken, profile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();
        if (!email) return done(null, false, { message: "no_email" });

        let user = await User.findOne({ "auth.googleId": profile.id });

        if (!user) {
          const existingEmailUser = await User.findOne({ email });
          if (existingEmailUser) {
            return done(null, false, {
              message: "email_exists_different_provider",
            });
          }

          user = await User.create({
            email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            auth: {
              provider: "google",
              googleId: profile.id,
            },
            role: "user",
            lastLogin: new Date(),
          });
        } else {
          user.lastLogin = new Date();
          await user.save();
        }

        return done(null, {
          userId: user._id.toString(),
          role: user.role,
        });
      } catch (error) {
        return done(error as Error, false);
      }
    },
  ),
);

/* =========================
   FACEBOOK STRATEGY (NEW)
   ========================= */

passport.use(
  new FacebookStrategy(
    {
      clientID: ENV.META.CLIENT_ID as string,
      clientSecret: ENV.META.CLIENT_SECRET as string,
      callbackURL: ENV.META.CALLBACK_URL as string,
      profileFields: ["id", "displayName", "photos", "email"],
    },
    async (accessToken: string, _refreshToken: string, profile: FacebookProfile, done) => {
      try {
        const email = profile.emails?.[0]?.value?.toLowerCase();

        if (!email) {
          return done(null, false, { message: "no_email" });
        }

        let user = await User.findOne({ "auth.facebookId": profile.id });

        if (!user) {
          const existingEmailUser = await User.findOne({ email });
          if (existingEmailUser) {
            return done(null, false, {
              message: "email_exists_different_provider",
            });
          }

          user = await User.create({
            email,
            name: profile.displayName,
            avatar: profile.photos?.[0]?.value,
            auth: {
              provider: "facebook",
              facebookId: profile.id,
            },
            role: "user",
            lastLogin: new Date(),
          });
        } else {
          user.lastLogin = new Date();
          await user.save();
        }

        return done(null, {
          userId: user._id.toString(),
          role: user.role,
          facebookAccessToken: accessToken, // IMPORTANT for later
        });
      } catch (error) {
        return done(error as Error, false);
      }
    },
  ),
);

export default passport;
