# Stripe & Subscription Testing Masterclass

Testing a subscription system requires simulating both user actions (Frontend) and asynchronous events from Stripe (Webhooks). This guide walks you through the complete flow.

---

## 1. Prerequisites

### Stripe CLI (Essential)
You cannot test webhooks easily without the Stripe CLI. It forwards events from Stripe's servers to your `localhost`.

1.  **Login**: `stripe login`
2.  **Forward Webhooks**:
    ```bash
    stripe listen --forward-to https://dev.hayon.site:5000/api/payments/webhook
    ```
3.  **Get Secret**: The CLI will print a `whsec_...` key. Copy this into your backend `.env` as `STRIPE_WEBHOOK_SECRET`.

---

## 2. Test Scenario 1: The Checkout Flow (New Pro User)

This tests the logic from the pricing page all the way to the database upgrade.

1.  **Initial State**: Ensure your user is on the **Free** plan (check the "Plan Info" card in Settings).
2.  **Trigger**: Go to `/pricing` and click **Upgrade to Pro**.
3.  **Action**: You will be redirected to Stripe Checkout. Use the test card:
    *   **Card Number**: `4242 4242 4242 4242`
    *   **Expiry**: Any future date
    *   **CVC**: Any 3 digits
4.  **Verification (Success Page)**: You should be redirected back to `/payment/success`.
5.  **Verification (Database)**: 
    *   Check your `users` collection in MongoDB. 
    *   `subscription.plan` should now be `"pro"`.
    *   `limits.maxPosts` should be `100`.
6.  **Verification (UI)**: The Settings page should now show the "Pro" badge and the "Manage Billing" button.

---

## 3. Test Scenario 2: Monthly Renewal (Auto-Pilot)

This tests if our system correctly resets usage counters every month.

1.  **Trigger**: While your user is Pro, use the Stripe CLI to simulate a successful monthly payment:
    ```bash
    stripe trigger invoice.payment_succeeded
    ```
2.  **Verification**: 
    *   Check backend logs: You should see `Subscription renewed for user...`.
    *   In the DB, `subscription.currentPeriodEnd` should have moved forward by 1 month.
    *   `usage.postsCreated` and `usage.captionGenerations` should be reset to `0`.

---

## 4. Test Scenario 3: Payment Failure (The "Past Due" State)

This tests the graceful degradation and the warning banners.

1.  **Trigger**: Simulate a failed renewal payment:
    ```bash
    stripe trigger invoice.payment_failed
    ```
2.  **Verification**:
    *   Check backend logs: `Payment failed... — set to pastDue`.
    *   **UI Check**: Open the Settings page. You should see a **Red Warning Banner** saying "Payment Failed" with a link to fix it.
    *   **Functional Check**: The user **still has Pro access** (this prevents frustrating users over a 1-day card delay).

---

## 5. Test Scenario 4: Self-Service Cancellation

1.  **Trigger**: On the Settings page, click **Cancel Subscription**.
2.  **Action**: Confirm the cancellation in the Hayon modal.
3.  **Verification**:
    *   The backend calls `stripe.subscriptions.update` with `cancel_at_period_end: true`.
    *   The UI shows an **Amber Banner**: "Cancellation Scheduled" with the date.
    *   The DB flag `subscription.cancelAtPeriodEnd` becomes `true`.
4.  **Final Expiry**: To test the final downgrade (when the month actually ends):
    ```bash
    stripe trigger customer.subscription.deleted
    ```
    *   User should now be back on the **Free** plan in the UI.

---

## 6. Test Scenario 5: Usage Limits (The Bouncer)

1.  **Trigger**: (Optional) Manually edit your user in MongoDB and set `usage.postsCreated` to `29`.
2.  **Action**: Try to create a post as a Free user. It should work.
3.  **Action**: Create one more post.
4.  **Verification**: The next attempt should return a `403 Forbidden` with the message: `Post creation limit reached (30/30). Upgrade to Pro for more.`

---

## 7. Troubleshooting Webhooks

If you trigger an event but nothing happens:
- **Check Stripe CLI Output**: Does it show `POST /api/payments/webhook 200 OK`?
- **Invalid Signature Error**: Ensure your `STRIPE_WEBHOOK_SECRET` in `.env` matches the one shown in the `stripe listen` terminal.
- **Raw Body Issue**: Ensure `app.ts` has the `express.raw()` line **above** `express.json()`. (We already did this, but it's the #1 cause of failures).

**Happy Testing!** 🛠️
