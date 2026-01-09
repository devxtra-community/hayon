import OAuth from "oauth-1.0a";
import crypto from "crypto";

export const tumblrOAuth = new OAuth({
  consumer: {
    key: process.env.TUMBLR_CONSUMER_KEY!,
    secret: process.env.TUMBLR_CONSUMER_SECRET!,
  },
  signature_method: "HMAC-SHA1",
  hash_function(base, key) {
    return crypto.createHmac("sha1", key).update(base).digest("base64");
  },
});
