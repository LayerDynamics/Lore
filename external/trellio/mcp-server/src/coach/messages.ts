/**
 * ADHD Coach Accountability Message Templates
 *
 * Tier-appropriate nudge messages based on crash recovery state.
 */

import type { CrashState } from '../types.js';

/**
 * Crash recovery tier definitions (days since last activity)
 */
export const CRASH_TIERS = {
  0: { min: 0, max: 1, name: 'Active', severity: 'none' },
  1: { min: 2, max: 3, name: 'Early Warning', severity: 'low' },
  2: { min: 4, max: 6, name: 'Momentum Loss', severity: 'medium' },
  3: { min: 7, max: 13, name: 'Crash State', severity: 'high' },
  4: { min: 14, max: Infinity, name: 'Deep Crash', severity: 'critical' },
} as const;

/**
 * Tier 0: Active (0-1 days) - Encouragement
 */
const TIER_0_MESSAGES = [
  "You're on a roll! Keep the momentum going.",
  'Great work staying consistent. Your board is moving.',
  "You're showing up every day. That's the foundation of everything.",
  'Momentum is the most valuable thing you have right now. Protect it.',
];

/**
 * Tier 1: Early Warning (2-3 days) - Gentle Nudge
 */
const TIER_1_MESSAGES = [
  "Hey, it's been a couple days. Even 5 minutes on one card keeps momentum alive.",
  "Quick check-in: What's the smallest action you could take today?",
  'Your board misses you. One quick win today brings you back.',
  'Two days is fine. Three days starts to hurt. Show up for yourself today.',
];

/**
 * Tier 2: Momentum Loss (4-6 days) - Direct Nudge
 */
const TIER_2_MESSAGES = [
  'A week without movement and it becomes a wall. Break through today.',
  'This is where the gap becomes a canyon. One card. One step. Now.',
  'Your team is counting on you. Your board is waiting. Show up.',
  "You've been here before and you've recovered. Do that thing that always works.",
];

/**
 * Tier 3: Crash State (7-13 days) - Firm Accountability
 */
const TIER_3_MESSAGES = [
  'A week is serious. Your team needs you. Pick the easiest card and move it right now.',
  "You're better than this stall. Prove it with one action today.",
  'This is not who you are. Get back on the horse. One card. Now.',
  'Your board is frozen. Unfreeze it. Show your team leadership means showing up.',
];

/**
 * Tier 4: Deep Crash (14+ days) - Emergency Intervention
 */
const TIER_4_MESSAGES = [
  'Two weeks is a full stop. This requires immediate action. Move one card within the next hour.',
  'Emergency reset required. Call your accountability partner. Move one card. Report back.',
  "You've ghosted your board for two weeks. Your team deserves better. Act now.",
  'This is the longest gap this year. Break it immediately. One card. One hour. No excuses.',
];

const MESSAGE_TEMPLATES = {
  0: TIER_0_MESSAGES,
  1: TIER_1_MESSAGES,
  2: TIER_2_MESSAGES,
  3: TIER_3_MESSAGES,
  4: TIER_4_MESSAGES,
} as const;

/**
 * Get a random accountability message for a given crash tier
 */
export function getMessageForTier(tier: CrashState['tier']): string {
  const messages = MESSAGE_TEMPLATES[tier];
  return messages[Math.floor(Math.random() * messages.length)];
}

/**
 * Generate a full accountability message with context
 */
export function generateFullMessage(crashState: CrashState): string {
  const tierInfo = CRASH_TIERS[crashState.tier];
  const message = getMessageForTier(crashState.tier);

  return `**[${tierInfo.name}]** ${crashState.daysSinceLastActivity} days since last activity

${message}

**Suggested Action:** ${crashState.suggestedAction}`;
}

/**
 * Get SMS-optimized short message (160 chars max)
 */
export function getSMSMessage(crashState: CrashState): string {
  const tierInfo = CRASH_TIERS[crashState.tier];

  // Short messages for SMS
  const smsTemplates = {
    0: 'Keep going! Momentum is everything.',
    1: `${crashState.daysSinceLastActivity}d gap. Quick win today?`,
    2: `${crashState.daysSinceLastActivity}d without movement. One card. Now.`,
    3: `WEEK+ gap. Team needs you. Move one card today.`,
    4: `🚨 ${crashState.daysSinceLastActivity}d FROZEN. Emergency reset needed. Act within 1 hour.`,
  };

  return smsTemplates[crashState.tier];
}
