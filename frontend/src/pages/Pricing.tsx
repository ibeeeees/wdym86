import { useState } from 'react'
import { Check, X, Sparkles, Zap, Crown, Building2, ArrowRight } from 'lucide-react'

interface TierFeature {
  name: string
  free: boolean | string
  starter: boolean | string
  pro: boolean | string
  enterprise: boolean | string
}

const features: TierFeature[] = [
  { name: 'AI Demand Forecasting', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Risk Alerts', free: true, starter: true, pro: true, enterprise: true },
  { name: 'Reorder Recommendations', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Supplier Strategy Agent', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Gemini AI Chat', free: false, starter: true, pro: true, enterprise: true },
  { name: 'Delivery Integration', free: false, starter: false, pro: true, enterprise: true },
  { name: 'POS System', free: false, starter: true, pro: true, enterprise: true },
  { name: 'API Access', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Custom Reports', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Priority Support', free: false, starter: false, pro: true, enterprise: true },
  { name: 'Dedicated Account Manager', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Custom Integrations', free: false, starter: false, pro: false, enterprise: true },
  { name: 'Max Ingredients', free: '10', starter: '50', pro: '200', enterprise: 'Unlimited' },
  { name: 'Max Suppliers', free: '3', starter: '10', pro: '50', enterprise: 'Unlimited' },
  { name: 'Max Locations', free: '1', starter: '1', pro: '3', enterprise: 'Unlimited' },
  { name: 'Team Members', free: '1', starter: '3', pro: '10', enterprise: 'Unlimited' },
  { name: 'Data Retention', free: '30 days', starter: '90 days', pro: '1 year', enterprise: 'Unlimited' },
]

const tiers = [
  {
    id: 'free',
    name: 'Free',
    description: 'Get started with basic inventory tracking',
    priceMonthly: 0,
    priceYearly: 0,
    icon: Sparkles,
    color: 'from-neutral-400 to-neutral-500',
    popular: false,
  },
  {
    id: 'starter',
    name: 'Starter',
    description: 'Perfect for small restaurants',
    priceMonthly: 49,
    priceYearly: 470,
    icon: Zap,
    color: 'from-blue-500 to-cyan-500',
    popular: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'Advanced features for growing businesses',
    priceMonthly: 149,
    priceYearly: 1430,
    icon: Crown,
    color: 'from-red-500 to-red-600',
    popular: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Custom solutions for large operations',
    priceMonthly: 399,
    priceYearly: 3830,
    icon: Building2,
    color: 'from-black to-neutral-800',
    popular: false,
  },
]

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const handleSelectTier = (tierId: string) => {
    // In production, this would redirect to checkout with Stripe
    alert(`Selected ${tierId} plan with ${billingCycle} billing. Redirecting to checkout...`)
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="w-14 h-14 bg-gradient-to-br from-red-500 to-red-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-red-500/30">
          <Crown className="w-7 h-7 text-white" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-black dark:text-white">
          Choose Your Plan
        </h1>
        <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-2xl mx-auto text-sm sm:text-base px-4">
          Scale your restaurant's inventory intelligence with the right features for your business
        </p>

        {/* Billing Toggle */}
        <div className="mt-6 inline-flex items-center p-1 bg-neutral-100 dark:bg-neutral-800 rounded-xl">
          <button
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle('yearly')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white dark:bg-neutral-700 text-black dark:text-white shadow-sm'
                : 'text-neutral-500 dark:text-neutral-400'
            }`}
          >
            Yearly
            <span className="ml-1.5 text-xs text-green-500 font-semibold">Save 20%</span>
          </button>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 pt-4">
        {tiers.map((tier) => {
          const Icon = tier.icon
          const price = billingCycle === 'monthly' ? tier.priceMonthly : Math.round(tier.priceYearly / 12)

          return (
            <div
              key={tier.id}
              className={`relative bg-white dark:bg-neutral-800 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                tier.popular
                  ? 'border-red-500 shadow-xl shadow-red-500/20'
                  : 'border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs font-bold rounded-full shadow-lg">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="p-6">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-br ${tier.color} rounded-xl flex items-center justify-center shadow-lg`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-black dark:text-white">{tier.name}</h3>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400">{tier.description}</p>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6">
                  {tier.id === 'enterprise' ? (
                    <div className="flex items-baseline">
                      <span className="text-4xl font-bold text-black dark:text-white">Custom</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-black dark:text-white">
                          ${price}
                        </span>
                        <span className="text-neutral-500 dark:text-neutral-400 ml-1">/mo</span>
                      </div>
                      {billingCycle === 'yearly' && tier.priceYearly > 0 && (
                        <p className="text-sm text-green-500 mt-1">
                          ${tier.priceYearly}/year (save ${tier.priceMonthly * 12 - tier.priceYearly})
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => tier.id === 'enterprise' ? window.location.href = 'mailto:sales@wdym86.ai' : handleSelectTier(tier.id)}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center space-x-2 ${
                    tier.popular
                      ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30'
                      : 'bg-black dark:bg-white text-white dark:text-black hover:bg-neutral-800 dark:hover:bg-neutral-200'
                  }`}
                >
                  <span>{tier.id === 'enterprise' ? 'Contact Sales' : tier.priceMonthly === 0 ? 'Start Free' : 'Get Started'}</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                {/* Key Features */}
                <div className="mt-6 pt-6 border-t border-neutral-200 dark:border-neutral-700">
                  <p className="text-xs font-semibold text-neutral-500 dark:text-neutral-400 uppercase mb-3">
                    Key Features
                  </p>
                  <ul className="space-y-2">
                    {features.slice(0, 6).map((feature) => {
                      const value = feature[tier.id as keyof typeof feature]
                      const hasFeature = value === true || (typeof value === 'string' && value !== 'false')

                      return (
                        <li key={feature.name} className="flex items-center space-x-2">
                          {hasFeature ? (
                            <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                          ) : (
                            <X className="w-4 h-4 text-neutral-300 dark:text-neutral-600 flex-shrink-0" />
                          )}
                          <span className={`text-sm ${
                            hasFeature
                              ? 'text-black dark:text-white'
                              : 'text-neutral-400 dark:text-neutral-500'
                          }`}>
                            {feature.name}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Feature Comparison Table */}
      <div className="bg-white dark:bg-neutral-800 rounded-2xl border border-neutral-200 dark:border-neutral-700 overflow-hidden">
        <div className="p-6 border-b border-neutral-200 dark:border-neutral-700">
          <h2 className="text-xl font-bold text-black dark:text-white">Compare All Features</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-neutral-200 dark:border-neutral-700">
                <th className="text-left p-4 text-sm font-semibold text-neutral-500 dark:text-neutral-400">Feature</th>
                {tiers.map((tier) => (
                  <th key={tier.id} className="p-4 text-center">
                    <span className={`text-sm font-bold ${
                      tier.popular ? 'text-red-500' : 'text-black dark:text-white'
                    }`}>
                      {tier.name}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {features.map((feature, idx) => (
                <tr
                  key={feature.name}
                  className={idx % 2 === 0 ? 'bg-neutral-50 dark:bg-neutral-900' : ''}
                >
                  <td className="p-4 text-sm text-black dark:text-white">{feature.name}</td>
                  {tiers.map((tier) => {
                    const value = feature[tier.id as keyof typeof feature]
                    return (
                      <td key={tier.id} className="p-4 text-center">
                        {value === true ? (
                          <Check className="w-5 h-5 text-green-500 mx-auto" />
                        ) : value === false ? (
                          <X className="w-5 h-5 text-neutral-300 dark:text-neutral-600 mx-auto" />
                        ) : (
                          <span className="text-sm font-medium text-black dark:text-white">{value}</span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ or Contact */}
      <div className="text-center py-8">
        <p className="text-neutral-500 dark:text-neutral-400">
          Need a custom solution?{' '}
          <a href="mailto:sales@mykonos.ai" className="text-red-500 hover:underline font-medium">
            Contact our sales team
          </a>
        </p>
      </div>
    </div>
  )
}
