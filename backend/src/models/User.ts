import mongoose, { Document, Schema,Types } from 'mongoose';

export interface IUser extends Document {
_id: Types.ObjectId;
  email: string;
  name: string;
  avatar?: string;
  auth: {
    provider: 'google' | 'email';
    google_id?: string;
    password_hash?: string;
    email_verified: boolean;
    otp_code?: string;
    otp_expires?: Date;
  };
  subscription: {
    plan: 'free' | 'pro';
    status: 'active' | 'cancelled' | 'past_due';
    stripe_customer_id?: string;
    stripe_subscription_id?: string;
    current_period_start?: Date;
    current_period_end?: Date;
  };
  usage: {
    posts_this_month: number;
    posts_limit: number;
    ai_generations_this_month: number;
    ai_generations_limit: number;
    last_reset: Date;
    lifetime_stats: {
      total_posts: number;
      total_ai_generations: number;
    };
  };
  settings: {
    timezone: string;
    notifications: {
      email_on_post_published: boolean;
      email_on_post_failed: boolean;
    };
  };
  role: 'user' | 'admin';
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    avatar: String,
    auth: {
      provider: {
        type: String,
        enum: ['google', 'email'],
        required: true,
      },
      google_id: String,
      password_hash: String,
      email_verified: {
        required: true,
        type: Boolean,
        default: false,
      },
        otp_code: String,
        otp_expires: Date,
    },
    subscription: {
      plan: {
        type: String,
        enum: ['free', 'pro'],
        default: 'free',
      },
      status: {
        type: String,
        enum: ['active', 'cancelled', 'past_due'],
        default: 'active',
      },
      stripe_customer_id: String,
      stripe_subscription_id: String,
      current_period_start: Date,
      current_period_end: Date,
    },
    
    usage: {
      posts_this_month: {
        type: Number,
        default: 0,
      },
      posts_limit: {
        type: Number,
        default: 10, // Free tier limit
      },
      ai_generations_this_month: {
        type: Number,
        default: 0,
      },
      ai_generations_limit: {
        type: Number,
        default: 30, // Free tier limit
      },
      last_reset: {
        type: Date,
        default: Date.now,
      },
      lifetime_stats: {
        total_posts: {
          type: Number,
          default: 0,
        },
        total_ai_generations: {
          type: Number,
          default: 0,
        },
      },
    },
    
    settings: {
      timezone: {
        type: String,
        default: 'America/New_York',
      },
      notifications: {
        email_on_post_published: {
          type: Boolean,
          default: true,
        },
        email_on_post_failed: {
          type: Boolean,
          default: true,
        },
      },
    },
    
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },
    
    last_login: Date,
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  }
);


export default mongoose.model<IUser>('User', UserSchema);