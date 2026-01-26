# S3 Bucket Configuration for Public Profile Images

## Problem
Profile images uploaded to S3 are returning 403 Forbidden because they're uploaded as private objects.

## Solution
Configure your S3 bucket to allow public-read ACL on objects.

## Steps to Configure S3 Bucket

### 1. Enable ACLs on the Bucket

Go to AWS S3 Console → Your Bucket → Permissions → Object Ownership

Set to: **ACLs enabled** (instead of "Bucket owner enforced")

### 2. Configure Block Public Access Settings

Go to AWS S3 Console → Your Bucket → Permissions → Block Public Access

**Uncheck** these two settings (keep the others checked):
- ❌ Block public access to buckets and objects granted through new access control lists (ACLs)
- ❌ Block public access to buckets and objects granted through any access control lists (ACLs)

**Keep these checked:**
- ✅ Block public access to buckets and objects granted through new public bucket or access point policies
- ✅ Block public and cross-account access to buckets and objects through any public bucket or access point policies

### 3. Test the Upload Again

After making these changes:
1. Delete the existing profile image in your app (triggers S3 deletion)
2. Upload a new profile image
3. The new image should be publicly accessible

## Alternative: Bucket Policy (if you don't want to use ACLs)

If you prefer not to use ACLs, you can use a bucket policy instead:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::hayon-app-images/profiles/*"
    }
  ]
}
```

This makes all objects in the `profiles/` folder publicly readable without needing ACLs.

## Current Status

✅ Code updated to include `ACL: 'public-read'` in presigned upload URLs
⏳ Waiting for bucket configuration
🔄 Need to re-upload profile image after bucket is configured
