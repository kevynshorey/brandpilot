import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';
import {
  Zap,
  Calendar,
  BarChart3,
  Sparkles,
  Globe,
  Users,
  Check,
  ArrowRight,
  Instagram,
  Linkedin,
  Twitter,
} from 'lucide-react';
import { PLANS, PLAN_ORDER } from '@/lib/billing-plans';
import { WaitlistForm } from '@/components/waitlist-form';

export const metadata: Metadata = {
  description:
    'Manage all your brands from one dashboard. AI content creation, scheduling, publishing, and analytics across Instagram, LinkedIn, X, Pinterest, Facebook, and TikTok.',
};

const FEATURES = [
  {
    icon: Sparkles,
    title: 'AI Content Generation',
    description:
      'Generate captions, hashtags, and full blog posts tuned to your brand voice. No more staring at blank screens.',
  },
  {
    icon: Calendar,
    title: 'Smart Scheduling',
    description:
      'Plan and schedule posts across all platforms from a visual calendar. Set it and forget it.',
  },
  {
    icon: Globe,
    title: '6 Platforms, 1 Dashboard',
    description:
      'Instagram, Facebook, LinkedIn, X, Pinterest, and TikTok — all managed from a single workspace.',
  },
  {
    icon: BarChart3,
    title: 'Analytics That Matter',
    description:
      'Track engagement, growth, and content performance. See what works and double down.',
  },
  {
    icon: Users,
    title: 'Multi-Brand Workspaces',
    description:
      'Manage multiple brands with isolated workspaces. Each brand gets its own guidelines, accounts, and content.',
  },
  {
    icon: Zap,
    title: 'Automated Publishing',
    description:
      'Connect your accounts, schedule posts, and let BrandPilot publish them automatically via Make.com.',
  },
];

