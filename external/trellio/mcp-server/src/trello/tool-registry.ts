/**
 * Trello Tools Registry
 */

import { ToolDefinition, ResourceDefinition } from '../registry.js';
import { ServerConfig } from '../types.js';
import { TrelloClient } from './client.js';
import * as Tools from './tools.js';
import * as Helpers from './trellio-helpers.js';
import * as Resources from './resources.js';

export function createTrelloTools(client: TrelloClient, config: ServerConfig['trello']): ToolDefinition[] {
  return [
    // Trello CRUD Tools
    {
      name: 'trello_list_cards',
      description: 'Get all cards from a specific Trello list',
      inputSchema: Tools.listCardsSchema,
      handler: async (args) => await Tools.handleListCards(client, args),
    },
    {
      name: 'trello_get_card',
      description: 'Get details of a specific card',
      inputSchema: Tools.getCardSchema,
      handler: async (args) => await Tools.handleGetCard(client, args),
    },
    {
      name: 'trello_create_card',
      description: 'Create a new card',
      inputSchema: Tools.createCardSchema,
      handler: async (args) => await Tools.handleCreateCard(client, args),
    },
    {
      name: 'trello_update_card',
      description: 'Update an existing card',
      inputSchema: Tools.updateCardSchema,
      handler: async (args) => await Tools.handleUpdateCard(client, args),
    },
    {
      name: 'trello_delete_card',
      description: 'Delete a card permanently',
      inputSchema: Tools.deleteCardSchema,
      handler: async (args) => await Tools.handleDeleteCard(client, args),
    },
    {
      name: 'trello_archive_card',
      description: 'Archive a card (soft delete)',
      inputSchema: Tools.archiveCardSchema,
      handler: async (args) => await Tools.handleArchiveCard(client, args),
    },
    {
      name: 'trello_add_comment',
      description: 'Add a comment to a card',
      inputSchema: Tools.addCommentSchema,
      handler: async (args) => await Tools.handleAddComment(client, args),
    },
    {
      name: 'trello_manage_checklist',
      description: 'Create, update, or delete checklists',
      inputSchema: Tools.manageChecklistSchema,
      handler: async (args) => await Tools.handleManageChecklist(client, args),
    },
    {
      name: 'trello_manage_labels',
      description: 'Add or remove labels from a card',
      inputSchema: Tools.manageLabelsSchema,
      handler: async (args) => await Tools.handleManageLabels(client, args),
    },
    {
      name: 'trello_set_custom_field',
      description: 'Set a custom field value on a card',
      inputSchema: Tools.setCustomFieldSchema,
      handler: async (args) => await Tools.handleSetCustomField(client, args),
    },
    {
      name: 'trello_assign_member',
      description: 'Add or remove a member from a card',
      inputSchema: Tools.assignMemberSchema,
      handler: async (args) => await Tools.handleAssignMember(client, args),
    },
    {
      name: 'trello_search_cards',
      description: 'Search for cards on the board',
      inputSchema: Tools.searchCardsSchema,
      handler: async (args) => await Tools.handleSearchCards(client, args),
    },
    {
      name: 'trello_get_card_activity',
      description: 'Get activity log for a card',
      inputSchema: Tools.getCardActivitySchema,
      handler: async (args) => await Tools.handleGetCardActivity(client, args),
    },
    {
      name: 'trello_get_board_activity',
      description: 'Get recent activity across the entire board',
      inputSchema: Tools.getBoardActivitySchema,
      handler: async (args) => await Tools.handleGetBoardActivity(client, args),
    },

    // Board Management Tools
    {
      name: 'trello_list_boards',
      description: 'List all Trello boards accessible to the authenticated user',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const boards = await client.listUserBoards();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(boards.map(b => ({
              id: b.id,
              name: b.name,
              desc: b.desc,
              url: b.url,
              closed: b.closed
            })), null, 2)
          }]
        };
      },
    },
    {
      name: 'trello_get_board',
      description: 'Get details of a specific board including lists and labels',
      inputSchema: {
        type: 'object',
        properties: {
          board_id: { type: 'string', description: 'Board ID (optional, defaults to configured board)' }
        }
      },
      handler: async (args) => {
        const boardId = args.board_id || config.boardId;
        const board = await client.getBoard(boardId);
        return { content: [{ type: 'text', text: JSON.stringify(board, null, 2) }] };
      },
    },
    {
      name: 'trello_create_board',
      description: 'Create a new Trello board',
      inputSchema: {
        type: 'object',
        properties: {
          name: { type: 'string', description: 'Board name' },
          desc: { type: 'string', description: 'Board description (optional)' },
          default_lists: { type: 'boolean', description: 'Create default lists (To Do, Doing, Done)' },
          default_labels: { type: 'boolean', description: 'Create default labels' },
          permission_level: {
            type: 'string',
            enum: ['private', 'org', 'public'],
            description: 'Board visibility (default: private)'
          },
        },
        required: ['name']
      },
      handler: async (args) => {
        const board = await client.createBoard({
          name: args.name,
          desc: args.desc,
          defaultLists: args.default_lists,
          defaultLabels: args.default_labels,
          prefs_permissionLevel: args.permission_level,
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              board: {
                id: board.id,
                name: board.name,
                url: board.url
              }
            }, null, 2)
          }]
        };
      },
    },
    {
      name: 'trello_update_board',
      description: 'Update board name, description, or close/archive a board',
      inputSchema: {
        type: 'object',
        properties: {
          board_id: { type: 'string', description: 'Board ID' },
          name: { type: 'string', description: 'New board name (optional)' },
          desc: { type: 'string', description: 'New board description (optional)' },
          closed: { type: 'boolean', description: 'Close/archive the board (optional)' }
        },
        required: ['board_id']
      },
      handler: async (args) => {
        const board = await client.updateBoard(args.board_id, {
          name: args.name,
          desc: args.desc,
          closed: args.closed,
        });
        return { content: [{ type: 'text', text: JSON.stringify(board, null, 2) }] };
      },
    },

    // Trellio-Specific Tools
    {
      name: 'trellio_get_board_snapshot',
      description: 'Get complete board state with overdue counts, stale cards, and energy distribution',
      inputSchema: { type: 'object', properties: { include_cards: { type: 'boolean', description: 'Include full card details (default: true)' } } },
      handler: async (args) => {
        const snapshot = await Helpers.getBoardSnapshot(client, config, args.include_cards);
        return { content: [{ type: 'text', text: JSON.stringify(snapshot, null, 2) }] };
      },
    },
    {
      name: 'trellio_get_daily_planning_context',
      description: 'Get Today + This Week cards filtered by energy level for daily planning',
      inputSchema: {
        type: 'object',
        properties: {
          energy_filter: {
            type: 'number',
            enum: [1, 2, 3, 4, 5],
            description: 'Energy level filter (1=Brain Dead, 2=Low, 3=Medium, 4=High, 5=Peak)',
          },
        },
      },
      handler: async (args) => {
        const context = await Helpers.getDailyPlanningContext(client, config, args.energy_filter);
        return { content: [{ type: 'text', text: JSON.stringify(context, null, 2) }] };
      },
    },
    {
      name: 'trellio_move_card_through_pipeline',
      description: 'Move a card to a pipeline stage',
      inputSchema: {
        type: 'object',
        properties: {
          card_id: { type: 'string', description: 'Card ID to move' },
          target_list: {
            type: 'string',
            enum: ['reference', 'this_week', 'today', 'doing', 'done'],
            description: 'Target pipeline stage',
          },
        },
        required: ['card_id', 'target_list'],
      },
      handler: async (args) => {
        const result = await Helpers.moveCardThroughPipeline(client, config, args.card_id, args.target_list);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      },
    },
    {
      name: 'trellio_quick_add_task',
      description: 'Create a task with metadata in one call',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          list: { type: 'string', enum: ['reference', 'this_week', 'today', 'doing', 'done'] },
          energy: { type: 'number', enum: [1, 2, 3, 4, 5] },
          priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          time_estimate: { type: 'string' },
          task_type: { type: 'string' },
          due_date: { type: 'string' },
          quick_win: { type: 'boolean' },
          assignee: { type: 'string' },
        },
        required: ['title'],
      },
      handler: async (args) => {
        const card = await Helpers.quickAddTask(client, config, args);
        return { content: [{ type: 'text', text: `Task created: ${card.name} (${card.id})\n${card.url}` }] };
      },
    },
    {
      name: 'trellio_delegate_task',
      description: 'Create a delegated task with handoff checklist',
      inputSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          assignee: { type: 'string' },
          description: { type: 'string' },
          priority: { type: 'string', enum: ['High', 'Medium', 'Low'] },
          due_date: { type: 'string' },
        },
        required: ['title', 'assignee', 'description', 'priority', 'due_date'],
      },
      handler: async (args) => {
        const card = await Helpers.delegateTask(client, config, args);
        return { content: [{ type: 'text', text: `Task delegated: ${card.name} (${card.id})\n${card.url}` }] };
      },
    },
    {
      name: 'trellio_clean_up_board',
      description: 'Archive Done cards and move Doing/Today back to This Week',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const result = await Helpers.cleanUpBoard(client, config);
        return { content: [{ type: 'text', text: `Board cleaned: ${result.archived} archived, ${result.movedToThisWeek} moved to This Week` }] };
      },
    },
    {
      name: 'trellio_get_energy_matched_tasks',
      description: 'Get tasks matching current energy level',
      inputSchema: {
        type: 'object',
        properties: {
          energy_level: { type: 'number', enum: [1, 2, 3, 4, 5] },
        },
        required: ['energy_level'],
      },
      handler: async (args) => {
        const tasks = await Helpers.getEnergyMatchedTasks(client, config, args.energy_level);
        return { content: [{ type: 'text', text: JSON.stringify(tasks, null, 2) }] };
      },
    },
    {
      name: 'trellio_batch_update_cards',
      description: 'Update multiple cards at once',
      inputSchema: {
        type: 'object',
        properties: {
          updates: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                card_id: { type: 'string' },
                changes: { type: 'object' },
              },
            },
          },
        },
        required: ['updates'],
      },
      handler: async (args) => {
        const result = await Helpers.batchUpdateCards(client, args.updates);
        return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
      },
    },
  ];
}

