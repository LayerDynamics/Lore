/**
 * Trello MCP Tool Schemas and Handlers
 */

import type { TrelloClient } from './client.js';
import { z } from 'zod';

// Schemas
export const listCardsSchema = z.object({
  list_id: z.string().describe('List ID to fetch cards from'),
});

export const getCardSchema = z.object({
  card_id: z.string().describe('Card ID to fetch'),
});

export const createCardSchema = z.object({
  name: z.string().describe('Card title'),
  list_id: z.string().describe('List ID where the card should be created'),
  desc: z.string().optional().describe('Card description (optional)'),
  due: z.string().optional().describe('Due date in ISO 8601 format (optional)'),
  label_ids: z.array(z.string()).optional().describe('Label IDs to apply (optional)'),
  member_ids: z.array(z.string()).optional().describe('Member IDs to assign (optional)'),
  position: z.union([z.literal('top'), z.literal('bottom'), z.number()]).optional().describe('Position in list (optional)'),
});

export const updateCardSchema = z.object({
  card_id: z.string().describe('Card ID to update'),
  name: z.string().optional().describe('New card title (optional)'),
  desc: z.string().optional().describe('New description (optional)'),
  due: z.string().optional().describe('New due date in ISO 8601 format (optional)'),
  due_complete: z.boolean().optional().describe('Mark due date as complete (optional)'),
  list_id: z.string().optional().describe('Move to new list (optional)'),
  position: z.union([z.literal('top'), z.literal('bottom'), z.number()]).optional().describe('New position (optional)'),
});

export const deleteCardSchema = z.object({
  card_id: z.string().describe('Card ID to delete permanently'),
});

export const archiveCardSchema = z.object({
  card_id: z.string().describe('Card ID to archive (soft delete)'),
});

export const addCommentSchema = z.object({
  card_id: z.string().describe('Card ID to comment on'),
  text: z.string().describe('Comment text'),
});

export const manageChecklistSchema = z.object({
  action: z.enum(['create', 'add_item', 'check_item', 'uncheck_item', 'delete']).describe('Checklist action to perform'),
  card_id: z.string().optional().describe('Card ID (for create action)'),
  checklist_id: z.string().optional().describe('Checklist ID (for add_item, delete actions)'),
  checklist_name: z.string().optional().describe('Checklist name (for create action)'),
  item_name: z.string().optional().describe('Item name (for add_item action)'),
  check_item_id: z.string().optional().describe('Check item ID (for check/uncheck actions)'),
});

export const manageLabelsSchema = z.object({
  action: z.enum(['add', 'remove']).describe('Label action to perform'),
  card_id: z.string().describe('Card ID'),
  label_id: z.string().describe('Label ID'),
});

export const setCustomFieldSchema = z.object({
  card_id: z.string().describe('Card ID'),
  custom_field_id: z.string().describe('Custom field ID'),
  value: z.union([z.string(), z.number(), z.boolean(), z.object({})]).describe('Custom field value'),
});

export const assignMemberSchema = z.object({
  action: z.enum(['add', 'remove']).describe('Member action to perform'),
  card_id: z.string().describe('Card ID'),
  member_id: z.string().describe('Member ID'),
});

export const searchCardsSchema = z.object({
  query: z.string().describe('Search query text'),
  board_id: z.string().optional().describe('Board ID to search within (uses default if configured)'),
});

export const getCardActivitySchema = z.object({
  card_id: z.string().describe('Card ID to get activity for'),
});

export const getBoardActivitySchema = z.object({
  board_id: z.string().optional().describe('Board ID to get activity for (uses default if configured)'),
  limit: z.number().optional().describe('Number of activities to return (default 50)'),
});

// Handlers
export async function handleListCards(client: TrelloClient, args: z.infer<typeof listCardsSchema>) {
  const cards = await client.listCards(args.list_id);
  return { content: [{ type: 'text' as const, text: JSON.stringify(cards, null, 2) }] };
}

export async function handleGetCard(client: TrelloClient, args: z.infer<typeof getCardSchema>) {
  const card = await client.getCard(args.card_id);
  return { content: [{ type: 'text' as const, text: JSON.stringify(card, null, 2) }] };
}

export async function handleCreateCard(client: TrelloClient, args: z.infer<typeof createCardSchema>) {
  const card = await client.createCard({
    name: args.name,
    idList: args.list_id,
    desc: args.desc,
    due: args.due,
    idLabels: args.label_ids,
    idMembers: args.member_ids,
    pos: args.position,
  });
  return { content: [{ type: 'text' as const, text: `Card created: ${card.name} (${card.id})\n${card.url}` }] };
}

export async function handleUpdateCard(client: TrelloClient, args: z.infer<typeof updateCardSchema>) {
  const card = await client.updateCard(args.card_id, {
    name: args.name,
    desc: args.desc,
    due: args.due,
    dueComplete: args.due_complete,
    idList: args.list_id,
    pos: args.position,
  });
  return { content: [{ type: 'text' as const, text: `Card updated: ${card.name} (${card.id})` }] };
}

