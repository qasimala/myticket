# PeachPayments Integration Setup

## Environment Variables

⚠️ **IMPORTANT:** These variables must be set in Convex (not `.env.local`) because they're used in Convex backend functions.

### Required Variables

Run these commands for EACH deployment (dev and prod):

```bash
# For Development Deployment
npx convex env set PEACHPAYMENTS_ENTITY_ID your_entity_id_here --dev
npx convex env set PEACHPAYMENTS_ACCESS_TOKEN your_access_token_here --dev
npx convex env set PEACHPAYMENTS_TEST_MODE true --dev
npx convex env set SITE_URL http://localhost:3000 --dev

# For Production Deployment (when ready)
npx convex env set PEACHPAYMENTS_ENTITY_ID your_prod_entity_id --prod
npx convex env set PEACHPAYMENTS_ACCESS_TOKEN your_prod_access_token --prod
npx convex env set PEACHPAYMENTS_TEST_MODE false --prod
npx convex env set SITE_URL https://your-production-domain.com --prod
```

### Why Not `.env.local`?

- `.env.local` is for **Next.js frontend** only
- Fixed backend functions run in **Convex cloud**
- Convex functions can't access Next.js environment variables
- Each Convex deployment needs its own variables set separately

### Optional: Document Values Locally

You can document values in `.env.local` for reference (they won't be used):

```bash
# .env.local (for reference only - NOT used by Convex!)
# These are here just to document values, but you still need to run:
# npx convex env set PEACHPAYMENTS_ENTITY_ID <value>

PEACHPAYMENTS_ENTITY_ID=your_entity_id_here
PEACHPAYMENTS_ACCESS_TOKEN=your_access_token_here
PEACHPAYMENTS_TEST_MODE=true
SITE_URL=http://localhost:3000
```

But remember: **You still need to run the `npx convex env set` commands!**

## Getting PeachPayments Credentials

1. Sign up at [PeachPayments](https://www.peachpayments.com/)
2. Log in to your dashboard
3. Navigate to **Settings** → **API Keys**
4. Copy your **Entity ID** and **Access Token**
5. Use test credentials for development

## Testing

For testing, use PeachPayments test cards:
- **Success**: 4200000000000000
- **Insufficient Funds**: 4000300011112220
- **Declined**: 4000300011112220

## Webhook URL

Once deployed, configure your webhook URL in PeachPayments dashboard:
```
https://your-domain.convex.site/payment-webhook
```

## Payment Flow

1. User adds tickets to cart
2. User proceeds to checkout
3. Booking created with "pending" status
4. User redirected to PeachPayments
5. User completes payment
6. PeachPayments webhook updates booking status
7. User redirected to confirmation page
