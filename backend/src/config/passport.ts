import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/user.model';



// need to do as repository.

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: process.env.GOOGLE_CALLBACK_URL as string,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Check if user exists
        let user = await User.findOne({ 'auth.googleId': profile.id });
        
        if (user) {
          // Update last login
          user.lastLogin = new Date();
          await user.save();
          return done(null, user);
        }
        
        // Check if email exists with different provider
        user = await User.findOne({ email: profile.emails?.[0].value });
        
        if (user) {
          return done(
            new Error('Email already registered with different method'),
            false
          );
        }
        
        // Create new user
        user = await User.create({
          email: profile.emails?.[0].value,
          name: profile.displayName,
          avatar: profile.photos?.[0].value,
          auth: {
            provider: 'google',
            googleId: profile.id,
            emailVerified: true,
          },
          role: 'user',
          lastLogin: new Date(),
        });
        
        done(null, user);
      } catch (error) {
        done(error as Error, false);
      }
    }
  )
);

export default passport;