/**
 * ADHD Coach Intelligence Tool Handlers
 *
 * Crash state assessment, smallest next action, day capacity calculation,
 * accountability messages, completion stats.
 */

import { z } from 'zod';
import type { TrelloClient } from '../trello/client.js';
import type { ServerConfig, CrashState, DayCapacity, WeeklyStats, EnergyLevel } from '../types.js';
import { CRASH_TIERS, generateFullMessage, getSMSMessage } from './messages.js';
import { getEnergyLevelFromCard } from '../trello/trellio-helpers.js';

// ========================================================================
// TOOL SCHEMAS
// ========================================================================

export const assessCrashStateSchema = z.object({});

export const getSmallestNextActionSchema = z.object({
  energy_level: z.number().min(1).max(5).optional().describe('Current energy level (1-5, default: 3)'),
  list: z.enum(['today', 'this_week']).optional().describe('Which list to search (default: today)'),
});

export const calculateDayCapacitySchema = z.object({
  energy_level: z.number().min(1).max(5).describe('Current energy level (1-5)'),
  available_hours: z.number().optional().describe('Hours available for tasks (default: 6)'),
  meeting_hours: z.number().optional().describe('Hours in meetings (default: 2)'),
});

export const generateAccountabilityMessageSchema = z.object({
  format: z.enum(['full', 'sms']).optional().describe('Message format (default: full)'),
});

export const weeklyCompletionStatsSchema = z.object({
  days: z.number().optional().describe('Number of days to analyze (default: 7)'),
});

// ========================================================================
// TOOL HANDLERS
// ========================================================================

/**
 * Assess current crash state based on last board activity
 */