export async function handleDeleteCard(client: TrelloClient, args: z.infer<typeof deleteCardSchema>) {
  await client.deleteCard(args.card_id);
  return { content: [{ type: 'text' as const, text: `Card ${args.card_id} deleted permanently` }] };
}

export async function handleArchiveCard(client: TrelloClient, args: z.infer<typeof archiveCardSchema>) {
  const card = await client.archiveCard(args.card_id);
  return { content: [{ type: 'text' as const, text: `Card archived: ${card.name} (${card.id})` }] };
}

export async function handleAddComment(client: TrelloClient, args: z.infer<typeof addCommentSchema>) {
  await client.addComment(args.card_id, args.text);
  return { content: [{ type: 'text' as const, text: `Comment added to card ${args.card_id}` }] };
}

export async function handleManageChecklist(client: TrelloClient, args: z.infer<typeof manageChecklistSchema>) {
  switch (args.action) {
    case 'create': {
      if (!args.card_id || !args.checklist_name) {
        throw new Error('card_id and checklist_name required for create action');
      }
      const checklist = await client.createChecklist(args.card_id, args.checklist_name);
      return { content: [{ type: 'text' as const, text: `Checklist created: ${checklist.name} (${checklist.id})` }] };
    }
    case 'add_item': {
      if (!args.checklist_id || !args.item_name) {
        throw new Error('checklist_id and item_name required for add_item action');
      }
      await client.addChecklistItem(args.checklist_id, args.item_name);
      return { content: [{ type: 'text' as const, text: `Item added to checklist ${args.checklist_id}` }] };
    }
    case 'check_item': {
      if (!args.card_id || !args.check_item_id) {
        throw new Error('card_id and check_item_id required for check_item action');
      }
      await client.updateChecklistItem(args.card_id, args.check_item_id, 'complete');
      return { content: [{ type: 'text' as const, text: `Checklist item ${args.check_item_id} marked as complete` }] };
    }
    case 'uncheck_item': {
      if (!args.card_id || !args.check_item_id) {
        throw new Error('card_id and check_item_id required for uncheck_item action');
      }
      await client.updateChecklistItem(args.card_id, args.check_item_id, 'incomplete');
      return { content: [{ type: 'text' as const, text: `Checklist item ${args.check_item_id} marked as incomplete` }] };
    }
    case 'delete': {
      if (!args.checklist_id) {
        throw new Error('checklist_id required for delete action');
      }
      await client.deleteChecklist(args.checklist_id);
      return { content: [{ type: 'text' as const, text: `Checklist ${args.checklist_id} deleted` }] };
    }
  }
}

export async function handleManageLabels(client: TrelloClient, args: z.infer<typeof manageLabelsSchema>) {
  if (args.action === 'add') {
    await client.addLabel(args.card_id, args.label_id);
    return { content: [{ type: 'text' as const, text: `Label ${args.label_id} added to card ${args.card_id}` }] };
  } else {
    await client.removeLabel(args.card_id, args.label_id);
    return { content: [{ type: 'text' as const, text: `Label ${args.label_id} removed from card ${args.card_id}` }] };
  }
}

export async function handleSetCustomField(client: TrelloClient, args: z.infer<typeof setCustomFieldSchema>) {
  await client.setCustomField(args.card_id, args.custom_field_id, args.value);
  return { content: [{ type: 'text' as const, text: `Custom field ${args.custom_field_id} set on card ${args.card_id}` }] };
}

export async function handleAssignMember(client: TrelloClient, args: z.infer<typeof assignMemberSchema>) {
  if (args.action === 'add') {
    await client.addMember(args.card_id, args.member_id);
    return { content: [{ type: 'text' as const, text: `Member ${args.member_id} added to card ${args.card_id}` }] };
  } else {
    await client.removeMember(args.card_id, args.member_id);
    return { content: [{ type: 'text' as const, text: `Member ${args.member_id} removed from card ${args.card_id}` }] };
  }
}

export async function handleSearchCards(client: TrelloClient, args: z.infer<typeof searchCardsSchema>) {
  const cards = await client.searchCards(args.board_id, args.query);
  return { content: [{ type: 'text' as const, text: JSON.stringify(cards, null, 2) }] };
}

export async function handleGetCardActivity(client: TrelloClient, args: z.infer<typeof getCardActivitySchema>) {
  const activity = await client.getCardActivity(args.card_id);
  return { content: [{ type: 'text' as const, text: JSON.stringify(activity, null, 2) }] };
}

export async function handleGetBoardActivity(client: TrelloClient, args: z.infer<typeof getBoardActivitySchema>) {
  const activity = await client.getBoardActivity(args.board_id, args.limit);
  return { content: [{ type: 'text' as const, text: JSON.stringify(activity, null, 2) }] };
}