export function createTrelloResources(client: TrelloClient, config: ServerConfig['trello']): ResourceDefinition[] {
  return [
    {
      uri: 'trello://board/snapshot',
      name: 'Board Snapshot',
      description: 'Current board state with metrics',
      mimeType: 'text/plain',
      handler: async () => await Resources.getBoardSnapshotResource(client, config),
    },
    {
      uri: 'trello://board/overdue',
      name: 'Overdue Cards',
      description: 'All overdue cards sorted by due date',
      mimeType: 'text/plain',
      handler: async () => await Resources.getOverdueCardsResource(client, config),
    },
    {
      uri: 'trello://board/stale',
      name: 'Stale Cards',
      description: 'Cards with no activity in 48+ hours',
      mimeType: 'text/plain',
      handler: async () => await Resources.getStaleCardsResource(client, config),
    },
    {
      uri: 'trello://board/team-status',
      name: 'Team Status',
      description: 'Cards grouped by assignee',
      mimeType: 'text/plain',
      handler: async () => await Resources.getTeamStatusResource(client, config),
    },
    {
      uri: 'trello://board/energy-distribution',
      name: 'Energy Distribution',
      description: 'Card count by energy label',
      mimeType: 'text/plain',
      handler: async () => await Resources.getEnergyDistributionResource(client, config),
    },
    {
      uri: 'trello://board/config',
      name: 'Board Config',
      description: 'Board configuration IDs',
      mimeType: 'text/plain',
      handler: async () => await Resources.getBoardConfigResource(config),
    },
  ];
}