export async function handleAssessCrashState(
  client: TrelloClient,
  config: ServerConfig['trello'],
  args: z.infer<typeof assessCrashStateSchema>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // Get all cards to find most recent activity
  const lists = [
    config.lists.today,
    config.lists.doing,
    config.lists.thisWeek,
    config.lists.done,
  ];

  let mostRecentActivity: Date | null = null;

  for (const listId of lists) {
    const cards = await client.listCards(listId);

    for (const card of cards) {
      const activityDate = new Date(card.dateLastActivity);
      if (!mostRecentActivity || activityDate > mostRecentActivity) {
        mostRecentActivity = activityDate;
      }
    }
  }

  const now = new Date();
  const daysSinceLastActivity = mostRecentActivity
    ? Math.floor((now.getTime() - mostRecentActivity.getTime()) / (1000 * 60 * 60 * 24))
    : 999; // No activity found = deep crash

  // Determine tier
  let tier: CrashState['tier'] = 4;
  for (const [tierNum, tierDef] of Object.entries(CRASH_TIERS)) {
    if (daysSinceLastActivity >= tierDef.min && daysSinceLastActivity <= tierDef.max) {
      tier = parseInt(tierNum) as CrashState['tier'];
      break;
    }
  }

  // Generate suggested action based on tier
  const suggestedActions = {
    0: 'Keep the momentum! Pick your next highest-impact task.',
    1: 'Quick check-in: Move one card from Today -> Doing.',
    2: 'Break the stall: Find the easiest card on Today and complete it.',
    3: 'Emergency reset: Move ANY card from Today -> Done. Proof of life.',
    4: 'Crisis intervention: Call accountability partner, then move one card.',
  };

  const crashState: CrashState = {
    tier,
    daysSinceLastActivity,
    lastActivityDate: mostRecentActivity ? mostRecentActivity.toISOString() : null,
    suggestedAction: suggestedActions[tier],
  };

  const tierInfo = CRASH_TIERS[tier];
  const report = `# Crash State Assessment

**Status:** ${tierInfo.name} (Tier ${tier})
**Severity:** ${tierInfo.severity}
**Days Since Last Activity:** ${daysSinceLastActivity}
**Last Activity:** ${crashState.lastActivityDate || 'Unknown'}

## Suggested Action
${crashState.suggestedAction}

## Recovery Strategy
${tier === 0 ? "✓ You're doing great! Maintain this momentum." : ''}
${tier === 1 ? 'Gentle nudge: Show up today to prevent momentum loss.' : ''}
${tier === 2 ? 'Direct intervention: One quick win today prevents full crash.' : ''}
${tier === 3 ? 'Firm accountability: This gap is serious. Act immediately.' : ''}
${tier === 4 ? 'Emergency: Two weeks frozen. Call for help. Move ONE card within 1 hour.' : ''}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: report,
      },
    ],
  };
}

/**
 * Get the smallest/easiest next action for current energy level
 */
export async function handleGetSmallestNextAction(
  client: TrelloClient,
  config: ServerConfig['trello'],
  args: z.infer<typeof getSmallestNextActionSchema>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const energyLevel = (args.energy_level || 3) as EnergyLevel;
  const targetList = args.list === 'this_week' ? config.lists.thisWeek : config.lists.today;

  const cards = await client.listCards(targetList);

  if (cards.length === 0) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `No cards found on ${args.list || 'today'}. Your list is clear!`,
        },
      ],
    };
  }

  // Score cards based on:
  // 1. Energy match (prefer cards at or below current energy)
  // 2. Presence of checklist (tasks with checklists seem actionable)
  // 3. No due date (lower pressure)
  // 4. Short description (less overwhelming)

  const scoredCards = cards.map((card) => {
      const cardEnergy = getEnergyLevelFromCard(card, config);
      const checklists = card.checklists || [];

      let score = 0;

      // Energy match bonus (prefer at or below current level)
      if (cardEnergy <= energyLevel) {
        score += 10;
        score += (energyLevel - cardEnergy) * 2; // Extra bonus for easier tasks
      }

      // Checklist presence (more actionable)
      if (checklists.length > 0) {
        score += 5;
      }

      // No due date (less pressure)
      if (!card.due) {
        score += 3;
      }

      // Short description (less overwhelming)
      if (card.desc.length < 100) {
        score += 2;
      }

      return { card, score, checklists };
    });

  // Sort by score descending
  scoredCards.sort((a, b) => b.score - a.score);

  const best = scoredCards[0];
  const cardEnergy = getEnergyLevelFromCard(best.card, config);

  const report = `# Smallest Next Action

**Card:** ${best.card.name}
**Energy Level:** ${cardEnergy}/5
**Has Checklist:** ${best.checklists.length > 0 ? 'Yes' : 'No'}
**Due Date:** ${best.card.due ? new Date(best.card.due).toLocaleDateString() : 'None'}

## Why This One?
${cardEnergy <= energyLevel ? 'Matches your current energy level' : 'Above your current energy (but still the easiest option)'}
${best.checklists.length > 0 ? 'Has actionable checklist items' : ''}
${!best.card.due ? 'No deadline pressure' : ''}
${best.card.desc.length < 100 ? 'Simple, clear task' : ''}

**URL:** ${best.card.url}

${best.checklists.length > 0 ? `## Next Steps\n${best.checklists[0].checkItems.slice(0, 3).map(item => `- [${item.state === 'complete' ? 'x' : ' '}] ${item.name}`).join('\n')}` : ''}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: report,
      },
    ],
  };
}

/**
 * Calculate day capacity based on energy level and available time
 */
