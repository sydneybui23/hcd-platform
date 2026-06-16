import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const PLANS = {
  starter: {
    name: 'Starter',
    price: 0,
    priceId: null,
    limits: { projects: 1, feedbackRespondents: 3, synthesis: false },
  },
  pro: {
    name: 'Pro',
    price: 4900,
    priceId: process.env.STRIPE_PRO_PRICE_ID,
    limits: { projects: 10, feedbackRespondents: Infinity, synthesis: true },
  },
  enterprise: {
    name: 'Enterprise',
    price: null,
    priceId: null,
    limits: { projects: Infinity, feedbackRespondents: Infinity, synthesis: true },
  },
} as const

export type Plan = keyof typeof PLANS
