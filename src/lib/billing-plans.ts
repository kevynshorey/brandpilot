export type PlanId = 'free' | 'starter' | 'pro' | 'business' | 'admin';

export interface PlanDefinition {
  id: PlanId;
  name: string;
  description: string;
  price: number; // monthly USD
  yearlyPrice: number; // yearly USD (per month)
  stripePriceId: string | null; // null for free
  stripeYearlyPriceId: string | null;
  limits: {
    maxWorkspaces: number;
    maxPostsPerMonth: number;
    maxBlogPostsPerMonth: number;
    maxSocialAccounts: number;
    aiGenerations: number; // per month
    teamMembers: number;
  };
  features: string[];
  popular?: boolean;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  free: {
    id: 'free',
    name: 'Free',
    description: 'Try BrandPilot with basic features',
    price: 0,
    yearlyPrice: 0,
    stripePriceId: null,
    stripeYearlyPriceId: null,
    limits: {
      maxWorkspaces: 1,
      maxPostsPerMonth: 10,
      maxBlogPostsPerMonth: 3,
      maxSocialAccounts: 2,
      aiGenerations: 10,
      teamMembers: 1,
    },
    features: [
      '1 workspace',
      '2 social accounts',
      '10 AI posts per month',
      '3 blog posts per month',
      'Basic analytics',
      'Manual publishing',
    ],
  },
  starter: {
    id: 'starter',
    name: 'Starter',
    description: 'For growing brands and creators',
    price: 19,
    yearlyPrice: 15,
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    stripeYearlyPriceId: process.env.STRIPE_STARTER_YEARLY_PRICE_ID || '',
    limits: {
      maxWorkspaces: 1,
      maxPostsPerMonth: 50,
      maxBlogPostsPerMonth: 10,
      maxSocialAccounts: 5,
      aiGenerations: 50,
      teamMembers: 1,
    },
    features: [
      '1 workspace',
      '5 social accounts',
      '50 AI posts per month',
      '10 blog posts per month',
      'Brand guidelines',
      'Scheduled publishing',
      'Full analytics',
    ],
    popular: true,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    description: 'For teams managing multiple brands',
    price: 49,
    yearlyPrice: 39,
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    stripeYearlyPriceId: process.env.STRIPE_PRO_YEARLY_PRICE_ID || '',
    limits: {
      maxWorkspaces: 3,
      maxPostsPerMonth: 200,
      maxBlogPostsPerMonth: 30,
      maxSocialAccounts: 15,
      aiGenerations: 200,
      teamMembers: 5,
    },
    features: [
      '3 workspaces',
      '15 social accounts',
      '200 AI posts per month',
      '30 blog posts per month',
      'Advanced analytics + exports',
      'Bulk scheduling',
      'Custom brand voice',
      'Priority support',
    ],
  },
  business: {
    id: 'business',
    name: 'Business',
    description: 'Unlimited power for agencies and teams',
    price: 99,
    yearlyPrice: 79,
    stripePriceId: process.env.STRIPE_BUSINESS_PRICE_ID || '',
    stripeYearlyPriceId: process.env.STRIPE_BUSINESS_YEARLY_PRICE_ID || '',
    limits: {
      maxWorkspaces: 10,
      maxPostsPerMonth: 1000,
      maxBlogPostsPerMonth: 100,
      maxSocialAccounts: 50,
      aiGenerations: 1000,
      teamMembers: 15,
    },
    features: [
      '10 workspaces',
      'Unlimited social accounts',
      'Unlimited AI posts',
      '100 blog posts per month',
      'Team collaboration',
      'API access',
      'White-label reports',
      'Dedicated support',
    ],
  },
  admin: {
    id: 'admin',
    name: 'Admin',
    description: 'Platform owner — unlimited everything',
    price: 0,
    yearlyPrice: 0,
    stripePriceId: null,
    stripeYearlyPriceId: null,
    limits: {
      maxWorkspaces: Infinity,
      maxPostsPerMonth: Infinity,
      maxBlogPostsPerMonth: Infinity,
      maxSocialAccounts: Infinity,
      aiGenerations: Infinity,
      teamMembers: Infinity,
    },
    features: [
      'Unlimited workspaces',
      'Unlimited social accounts',
      'Unlimited AI posts',
      'Unlimited blog posts',
      'Unlimited team members',
      'Full platform access',
      'Admin dashboard',
    ],
  },
};

export const PLAN_ORDER: PlanId[] = ['free', 'starter', 'pro', 'business'];

export function getPlanById(id: string): PlanDefinition {
  return PLANS[id as PlanId] || PLANS.free;
}

export function isUpgrade(current: PlanId, target: PlanId): boolean {
  return PLAN_ORDER.indexOf(target) > PLAN_ORDER.indexOf(current);
}