export async function handleCalculateDayCapacity(
  client: TrelloClient,
  config: ServerConfig['trello'],
  args: z.infer<typeof calculateDayCapacitySchema>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const energyLevel = args.energy_level as EnergyLevel;
  const availableHours = args.available_hours || 6;
  const meetingHours = args.meeting_hours || 2;
  const productiveHours = availableHours - meetingHours;

  // Task capacity varies by energy level
  const capacityMultipliers = {
    1: 0.3, // Brain dead: 30% capacity
    2: 0.5, // Low energy: 50% capacity
    3: 0.7, // Medium energy: 70% capacity
    4: 0.9, // High energy: 90% capacity
    5: 1.0, // Peak energy: 100% capacity
  };

  const effectiveHours = productiveHours * capacityMultipliers[energyLevel];

  // Assume ~1.5 hours per task on average
  const suggestedTaskCount = Math.max(1, Math.floor(effectiveHours / 1.5));

  const capacity: DayCapacity = {
    energyLevel,
    availableHours,
    meetingHours,
    productiveHours,
    suggestedTaskCount,
  };

  const energyLabels = {
    1: 'Brain Dead',
    2: 'Low Energy',
    3: 'Medium Energy',
    4: 'High Energy',
    5: 'Peak Energy',
  };

  const report = `# Day Capacity Assessment

**Energy Level:** ${energyLevel}/5 (${energyLabels[energyLevel]})
**Available Hours:** ${availableHours}h
**Meeting Hours:** ${meetingHours}h
**Productive Hours:** ${productiveHours}h
**Effective Hours:** ${effectiveHours.toFixed(1)}h (${(capacityMultipliers[energyLevel] * 100).toFixed(0)}% capacity)

## Recommended Task Load
**Suggested Tasks for Today:** ${suggestedTaskCount}

## Energy-Specific Guidance
${energyLevel === 1 ? 'Brain Dead: Focus on administrative tasks, email, or one tiny win.' : ''}
${energyLevel === 2 ? 'Low Energy: Handle routine tasks, respond to messages, light planning.' : ''}
${energyLevel === 3 ? 'Medium Energy: Standard workflow, 1-2 moderate tasks plus admin.' : ''}
${energyLevel === 4 ? 'High Energy: Tackle challenging tasks, creative work, problem-solving.' : ''}
${energyLevel === 5 ? 'Peak Energy: Deep work, critical decisions, high-impact projects.' : ''}

## Today List Status
${suggestedTaskCount < 3 ? 'Keep Today list minimal (1-2 cards max)' : ''}
${suggestedTaskCount >= 3 && suggestedTaskCount <= 5 ? 'Normal capacity (3-5 cards on Today)' : ''}
${suggestedTaskCount > 5 ? 'High capacity day!' : ''}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: report,
      },
    ],
  };
}

/**
 * Generate accountability message based on current crash state
 */
export async function handleGenerateAccountabilityMessage(
  client: TrelloClient,
  config: ServerConfig['trello'],
  args: z.infer<typeof generateAccountabilityMessageSchema>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  // First assess crash state
  const crashResult = await handleAssessCrashState(client, config, {});
  const crashText = crashResult.content[0].text;

  // Parse tier from crash assessment
  const tierMatch = crashText.match(/Tier (\d)/);
  const tier = tierMatch ? (parseInt(tierMatch[1]) as CrashState['tier']) : 0;

  const daysSinceMatch = crashText.match(/Days Since Last Activity:\*\* (\d+)/);
  const daysSinceLastActivity = daysSinceMatch ? parseInt(daysSinceMatch[1]) : 0;

  const lastActivityMatch = crashText.match(/Last Activity:\*\* (.+)/);
  const lastActivityDate = lastActivityMatch ? lastActivityMatch[1] : null;

  const suggestedActionMatch = crashText.match(/## Suggested Action\n(.+)/);
  const suggestedAction = suggestedActionMatch ? suggestedActionMatch[1] : 'Check your board and move one card.';

  const crashState: CrashState = {
    tier,
    daysSinceLastActivity,
    lastActivityDate,
    suggestedAction,
  };

  const message = args.format === 'sms' ? getSMSMessage(crashState) : generateFullMessage(crashState);

  return {
    content: [
      {
        type: 'text' as const,
        text: message,
      },
    ],
  };
}

/**
 * Calculate weekly completion statistics
 */
export async function handleWeeklyCompletionStats(
  client: TrelloClient,
  config: ServerConfig['trello'],
  args: z.infer<typeof weeklyCompletionStatsSchema>
): Promise<{ content: Array<{ type: 'text'; text: string }> }> {
  const days = args.days || 7;
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  // Get cards from Done list
  const doneCards = await client.listCards(config.lists.done);

  // Filter to cards completed within the time window
  const recentCompletions = doneCards.filter((card) => {
    const lastActivity = new Date(card.dateLastActivity);
    return lastActivity >= cutoffDate;
  });

  // Get cards still in flight (Today + Doing + This Week)
  const todayCards = await client.listCards(config.lists.today);
  const doingCards = await client.listCards(config.lists.doing);
  const thisWeekCards = await client.listCards(config.lists.thisWeek);

  const totalActiveTasks = todayCards.length + doingCards.length + thisWeekCards.length;
  const totalTasks = totalActiveTasks + recentCompletions.length;

  const completionRate = totalTasks > 0 ? (recentCompletions.length / totalTasks) * 100 : 0;

  // Analyze energy distribution of completed tasks
  const energyDistribution = {
    high: 0,
    medium: 0,
    low: 0,
    brainDead: 0,
  };

  for (const card of recentCompletions) {
    const energy = getEnergyLevelFromCard(card, config);
    if (energy >= 4) energyDistribution.high++;
    else if (energy === 3) energyDistribution.medium++;
    else if (energy === 2) energyDistribution.low++;
    else energyDistribution.brainDead++;
  }

  // Calculate average time in Doing (proxy: look at cards that were on Doing)
  // Note: This is simplified - real implementation would need action history
  const averageTimeInDoing = 1.5; // Placeholder - would need Trello actions API

  // Delegation ratio (cards with members assigned)
  const delegatedCount = recentCompletions.filter((c) => c.idMembers.length > 0).length;
  const delegationRatio = recentCompletions.length > 0 ? (delegatedCount / recentCompletions.length) * 100 : 0;

  const stats: WeeklyStats = {
    completionRate: Math.round(completionRate),
    averageTimeInDoing,
    energyPattern: energyDistribution,
    delegationRatio: Math.round(delegationRatio),
  };

  const report = `# Weekly Completion Stats (${days} days)

## Summary
**Completed:** ${recentCompletions.length} tasks
**In Progress:** ${totalActiveTasks} tasks
**Completion Rate:** ${stats.completionRate}%
**Delegation Rate:** ${stats.delegationRatio}%

## Energy Distribution (Completed Tasks)
- **High Energy:** ${energyDistribution.high} tasks (${recentCompletions.length > 0 ? Math.round((energyDistribution.high / recentCompletions.length) * 100) : 0}%)
- **Medium Energy:** ${energyDistribution.medium} tasks (${recentCompletions.length > 0 ? Math.round((energyDistribution.medium / recentCompletions.length) * 100) : 0}%)
- **Low Energy:** ${energyDistribution.low} tasks (${recentCompletions.length > 0 ? Math.round((energyDistribution.low / recentCompletions.length) * 100) : 0}%)
- **Brain Dead:** ${energyDistribution.brainDead} tasks (${recentCompletions.length > 0 ? Math.round((energyDistribution.brainDead / recentCompletions.length) * 100) : 0}%)

## Insights
${stats.completionRate >= 70 ? 'Strong completion rate! Keep this momentum.' : ''}
${stats.completionRate >= 50 && stats.completionRate < 70 ? 'Moderate completion rate. Consider focusing on fewer tasks.' : ''}
${stats.completionRate < 50 ? 'Low completion rate. Too much in flight? Focus on finishing existing tasks.' : ''}

${stats.delegationRatio > 30 ? "Good delegation! You're leveraging your team." : ''}
${stats.delegationRatio < 10 ? "Low delegation. Are you doing too much yourself?" : ''}

${energyDistribution.high > energyDistribution.low * 2 ? "You're tackling high-energy tasks well!" : ''}
${energyDistribution.brainDead > energyDistribution.high ? 'Lots of low-energy wins. Balance with high-impact tasks.' : ''}

## Recent Completions
${recentCompletions.slice(0, 5).map(card => `- ${card.name}`).join('\n')}
${recentCompletions.length > 5 ? `\n... and ${recentCompletions.length - 5} more` : ''}`;

  return {
    content: [
      {
        type: 'text' as const,
        text: report,
      },
    ],
  };
}
