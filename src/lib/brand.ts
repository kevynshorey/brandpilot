/**
 * BrandPilot — Centralized Brand Constants
 * All brand colors, fonts, and copy in one place.
 */

export const BRAND = {
  name: 'BrandPilot',
  tagline: 'AI-Powered Social Media Management',
  description:
    'Create, schedule, and publish social media content across all platforms with AI. Manage multiple brands from one dashboard.',
  domain: 'brandpilots.io',
  url: 'https://brandpilots.io',

  colors: {
    // Primary accent — amber/gold
    accent: '#f59e0b',       // amber-500
    accentLight: '#fbbf24',  // amber-400
    accentDark: '#d97706',   // amber-600

    // Backgrounds
    bgDark: '#09090b',       // zinc-950
    bgCard: '#18181b',       // zinc-900
    bgLight: '#fafafa',      // zinc-50

    // Text
    textPrimary: '#ffffff',
    textSecondary: '#a1a1aa', // zinc-400
    textMuted: '#71717a',     // zinc-500

    // Borders
    border: '#27272a',        // zinc-800
  },

  fonts: {
    sans: 'Geist',
    mono: 'Geist Mono',
  },

  og: {
    width: 1200,
    height: 630,
  },
} as const;