const PLATFORM_ICONS = [
  { Icon: Instagram, label: 'Instagram', color: 'text-pink-400' },
  { Icon: Globe, label: 'Facebook', color: 'text-blue-400' },
  { Icon: Linkedin, label: 'LinkedIn', color: 'text-blue-300' },
  { Icon: Twitter, label: 'X', color: 'text-zinc-300' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-xl font-bold tracking-tight">
            <Image src="/logo.svg" alt="BrandPilot" width={28} height={28} />
            Brand<span className="text-amber-400">Pilot</span>
          </Link>
          <div className="hidden sm:flex items-center gap-6 text-sm text-zinc-400">
            <a href="#features" className="hover:text-white transition-colors">
              Features
            </a>
            <a href="#pricing" className="hover:text-white transition-colors">
              Pricing
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm text-zinc-300 hover:text-white transition-colors"
            >
              Log in
            </Link>
            <a
              href="#waitlist"
              className="px-4 py-2 bg-amber-500 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-amber-400 transition-colors"
            >
              Join Waitlist
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section id="waitlist" className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(251,191,36,0.08),transparent_60%)]" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-24 pb-20 sm:pt-32 sm:pb-28 relative">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-amber-400 text-xs font-medium mb-6">
              <Sparkles className="w-3.5 h-3.5" />
              AI-powered social media management
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
              Manage every brand
              <br />
              <span className="text-amber-400">from one dashboard</span>
            </h1>
            <p className="text-lg sm:text-xl text-zinc-400 max-w-xl mx-auto mb-10 leading-relaxed">
              Create AI-powered content, schedule posts across 6 platforms, and
              track what works — all in one place. Built for creators,
              solopreneurs, and growing teams.
            </p>
            <div className="mb-4">
              <WaitlistForm source="hero" />
            </div>
            <p className="text-xs text-zinc-500 mb-12">
              Join the waitlist for early access. No spam, ever.
            </p>

            {/* Platform icons */}
            <div className="flex items-center justify-center gap-6">
              {PLATFORM_ICONS.map(({ Icon, label, color }) => (
                <div
                  key={label}
                  className="flex items-center gap-1.5 text-zinc-500"
                >
                  <Icon className={`w-4 h-4 ${color}`} />
                  <span className="text-xs hidden sm:inline">{label}</span>
                </div>
              ))}
              <span className="text-xs text-zinc-600">+ Pinterest, TikTok</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Everything you need to grow your brand
            </h2>
            <p className="text-zinc-400 max-w-lg mx-auto">
              Stop juggling 6 apps. BrandPilot brings content creation,
              scheduling, publishing, and analytics into one workflow.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-zinc-700 transition-colors"
                >
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-amber-400" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 border-t border-zinc-800/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Up and running in minutes
            </h2>
            <p className="text-zinc-400">
              Three steps to effortless social media management.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-8 max-w-3xl mx-auto">
            {[
              {
                step: '1',
                title: 'Set your brand voice',
                desc: 'Add your guidelines, tone, and topics. BrandPilot learns how your brand speaks.',
              },
              {
                step: '2',
                title: 'Generate with AI',
                desc: 'Create posts, captions, and blogs tailored to your brand in seconds.',
              },
              {
                step: '3',
                title: 'Schedule & publish',
                desc: 'Pick your platforms, set the time, and BrandPilot handles the rest.',
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full bg-amber-500 text-zinc-900 font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
                <p className="text-sm text-zinc-400">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <PricingSection />

      {/* CTA */}
      <section className="py-20 sm:py-28">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-amber-500/10 via-zinc-900 to-zinc-900 border border-amber-500/20 rounded-2xl p-10 sm:p-16 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Ready to pilot your brand?
            </h2>
            <p className="text-zinc-400 max-w-md mx-auto mb-8">
              Join creators and businesses getting early access to BrandPilot.
              Be the first to manage all your brands from one AI-powered dashboard.
            </p>
            <WaitlistForm source="cta" />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-sm font-bold">
              Brand<span className="text-amber-400">Pilot</span>
            </div>
            <div className="flex items-center gap-6 text-xs text-zinc-500">
              <a href="#features" className="hover:text-zinc-300 transition-colors">
                Features
              </a>
              <a href="#pricing" className="hover:text-zinc-300 transition-colors">
                Pricing
              </a>
              <Link href="/login" className="hover:text-zinc-300 transition-colors">
                Log in
              </Link>
            </div>
            <p className="text-xs text-zinc-600">
              &copy; {new Date().getFullYear()} BrandPilot. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

// --- Pricing Section (server component, reads PLANS directly) ---

function PricingSection() {
  return (
    <section
      id="pricing"
      className="py-20 sm:py-28 border-t border-zinc-800/60"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Simple, transparent pricing
          </h2>
          <p className="text-zinc-400 max-w-lg mx-auto">
            Start free. Upgrade as you grow. All plans include AI content
            generation, scheduling, and analytics.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
          {PLAN_ORDER.map((planId) => {
            const plan = PLANS[planId];
            return (
              <div
                key={planId}
                className={`rounded-xl border p-6 flex flex-col ${
                  plan.popular
                    ? 'border-amber-500/40 bg-amber-500/5 ring-1 ring-amber-500/20'
                    : 'border-zinc-800 bg-zinc-900'
                }`}
              >
                {plan.popular && (
                  <div className="flex items-center gap-1.5 mb-3">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xs font-semibold text-amber-400">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold">{plan.name}</h3>
                <p className="text-xs text-zinc-500 mt-0.5 mb-4">
                  {plan.description}
                </p>

                <div className="mb-1">
                  <span className="text-3xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-sm text-zinc-500">/mo</span>
                  )}
                </div>
                {plan.yearlyPrice > 0 && plan.yearlyPrice < plan.price && (
                  <p className="text-xs text-emerald-400 mb-4">
                    ${plan.yearlyPrice}/mo billed yearly (save 20%)
                  </p>
                )}
                {plan.price === 0 && (
                  <p className="text-xs text-zinc-500 mb-4">Free forever</p>
                )}

                <Link
                  href="/signup"
                  className={`w-full py-2.5 rounded-lg text-sm font-semibold text-center mb-5 transition-colors ${
                    plan.popular
                      ? 'bg-amber-500 text-zinc-900 hover:bg-amber-400'
                      : 'bg-zinc-800 text-zinc-200 hover:bg-zinc-700'
                  }`}
                >
                  {plan.price === 0 ? 'Get Started' : 'Start Free Trial'}
                </Link>

                <ul className="space-y-2.5 flex-1">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2 text-xs text-zinc-400"
                    >
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
