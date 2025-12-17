// config/passport.ts
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.model";
import { ENV } from './env';

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

        if (!email) {
          return done(null, false, { message: "no_email" }); // ✅ Return error info
        }

        let user = await User.findOne({ "auth.googleId": profile.id });

        if (!user) {
          const existingEmailUser = await User.findOne({ email });

          if (existingEmailUser) {
            // ✅ Return specific error message
            return done(null, false, { message: "email_exists_different_provider" });
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
    }
  )
);

export default passport;