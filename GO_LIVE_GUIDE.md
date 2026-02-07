# 🚀 WDYM86 Stripe Integration - Go Live Guide

**Last Updated**: February 7, 2026  
**Branch**: `shaws_new_updates`  
**Estimated Time**: 2-3 hours (first time setup)

This guide walks you through everything needed to make the Stripe payment integration live and accepting real payments.

---

## 📋 Prerequisites Checklist

Before starting, ensure you have:
- [ ] Access to the `shaws_new_updates` branch
- [ ] Terminal/command line access
- [ ] Admin access to your server (if deploying to production)
- [ ] Email address for Stripe account signup
- [ ] Business bank account (for Stripe payouts)

---

## 🎯 Quick Start (Test Mode) - 30 Minutes

Follow these steps to get the system running in **Stripe Test Mode** (no real charges):

### Step 1: Install Dependencies (5 min)

```bash
# Navigate to project root
cd /Users/sineshawmesfintesfaye/Documents/wdym86

# Install backend dependencies
cd backend
pip install -r requirements.txt

# Install frontend dependencies
cd ../frontend
npm install
```

**✅ Verify**: No error messages during installation

---

### Step 2: Create Stripe Account (5 min)

1. Go to **https://dashboard.stripe.com/register**
2. Sign up with your email
3. Complete business information
4. Skip bank account setup for now (test mode doesn't need it)

**✅ Verify**: You can access Stripe Dashboard

---

### Step 3: Get Stripe API Keys (2 min)

1. In Stripe Dashboard, toggle to **"Test mode"** (top right)
2. Go to **Developers → API keys**
3. Copy these keys:
   - **Publishable key** (starts with `pk_test_`)
   - **Secret key** (starts with `sk_test_`) - Click "Reveal test key"

**✅ Verify**: You have both keys copied

---

### Step 4: Create Products & Prices in Stripe (10 min)

1. In Stripe Dashboard, go to **Products → Add product**

2. **Create Starter Plan**:
   - Product name: `WDYM86 Starter Plan`
   - Description: `AI-powered inventory intelligence for small restaurants`
   - Click **Add pricing**:
     - **Monthly**: $49/month, Recurring, Save
     - Copy the Price ID (starts with `price_`)
   - Click **Add another price**:
     - **Yearly**: $470/year, Recurring, Save
     - Copy the Price ID

3. **Create Pro Plan**:
   - Product name: `WDYM86 Pro Plan`
   - Description: `Advanced features for growing restaurants`
   - **Monthly**: $149/month → Copy Price ID
   - **Yearly**: $1,430/year → Copy Price ID

4. **Create Enterprise Plan**:
   - Product name: `WDYM86 Enterprise Plan`
   - Description: `Custom solutions for large operations`
   - **Monthly**: $399/month → Copy Price ID
   - **Yearly**: $3,830/year → Copy Price ID

**✅ Verify**: You have 6 Price IDs total (2 per tier)

---

### Step 5: Configure Backend Environment (5 min)

Create/update `backend/.env` file:

```bash
# Copy example (if exists)
cp backend/.env.example backend/.env

# Edit the file
nano backend/.env  # or use your preferred editor
```

Add these variables (replace with your actual keys):

```bash
# Stripe Configuration (TEST MODE)
STRIPE_SECRET_KEY=sk_test_YOUR_SECRET_KEY_HERE
STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
STRIPE_WEBHOOK_SECRET=whsec_YOUR_WEBHOOK_SECRET_HERE  # We'll get this in Step 7

# Stripe Price IDs
STRIPE_PRICE_STARTER_MONTHLY=price_XXXXX
STRIPE_PRICE_STARTER_YEARLY=price_XXXXX
STRIPE_PRICE_PRO_MONTHLY=price_XXXXX
STRIPE_PRICE_PRO_YEARLY=price_XXXXX
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_XXXXX
STRIPE_PRICE_ENTERPRISE_YEARLY=price_XXXXX

# Existing settings (keep these as-is)
DATABASE_URL=sqlite+aiosqlite:///./wdym86.db
SECRET_KEY=your-secret-key-change-in-production
DEBUG=true
GEMINI_API_KEY=your-gemini-key-if-you-have-one
```

**✅ Verify**: File saved with all Stripe keys

---

### Step 6: Run Database Migration (3 min)

```bash
cd backend

# Create migration for AuditLog table
alembic revision --autogenerate -m "add_audit_log_and_stripe_integration"

# Apply migration
alembic upgrade head
```

**✅ Verify**: You see "Running upgrade" message, no errors

---

### Step 7: Set Up Webhook (Local Testing) (5 min)

#### Option A: Use Stripe CLI (Recommended for Development)

```bash
# Install Stripe CLI
# macOS
brew install stripe/stripe-cli/stripe

# Windows
scoop install stripe

# Linux
# Download from https://github.com/stripe/stripe-cli/releases

# Login to Stripe
stripe login

# Start webhook forwarding (keep this terminal open)
stripe listen --forward-to localhost:8000/webhooks/stripe
```

When you run `stripe listen`, it will output a **webhook signing secret** like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copy this and add it to your `backend/.env`:
```bash
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

#### Option B: Skip Webhooks for Now
If you skip webhooks, subscriptions will work but won't auto-update from Stripe events. You can add this later.

**✅ Verify**: Stripe CLI shows "Ready! Listening for events"

---

### Step 8: Configure Frontend Environment (2 min)

Create `frontend/.env`:

```bash
# Create file
nano frontend/.env
```

Add:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_YOUR_PUBLISHABLE_KEY_HERE
VITE_API_URL=http://localhost:8000
```

**✅ Verify**: File saved with publishable key

---

### Step 9: Start the Application (2 min)

Open **3 terminal windows**:

**Terminal 1 - Backend**:
```bash
cd backend
uvicorn app.main:app --reload
```

**Terminal 2 - Frontend**:
```bash
cd frontend
npm run dev
```

**Terminal 3 - Stripe Webhooks** (if using Stripe CLI):
```bash
stripe listen --forward-to localhost:8000/webhooks/stripe
```

**✅ Verify**: 
- Backend: `http://localhost:8000/docs` loads
- Frontend: `http://localhost:5173` loads
- Stripe CLI: Shows "Listening for events"

---

### Step 10: Test Subscription Flow (5 min)

1. Open `http://localhost:5173`
2. Log in (or use demo login)
3. Go to **Pricing** page
4. Click **"Get Started"** on any paid tier
5. You'll be redirected to Stripe Checkout

**Use Test Card**:
- Card number: `4242 4242 4242 4242`
- Expiry: Any future date (e.g., `12/34`)
- CVC: Any 3 digits (e.g., `123`)
- ZIP: Any 5 digits (e.g., `12345`)

6. Complete checkout
7. You should be redirected back to your app

**✅ Verify**: 
- In Stripe Dashboard → Customers: You see a new customer
- In Stripe Dashboard → Payments: You see a successful payment
- In Terminal 3: You see webhook events being received
- In your app: Subscription status updated

---

## 🎊 SUCCESS! Your Test Environment is Live

At this point, you have a fully functional Stripe integration in **test mode**. No real money is being charged.

---

## 🔥 Going to Production (Real Payments)

### Prerequisites for Production

Before accepting real payments, you MUST:
- [ ] Complete Stripe account verification (business details)
- [ ] Add bank account for payouts
- [ ] Activate your Stripe account
- [ ] Deploy backend to a server with HTTPS
- [ ] Set up production database (PostgreSQL recommended)

---

### Production Setup Steps

#### 1. Activate Stripe Account

1. In Stripe Dashboard, complete:
   - Business details
   - Bank account information
   - Identity verification
2. Wait for Stripe approval (usually 1-2 business days)
3. Once approved, toggle to **"Live mode"**

---

#### 2. Get Production API Keys

1. Toggle to **"Live mode"** in Stripe Dashboard
2. Go to **Developers → API keys**
3. Copy:
   - **Live publishable key** (starts with `pk_live_`)
   - **Live secret key** (starts with `sk_live_`)

---

#### 3. Recreate Products in Live Mode

**Important**: Products created in test mode don't transfer to live mode!

1. In **Live mode**, go to Products → Add product
2. Recreate all 3 tiers (Starter, Pro, Enterprise)
3. Add monthly and yearly pricing for each
4. Copy all 6 **Live Price IDs**

---

#### 4. Deploy Backend with HTTPS

You need HTTPS for webhooks in production. Options:

**Option A: Deploy to Heroku**
```bash
# Install Heroku CLI
brew tap heroku/brew && brew install heroku

# Login
heroku login

# Create app
heroku create wdym86-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:mini

# Set environment variables
heroku config:set STRIPE_SECRET_KEY=sk_live_YOUR_KEY
heroku config:set STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_KEY
heroku config:set STRIPE_PRICE_STARTER_MONTHLY=price_XXX
# ... (set all config vars)

# Deploy
git push heroku shaws_new_updates:main
```

**Option B: Deploy to AWS/DigitalOcean/Vercel**
- Follow your preferred hosting guide
- Ensure HTTPS is enabled
- Set all environment variables

---

#### 5. Set Up Production Webhook

1. In Stripe Dashboard (Live mode), go to **Developers → Webhooks**
2. Click **Add endpoint**
3. Endpoint URL: `https://your-domain.com/webhooks/stripe`
4. Select events to listen for:
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
   - `charge.refunded`
5. Click **Add endpoint**
6. Copy the **Signing secret** (starts with `whsec_`)
7. Add to production environment variables:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_YOUR_PRODUCTION_SECRET
   ```

---

#### 6. Update Frontend Environment

**Production frontend `.env`**:
```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_YOUR_LIVE_KEY
VITE_API_URL=https://your-backend-domain.com
```

Build and deploy frontend:
```bash
cd frontend
npm run build
# Deploy dist/ folder to your hosting (Vercel, Netlify, etc.)
```

---

#### 7. Update Database to PostgreSQL (Recommended)

**Why**: SQLite doesn't handle concurrent writes well in production

```bash
# Install PostgreSQL driver (already in requirements.txt)
pip install asyncpg psycopg2-binary

# Update backend/.env
DATABASE_URL=postgresql+asyncpg://user:password@host:5432/wdym86
# or use RDS_ENABLED=true with RDS environment variables

# Run migrations
alembic upgrade head
```

---

#### 8. Production Testing Checklist

Before announcing to customers:

- [ ] Test subscription signup with real credit card
- [ ] Verify webhook events are received
- [ ] Test subscription cancellation
- [ ] Test POS payment (when frontend integration complete)
- [ ] Test refund process
- [ ] Verify emails are sent (Stripe handles customer receipts)
- [ ] Check Stripe Dashboard shows correct data
- [ ] Test on mobile devices
- [ ] Verify HTTPS certificate is valid
- [ ] Test error handling (declined card, etc.)

---

## 🔒 Security Checklist

Before going live, verify:

- [ ] `STRIPE_SECRET_KEY` is NOT in git repository
- [ ] `.env` files are in `.gitignore`
- [ ] Backend API uses HTTPS in production
- [ ] Webhook signature verification is enabled
- [ ] Rate limiting is active (already implemented)
- [ ] API key masking is working (already implemented)
- [ ] Database backups are configured
- [ ] Stripe Radar is enabled (fraud detection)
- [ ] Set up Stripe alerts for:
  - Failed payments
  - High dispute rates
  - Unusual transaction patterns

---

## 📊 Monitoring & Maintenance

### Stripe Dashboard

Monitor daily:
- **Payments** - View all transactions
- **Customers** - Manage subscriptions
- **Disputes** - Handle chargebacks
- **Events** - Webhook delivery status

### Backend Monitoring

Check:
- `audit_logs` table for all payment actions
- `payment_transactions` table for transaction history
- Backend logs for errors
- Database backups

### Recommended Tools

- **Sentry** - Error tracking
- **Datadog/New Relic** - Performance monitoring
- **Stripe Radar** - Fraud prevention
- **CloudWatch/Loggly** - Log aggregation

---

## 🆘 Troubleshooting

### "Stripe API key not configured"
**Fix**: Add `STRIPE_SECRET_KEY` to backend `.env`

### "Invalid webhook signature"
**Fix**: Verify `STRIPE_WEBHOOK_SECRET` matches Stripe Dashboard

### Payment succeeds but subscription not updated
**Fix**: Check webhook events in Stripe Dashboard → Developers → Events

### Frontend shows demo mode
**Fix**: Add `VITE_STRIPE_PUBLISHABLE_KEY` to frontend `.env`

### Database migration fails
**Fix**: 
```bash
# Reset migrations (BE CAREFUL in production!)
alembic downgrade -1
alembic upgrade head
```

### Webhooks not being received
**Fix**: 
- Verify endpoint URL is publicly accessible
- Check Stripe Dashboard → Webhooks → Event Logs
- Test with Stripe CLI: `stripe trigger payment_intent.succeeded`

---

## 💰 Pricing & Costs

### Stripe Fees (as of 2026)
- **Card payments**: 2.9% + $0.30 per transaction
- **International cards**: +1.5%
- **Currency conversion**: +1%
- **ACH/Bank transfers**: 0.8% (capped at $5)
- **Disputes**: $15 per dispute

### Calculation Example
Customer pays $49/month for Starter plan:
- Gross revenue: $49.00
- Stripe fee: $1.72 (2.9% + $0.30)
- Net revenue: $47.28

### Payout Schedule
- **Default**: 2-business-day rolling basis
- **Express**: Next-day (requires approval)
- **Monthly**: Available if preferred

---

## 📈 Next Steps After Going Live

1. **Monitor First Week**
   - Watch for failed payments
   - Check webhook delivery
   - Monitor error logs

2. **Optimize Conversion**
   - Add email reminders for failed payments
   - Implement retry logic for declined cards
   - Set up dunning management

3. **Complete Phase 1.5**
   - POS frontend integration (4-6 hours)

4. **Move to Phase 2**
   - Solana blockchain integration (per roadmap)

5. **Consider Stripe Features**
   - **Stripe Billing**: Advanced subscription management
   - **Stripe Radar**: Fraud prevention
   - **Stripe Tax**: Automatic tax calculation
   - **Stripe Identity**: Customer verification

---

## 📞 Support Resources

### Stripe Support
- **Dashboard**: https://dashboard.stripe.com
- **Docs**: https://stripe.com/docs
- **Support**: https://support.stripe.com
- **Status**: https://status.stripe.com

### WDYM86 Documentation
- `STRIPE_INTEGRATION_GUIDE.md` - Technical details
- `PHASE1_COMPLETION_REPORT.md` - Implementation details
- Backend API docs: `http://your-domain.com/docs`

### Emergency Contacts
- Stripe Support: Available 24/7 via Dashboard
- Your hosting provider support
- Your database provider support

---

## ✅ Go-Live Checklist

### Pre-Launch
- [ ] Stripe account activated
- [ ] Live API keys configured
- [ ] Products and prices created in live mode
- [ ] Backend deployed with HTTPS
- [ ] Frontend deployed and configured
- [ ] Database migrated (PostgreSQL)
- [ ] Webhook endpoint configured
- [ ] Test subscription completed successfully
- [ ] Security checklist completed
- [ ] Monitoring tools set up
- [ ] Bank account added for payouts
- [ ] Team trained on Stripe Dashboard

### Launch Day
- [ ] Switch frontend to production environment
- [ ] Verify all systems operational
- [ ] Test complete user flow
- [ ] Monitor Stripe Dashboard for first transactions
- [ ] Check webhook delivery
- [ ] Announce to users

### Post-Launch (First Week)
- [ ] Daily monitoring of transactions
- [ ] Check for failed payments
- [ ] Respond to customer payment issues
- [ ] Review webhook event logs
- [ ] Monitor error logs
- [ ] Back up database daily

---

## 🎯 Timeline Summary

| Phase | Time | Description |
|-------|------|-------------|
| **Test Mode Setup** | 30 min | Steps 1-10 above |
| **Stripe Account Activation** | 1-2 days | Business verification |
| **Production Deployment** | 2-4 hours | Backend + Frontend + DB |
| **Webhook Configuration** | 30 min | Production webhook |
| **Testing** | 1-2 hours | End-to-end verification |
| **Total to Live** | **1-3 days** | Including Stripe approval |

---

## 🚀 Ready to Launch?

Follow this guide step-by-step and you'll have a production-ready payment system accepting real subscriptions.

**Start with Test Mode (30 minutes)** → Get comfortable → **Go to Production (1-3 days)**

Good luck! 🎊

---

**Questions?** Refer to `STRIPE_INTEGRATION_GUIDE.md` for technical details or Stripe's documentation at https://stripe.com/docs
