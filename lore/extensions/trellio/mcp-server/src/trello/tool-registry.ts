/**
 * Trellio Tool and Resource Registry
 *
 * Multi-board focused: board-specific tools accept board_id param,
 * falling back to TRELLO_BOARD_ID env var if set.
 */

import { ToolDefinition, ResourceDefinition } from '../registry.js';
import { TrelloConfig } from '../types.js';
import { TrelloClient } from './client.js';
import * as Tools from './tools.js';
import * as Resources from './resources.js';

export function createTrelloTools(client: TrelloClient, config: TrelloConfig): ToolDefinition[] {
  return [
    // Card CRUD
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
      description: 'Search for cards on a board. Requires board_id (or uses default if configured).',
      inputSchema: Tools.searchCardsSchema,
      handler: async (args) => {
        const boardId = client.resolveBoardId(args.board_id);
        return await Tools.handleSearchCards(client, { ...args, board_id: boardId });
      },
    },
    {
      name: 'trello_get_card_activity',
      description: 'Get activity log for a card',
      inputSchema: Tools.getCardActivitySchema,
      handler: async (args) => await Tools.handleGetCardActivity(client, args),
    },
    {
      name: 'trello_get_board_activity',
      description: 'Get recent activity across a board. Requires board_id (or uses default if configured).',
      inputSchema: Tools.getBoardActivitySchema,
      handler: async (args) => {
        const boardId = client.resolveBoardId(args.board_id);
        return await Tools.handleGetBoardActivity(client, { ...args, board_id: boardId });
      },
    },

    // Board Management
    {
      name: 'trello_list_boards',
      description: 'List all Trello boards accessible to the authenticated user',
      inputSchema: { type: 'object', properties: {} },
      handler: async () => {
        const boards = await client.listUserBoards();
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(boards.map((b: any) => ({
              id: b.id, name: b.name, desc: b.desc, url: b.url, closed: b.closed
            })), null, 2)
          }]
        };
      },
    },
    {
      name: 'trello_get_board',
      description: 'Get details of a specific board including lists and labels. Requires board_id (or uses default if configured).',
      inputSchema: {
        type: 'object',
        properties: {
          board_id: { type: 'string', description: 'Board ID (uses default if configured and not provided)' }
        }
      },
      handler: async (args) => {
        const boardId = client.resolveBoardId(args.board_id);
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
            text: JSON.stringify({ success: true, board: { id: board.id, name: board.name, url: board.url } }, null, 2)
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
          name: args.name, desc: args.desc, closed: args.closed,
        });
        return { content: [{ type: 'text', text: JSON.stringify(board, null, 2) }] };
      },
    },
  ];
}

export function createTrelloResources(client: TrelloClient, config: TrelloConfig): ResourceDefinition[] {
  // Resources only work if a default board is configured
  if (!config.defaultBoardId) {
    return [];
  }

  const boardId = config.defaultBoardId;

  return [
    {
      uri: 'trello://board/snapshot',
      name: 'Board Snapshot',
      description: 'Current board state summary (default board)',
      mimeType: 'text/plain',
      handler: async () => await Resources.getBoardSnapshotResource(client, boardId),
    },
    {
      uri: 'trello://board/overdue',
      name: 'Overdue Cards',
      description: 'All overdue cards sorted by due date (default board)',
      mimeType: 'text/plain',
      handler: async () => await Resources.getOverdueCardsResource(client, boardId),
    },
    {
      uri: 'trello://board/stale',
      name: 'Stale Cards',
      description: 'Cards with no activity in 48+ hours (default board)',
      mimeType: 'text/plain',
      handler: async () => await Resources.getStaleCardsResource(client, boardId),
    },
    {
      uri: 'trello://board/team-status',
      name: 'Team Status',
      description: 'Cards grouped by assignee (default board)',
      mimeType: 'text/plain',
      handler: async () => await Resources.getTeamStatusResource(client, boardId),
    },
  ];
}
