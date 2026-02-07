# Stripe Payment Integration - Implementation Guide

## Overview

The WDYM86 platform now includes full Stripe payment processing for:
- **Subscription Management** - Monthly/yearly subscription billing for restaurant tiers
- **POS Payments** - Card payments via Stripe Payment Intents
- **Cash Payments** - Local recording of cash transactions
- **Refunds** - Full and partial refunds via Stripe API
- **Webhooks** - Real-time event processing from Stripe

## Backend Implementation

### 1. Stripe Service (`backend/app/services/stripe_service.py`)

Comprehensive service handling all Stripe operations:

- **Customer Management**: Create, retrieve, and update Stripe customers
- **Subscriptions**: Create checkout sessions, manage subscriptions, handle cancellations
- **Payment Intents**: Create and confirm payments for POS orders
- **Refunds**: Process refunds for completed payments
- **Webhooks**: Verify signatures and process Stripe events

### 2. API Endpoints

#### Subscription Endpoints (`/subscriptions`)

- `POST /subscriptions/subscribe` - Create Stripe Checkout Session for subscription
- `POST /subscriptions/cancel` - Cancel subscription at period end
- `GET /subscriptions/current` - Get current subscription status
- `GET /subscriptions/tiers` - List all available tiers
- `GET /subscriptions/usage` - Get usage vs limits

#### POS Payment Endpoints (`/pos-payments`)

- `POST /pos-payments/create-payment` - Create payment (card or cash)
- `POST /pos-payments/confirm-card-payment` - Confirm Stripe payment
- `POST /pos-payments/process-cash` - Process cash payment with change calculation
- `POST /pos-payments/refund` - Refund a payment
- `GET /pos-payments/transaction/{id}` - Get transaction details

#### Webhook Endpoints (`/webhooks`)

- `POST /webhooks/stripe` - Stripe webhook handler (must be publicly accessible)
- `GET /webhooks/stripe/test` - Test webhook endpoint connectivity

### 3. Database Models

#### Updated Models:
- `Subscription` - Already has `stripe_customer_id` and `stripe_subscription_id` fields
- `PaymentTransaction` - Records all payment transactions
- `AuditLog` - NEW - Tracks all payment and subscription actions

### 4. Environment Variables

Add to `.env`:

```bash
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...  # or sk_live_... for production
STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
STRIPE_WEBHOOK_SECRET=whsec_...  # Get from Stripe Dashboard

# Stripe Price IDs (create these in Stripe Dashboard)
STRIPE_PRICE_STARTER_MONTHLY=price_...
STRIPE_PRICE_STARTER_YEARLY=price_...
STRIPE_PRICE_PRO_MONTHLY=price_...
STRIPE_PRICE_PRO_YEARLY=price_...
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_...
STRIPE_PRICE_ENTERPRISE_YEARLY=price_...
```

### 5. Setup Steps

#### Step 1: Install Stripe Python SDK

```bash
cd backend
pip install stripe>=8.0.0
```

#### Step 2: Create Stripe Account & Get Keys

1. Sign up at https://stripe.com
2. Get test keys from https://dashboard.stripe.com/test/apikeys
3. Add keys to `.env`

#### Step 3: Create Products and Prices in Stripe

In Stripe Dashboard:

1. Go to **Products** → **Add Product**
2. Create products for each tier:
   - **WDYM86 Starter Plan**
   - **WDYM86 Pro Plan**
   - **WDYM86 Enterprise Plan**
3. Add pricing:
   - Monthly price (e.g., $49/month)
   - Yearly price (e.g., $490/year - save 2 months)
4. Copy Price IDs and add to `.env`

#### Step 4: Set Up Webhook Endpoint

1. In Stripe Dashboard, go to **Developers** → **Webhooks**
2. Click **Add endpoint**
3. URL: `https://your-domain.com/webhooks/stripe`
4. Events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Copy webhook signing secret and add to `.env` as `STRIPE_WEBHOOK_SECRET`

#### Step 5: Run Database Migration

```bash
cd backend
alembic revision --autogenerate -m "add_audit_log_table"
alembic upgrade head
```

#### Step 6: Test the Integration

```bash
# Start backend
cd backend
uvicorn app.main:app --reload

# Test webhook endpoint
curl http://localhost:8000/webhooks/stripe/test
```

## Frontend Implementation

### Package Installation

```bash
cd frontend
npm install @stripe/stripe-js @stripe/react-stripe-js
```

### 1. Pricing Page Update

File: `frontend/src/pages/Pricing.tsx`

**Changes Needed:**
1. Add Stripe Elements provider
2. Replace `alert()` with Stripe Checkout redirect
3. Handle success/cancel redirects

**Implementation:**

