/**
 * Coach/ADHD Intelligence Tools Registry
 */

import { ToolDefinition } from '../registry.js';
import { ServerConfig } from '../types.js';
import { TrelloClient } from '../trello/client.js';
import * as Tools from './tools.js';

export function createCoachTools(client: TrelloClient, config: ServerConfig['trello']): ToolDefinition[] {
  return [
    {
      name: 'coach_assess_crash_state',
      description: 'Assess current crash/recovery state based on last board activity',
      inputSchema: Tools.assessCrashStateSchema,
      handler: async (args) => await Tools.handleAssessCrashState(client, config, args),
    },
    {
      name: 'coach_get_smallest_next_action',
      description: 'Find the easiest/smallest next action for current energy level',
      inputSchema: Tools.getSmallestNextActionSchema,
      handler: async (args) => await Tools.handleGetSmallestNextAction(client, config, args),
    },
    {
      name: 'coach_calculate_day_capacity',
      description: 'Calculate recommended task count based on energy level and available time',
      inputSchema: Tools.calculateDayCapacitySchema,
      handler: async (args) => await Tools.handleCalculateDayCapacity(client, config, args),
    },
    {
      name: 'coach_generate_accountability_message',
      description: 'Generate tier-appropriate accountability message based on crash state',
      inputSchema: Tools.generateAccountabilityMessageSchema,
      handler: async (args) => await Tools.handleGenerateAccountabilityMessage(client, config, args),
    },
    {
      name: 'coach_weekly_completion_stats',
      description: 'Calculate weekly completion rate and patterns',
      inputSchema: Tools.weeklyCompletionStatsSchema,
      handler: async (args) => await Tools.handleWeeklyCompletionStats(client, config, args),
    },
  ];
}
