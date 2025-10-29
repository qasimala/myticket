# PeachPayments Integration Setup

## Environment Variables

Add these to your Convex environment variables using `npx convex env`:

### Required Variables

```bash
# PeachPayments Entity ID (from PeachPayments dashboard)
npx convex env set PEACHPAYMENTS_ENTITY_ID your_entity_id_here

# PeachPayments Access Token (from PeachPayments dashboard)
npx convex env set PEACHPAYMENTS_ACCESS_TOKEN your_access_token_here

# Test Mode (set to 'false' for production)
npx convex env set PEACHPAYMENTS_TEST_MODE true

# Your site URL for payment redirects
npx convex env set SITE_URL http://localhost:3000
```

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