```typescript
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

const handleSubscribe = async (tier: string, billingCycle: string) => {
  try {
    const response = await api.post(`/subscriptions/subscribe?restaurant_id=${restaurantId}`, {
      tier,
      billing_cycle: billingCycle
    });
    
    // Redirect to Stripe Checkout
    if (response.data.checkout_url) {
      window.location.href = response.data.checkout_url;
    }
  } catch (error) {
    console.error('Subscription error:', error);
    alert('Failed to start subscription process');
  }
};
```

### 2. POS Page Update

File: `frontend/src/pages/POS.tsx`

**Changes Needed:**
1. Add payment method selection (Card vs Cash)
2. For card payments: Create payment intent → Show Stripe Elements
3. For cash payments: Show cash calculator modal
4. Handle payment confirmation

**Implementation:**

```typescript
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe('pk_test_YOUR_PUBLISHABLE_KEY');

const CheckoutForm = ({ orderId, amount, onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    
    // Confirm payment
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/pos?payment=success`,
      },
      redirect: 'if_required'
    });

    if (error) {
      alert(error.message);
      setLoading(false);
    } else {
      // Payment succeeded
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement />
      <button type="submit" disabled={!stripe || loading}>
        {loading ? 'Processing...' : `Pay $${amount.toFixed(2)}`}
      </button>
    </form>
  );
};

// In main POS component
const handlePayment = async (order, method) => {
  if (method === 'cash') {
    // Show cash calculator modal
    setShowCashModal(true);
  } else if (method === 'card') {
    // Create payment intent
    const response = await api.post('/pos-payments/create-payment', {
      order_id: order.order_id,
      amount: order.total,
      payment_method: 'card'
    });
    
    setClientSecret(response.data.client_secret);
    setShowCardModal(true);
  }
};
```

### 3. Environment Variables

Add to `frontend/.env`:

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...  # or pk_live_... for production
```

## Testing

### 1. Test Cards (Stripe Test Mode)

- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- 3D Secure: `4000 0025 0000 3155`

Use any future expiry date, any CVC, any postal code.

### 2. Test Webhooks Locally

Use Stripe CLI:

```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:8000/webhooks/stripe

# Trigger test events
stripe trigger payment_intent.succeeded
stripe trigger customer.subscription.created
```

### 3. Test Subscriptions

1. Go to `/pricing` page
2. Click "Choose Plan" on any tier
3. Fill test card: `4242 4242 4242 4242`
4. Complete checkout
5. Verify in Stripe Dashboard
6. Check database for updated subscription

### 4. Test POS Payments

1. Create an order in POS
2. Click "Checkout"
3. Select "Card Payment"
4. Enter test card
5. Confirm payment
6. Verify transaction in database

## Demo Mode

The implementation includes **graceful degradation** for demo mode:

- If `STRIPE_SECRET_KEY` is not configured or set to placeholder
- All Stripe calls return demo data
- Webhooks are accepted without signature verification
- Subscriptions and payments work locally without real charges

This allows testing without Stripe credentials.

## Security Considerations

1. **Never expose secret keys** in frontend code
2. **Always validate webhooks** using signature verification
3. **Use HTTPS** for webhook endpoints in production
4. **Implement idempotency** for payment operations
5. **Log all payment events** to AuditLog table
6. **Mask sensitive data** in API responses (already implemented)

## Production Checklist

- [ ] Get production Stripe keys
- [ ] Create production products and prices
- [ ] Update environment variables
- [ ] Set up production webhook endpoint (HTTPS)
- [ ] Test with live test mode
- [ ] Verify webhook signature validation
- [ ] Enable webhook retry logic
- [ ] Set up Stripe monitoring/alerts
- [ ] Test refund process
- [ ] Verify subscription cancellation flow
- [ ] Test edge cases (card decline, insufficient funds, etc.)

## Support & Documentation

- **Stripe Dashboard**: https://dashboard.stripe.com
- **Stripe API Docs**: https://stripe.com/docs/api
- **Stripe Testing Guide**: https://stripe.com/docs/testing
- **Webhook Best Practices**: https://stripe.com/docs/webhooks/best-practices
- **Payment Intents Guide**: https://stripe.com/docs/payments/payment-intents

## Troubleshooting

### "Stripe API key not configured"
- Add `STRIPE_SECRET_KEY` to backend `.env`
- Restart backend server

### "Invalid signature" in webhook
- Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard
- Ensure using raw request body for signature verification

### Payment succeeds but order not updated
- Check webhook events in Stripe Dashboard
- Verify webhook endpoint is publicly accessible
- Check backend logs for errors

### Subscription not activating
- Verify price IDs in environment variables
- Check if checkout session completed in Stripe
- Look for webhook events

## Next Steps

After implementing Stripe integration:

1. **Phase 2**: Implement Solana blockchain integration for crypto payments
2. **Phase 3**: Add real payroll calculations
3. **Phase 4**: Implement SMS/Email notifications for payment events
4. **Phase 5**: Add delivery platform integrations
5. **Phase 6**: Implement Toast/Square/Clover POS integrations
