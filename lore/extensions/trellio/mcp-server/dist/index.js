#!/usr/bin/env node

// src/index.ts
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// src/server.ts
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
  ListPromptsRequestSchema,
  GetPromptRequestSchema
} from "@modelcontextprotocol/sdk/types.js";
import { zodToJsonSchema } from "zod-to-json-schema";

// src/config.ts
import { z } from "zod";
var configSchema = z.object({
  apiKey: z.string().min(1, "TRELLO_API_KEY is required"),
  token: z.string().min(1, "TRELLO_TOKEN is required"),
  defaultBoardId: z.string().optional()
});
function loadConfig() {
  const rawConfig = {
    apiKey: process.env.TRELLO_API_KEY || "",
    token: process.env.TRELLO_TOKEN || "",
    defaultBoardId: process.env.TRELLO_BOARD_ID || void 0
  };
  try {
    return configSchema.parse(rawConfig);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.message).join("\n");
      throw new Error(`Configuration validation failed:
${missingVars}`);
    }
    throw error;
  }
}
var configInstance = null;
function getConfig() {
  if (!configInstance) {
    configInstance = loadConfig();
  }
  return configInstance;
}

// src/trello/client.ts
var TrelloClient = class {
  config;
  lastRequestTime = 0;
  rateLimit = 100;
  constructor(config) {
    this.config = config;
  }
  async applyRateLimit() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimit - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }
  async request(endpoint, options = {}) {
    await this.applyRateLimit();
    const url = new URL(`https://api.trello.com/1${endpoint}`);
    url.searchParams.set("key", this.config.apiKey);
    url.searchParams.set("token", this.config.token);
    const response = await fetch(url.toString(), options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Trello API error (${response.status}): ${errorText}`);
    }
    return response.json();
  }
  /** Resolve board ID from explicit param or default config */
  resolveBoardId(boardId) {
    const resolved = boardId || this.config.defaultBoardId;
    if (!resolved) {
      throw new Error("No board_id provided and no default TRELLO_BOARD_ID configured. Use trello_list_boards to find board IDs.");
    }
    return resolved;
  }
  // Card CRUD
  async listCards(listId) {
    return this.request(
      `/lists/${listId}/cards?customFieldItems=true&members=true&checklists=all`
    );
  }
  async getCard(cardId) {
    return this.request(
      `/cards/${cardId}?customFieldItems=true&members=true&checklists=all&actions=commentCard`
    );
  }
  async createCard(data) {
    const body = new URLSearchParams();
    body.set("name", data.name);
    body.set("idList", data.idList);
    if (data.desc) body.set("desc", data.desc);
    if (data.due) body.set("due", data.due);
    if (data.idLabels) body.set("idLabels", data.idLabels.join(","));
    if (data.idMembers) body.set("idMembers", data.idMembers.join(","));
    if (data.pos) body.set("pos", String(data.pos));
    return this.request("/cards", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
  }
  async updateCard(cardId, data) {
    const body = new URLSearchParams();
    if (data.name !== void 0) body.set("name", data.name);
    if (data.desc !== void 0) body.set("desc", data.desc);
    if (data.due !== void 0) body.set("due", data.due);
    if (data.dueComplete !== void 0) body.set("dueComplete", String(data.dueComplete));
    if (data.idList !== void 0) body.set("idList", data.idList);
    if (data.pos !== void 0) body.set("pos", String(data.pos));
    if (data.closed !== void 0) body.set("closed", String(data.closed));
    return this.request(`/cards/${cardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
  }
  async deleteCard(cardId) {
    await this.request(`/cards/${cardId}`, { method: "DELETE" });
  }
  async archiveCard(cardId) {
    return this.updateCard(cardId, { closed: true });
  }
  // Labels
  async addLabel(cardId, labelId) {
    await this.request(`/cards/${cardId}/idLabels`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ value: labelId }).toString()
    });
  }
  async removeLabel(cardId, labelId) {
    await this.request(`/cards/${cardId}/idLabels/${labelId}`, {
      method: "DELETE"
    });
  }
  async getBoardLabels(boardId) {
    return this.request(`/boards/${boardId}/labels`);
  }
  // Comments
  async addComment(cardId, text) {
    await this.request(`/cards/${cardId}/actions/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text }).toString()
    });
  }
  // Checklists
  async createChecklist(cardId, name) {
    return this.request(`/cards/${cardId}/checklists`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name }).toString()
    });
  }
  async addChecklistItem(checklistId, name) {
    await this.request(`/checklists/${checklistId}/checkItems`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ name }).toString()
    });
  }
  async updateChecklistItem(cardId, checkItemId, state) {
    await this.request(`/cards/${cardId}/checkItem/${checkItemId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ state }).toString()
    });
  }
  async deleteChecklist(checklistId) {
    await this.request(`/checklists/${checklistId}`, { method: "DELETE" });
  }
  // Custom Fields
  async setCustomField(cardId, customFieldId, value) {
    await this.request(`/cards/${cardId}/customField/${customFieldId}/item`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ value })
    });
  }
  // Members
  async addMember(cardId, memberId) {
    await this.request(`/cards/${cardId}/idMembers`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ value: memberId }).toString()
    });
  }
  async removeMember(cardId, memberId) {
    await this.request(`/cards/${cardId}/idMembers/${memberId}`, {
      method: "DELETE"
    });
  }
  async getBoardMembers(boardId) {
    return this.request(`/boards/${boardId}/members`);
  }
  // Board & Lists
  async getBoardLists(boardId) {
    return this.request(`/boards/${boardId}/lists?cards=all&card_customFieldItems=true`);
  }
  async searchCards(boardId, query) {
    const encodedQuery = encodeURIComponent(`${query} board:${boardId}`);
    const results = await this.request(`/search?query=${encodedQuery}&modelTypes=cards`);
    return results.cards;
  }
  async getCardActivity(cardId) {
    return this.request(`/cards/${cardId}/actions`);
  }
  async getBoardActivity(boardId, limit = 50) {
    return this.request(`/boards/${boardId}/actions?limit=${limit}`);
  }
  async listUserBoards() {
    return this.request("/members/me/boards");
  }
  async getBoard(boardId) {
    return this.request(`/boards/${boardId}?lists=all&labels=all&members=all`);
  }
  async createBoard(data) {
    const body = new URLSearchParams();
    body.set("name", data.name);
    if (data.desc) body.set("desc", data.desc);
    body.set("defaultLists", String(data.defaultLists !== false));
    body.set("defaultLabels", String(data.defaultLabels !== false));
    if (data.prefs_permissionLevel) body.set("prefs_permissionLevel", data.prefs_permissionLevel);
    return this.request("/boards", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
  }
  async updateBoard(boardId, data) {
    const body = new URLSearchParams();
    if (data.name) body.set("name", data.name);
    if (data.desc !== void 0) body.set("desc", data.desc);
    if (data.closed !== void 0) body.set("closed", String(data.closed));
    return this.request(`/boards/${boardId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString()
    });
  }
};

// src/registry.ts
var ToolRegistry = class {
  tools = /* @__PURE__ */ new Map();
  register(tool) {
    if (this.tools.has(tool.name)) {
      throw new Error(`Tool ${tool.name} is already registered`);
    }
    this.tools.set(tool.name, tool);
  }
  registerMultiple(tools) {
    tools.forEach((tool) => this.register(tool));
  }
  get(name) {
    return this.tools.get(name);
  }
  getAll() {
    return Array.from(this.tools.values());
  }
  has(name) {
    return this.tools.has(name);
  }
};
var ResourceRegistry = class {
  resources = /* @__PURE__ */ new Map();
  register(resource) {
    if (this.resources.has(resource.uri)) {
      throw new Error(`Resource ${resource.uri} is already registered`);
    }
    this.resources.set(resource.uri, resource);
  }
  registerMultiple(resources) {
    resources.forEach((resource) => this.register(resource));
  }
  get(uri) {
    return this.resources.get(uri);
  }
  getAll() {
    return Array.from(this.resources.values());
  }
  has(uri) {
    return this.resources.has(uri);
  }
};

// src/trello/tools.ts
import { z as z2 } from "zod";
var listCardsSchema = z2.object({
  list_id: z2.string().describe("List ID to fetch cards from")
});
var getCardSchema = z2.object({
  card_id: z2.string().describe("Card ID to fetch")
});
var createCardSchema = z2.object({
  name: z2.string().describe("Card title"),
  list_id: z2.string().describe("List ID where the card should be created"),
  desc: z2.string().optional().describe("Card description (optional)"),
  due: z2.string().optional().describe("Due date in ISO 8601 format (optional)"),
  label_ids: z2.array(z2.string()).optional().describe("Label IDs to apply (optional)"),
  member_ids: z2.array(z2.string()).optional().describe("Member IDs to assign (optional)"),
  position: z2.union([z2.literal("top"), z2.literal("bottom"), z2.number()]).optional().describe("Position in list (optional)")
});
var updateCardSchema = z2.object({
  card_id: z2.string().describe("Card ID to update"),
  name: z2.string().optional().describe("New card title (optional)"),
  desc: z2.string().optional().describe("New description (optional)"),
  due: z2.string().optional().describe("New due date in ISO 8601 format (optional)"),
  due_complete: z2.boolean().optional().describe("Mark due date as complete (optional)"),
  list_id: z2.string().optional().describe("Move to new list (optional)"),
  position: z2.union([z2.literal("top"), z2.literal("bottom"), z2.number()]).optional().describe("New position (optional)")
});
var deleteCardSchema = z2.object({
  card_id: z2.string().describe("Card ID to delete permanently")
});
var archiveCardSchema = z2.object({
  card_id: z2.string().describe("Card ID to archive (soft delete)")
});
var addCommentSchema = z2.object({
  card_id: z2.string().describe("Card ID to comment on"),
  text: z2.string().describe("Comment text")
});
var manageChecklistSchema = z2.object({
  action: z2.enum(["create", "add_item", "check_item", "uncheck_item", "delete"]).describe("Checklist action to perform"),
  card_id: z2.string().optional().describe("Card ID (for create action)"),
  checklist_id: z2.string().optional().describe("Checklist ID (for add_item, delete actions)"),
  checklist_name: z2.string().optional().describe("Checklist name (for create action)"),
  item_name: z2.string().optional().describe("Item name (for add_item action)"),
  check_item_id: z2.string().optional().describe("Check item ID (for check/uncheck actions)")
});
var manageLabelsSchema = z2.object({
  action: z2.enum(["add", "remove"]).describe("Label action to perform"),
  card_id: z2.string().describe("Card ID"),
  label_id: z2.string().describe("Label ID")
});
var setCustomFieldSchema = z2.object({
  card_id: z2.string().describe("Card ID"),
  custom_field_id: z2.string().describe("Custom field ID"),
  value: z2.union([z2.string(), z2.number(), z2.boolean(), z2.object({})]).describe("Custom field value")
});
var assignMemberSchema = z2.object({
  action: z2.enum(["add", "remove"]).describe("Member action to perform"),
  card_id: z2.string().describe("Card ID"),
  member_id: z2.string().describe("Member ID")
});
var searchCardsSchema = z2.object({
  query: z2.string().describe("Search query text"),
  board_id: z2.string().optional().describe("Board ID to search within (uses default if configured)")
});
var getCardActivitySchema = z2.object({
  card_id: z2.string().describe("Card ID to get activity for")
});
var getBoardActivitySchema = z2.object({
  board_id: z2.string().optional().describe("Board ID to get activity for (uses default if configured)"),
  limit: z2.number().optional().describe("Number of activities to return (default 50)")
});
async function handleListCards(client, args) {
  const cards = await client.listCards(args.list_id);
  return { content: [{ type: "text", text: JSON.stringify(cards, null, 2) }] };
}
async function handleGetCard(client, args) {
  const card = await client.getCard(args.card_id);
  return { content: [{ type: "text", text: JSON.stringify(card, null, 2) }] };
}
async function handleCreateCard(client, args) {
  const card = await client.createCard({
    name: args.name,
    idList: args.list_id,
    desc: args.desc,
    due: args.due,
    idLabels: args.label_ids,
    idMembers: args.member_ids,
    pos: args.position
  });
  return { content: [{ type: "text", text: `Card created: ${card.name} (${card.id})
${card.url}` }] };
}
async function handleUpdateCard(client, args) {
  const card = await client.updateCard(args.card_id, {
    name: args.name,
    desc: args.desc,
    due: args.due,
    dueComplete: args.due_complete,
    idList: args.list_id,
    pos: args.position
  });
  return { content: [{ type: "text", text: `Card updated: ${card.name} (${card.id})` }] };
}
async function handleDeleteCard(client, args) {
  await client.deleteCard(args.card_id);
  return { content: [{ type: "text", text: `Card ${args.card_id} deleted permanently` }] };
}
async function handleArchiveCard(client, args) {
  const card = await client.archiveCard(args.card_id);
  return { content: [{ type: "text", text: `Card archived: ${card.name} (${card.id})` }] };
}
async function handleAddComment(client, args) {
  await client.addComment(args.card_id, args.text);
  return { content: [{ type: "text", text: `Comment added to card ${args.card_id}` }] };
}
async function handleManageChecklist(client, args) {
  switch (args.action) {
    case "create": {
      if (!args.card_id || !args.checklist_name) {
        throw new Error("card_id and checklist_name required for create action");
      }
      const checklist = await client.createChecklist(args.card_id, args.checklist_name);
      return { content: [{ type: "text", text: `Checklist created: ${checklist.name} (${checklist.id})` }] };
    }
    case "add_item": {
      if (!args.checklist_id || !args.item_name) {
        throw new Error("checklist_id and item_name required for add_item action");
      }
      await client.addChecklistItem(args.checklist_id, args.item_name);
      return { content: [{ type: "text", text: `Item added to checklist ${args.checklist_id}` }] };
    }
    case "check_item": {
      if (!args.card_id || !args.check_item_id) {
        throw new Error("card_id and check_item_id required for check_item action");
      }
      await client.updateChecklistItem(args.card_id, args.check_item_id, "complete");
      return { content: [{ type: "text", text: `Checklist item ${args.check_item_id} marked as complete` }] };
    }
    case "uncheck_item": {
      if (!args.card_id || !args.check_item_id) {
        throw new Error("card_id and check_item_id required for uncheck_item action");
      }
      await client.updateChecklistItem(args.card_id, args.check_item_id, "incomplete");
      return { content: [{ type: "text", text: `Checklist item ${args.check_item_id} marked as incomplete` }] };
    }
    case "delete": {
      if (!args.checklist_id) {
        throw new Error("checklist_id required for delete action");
      }
      await client.deleteChecklist(args.checklist_id);
      return { content: [{ type: "text", text: `Checklist ${args.checklist_id} deleted` }] };
    }
  }
}
async function handleManageLabels(client, args) {
  if (args.action === "add") {
    await client.addLabel(args.card_id, args.label_id);
    return { content: [{ type: "text", text: `Label ${args.label_id} added to card ${args.card_id}` }] };
  } else {
    await client.removeLabel(args.card_id, args.label_id);
    return { content: [{ type: "text", text: `Label ${args.label_id} removed from card ${args.card_id}` }] };
  }
}
async function handleSetCustomField(client, args) {
  await client.setCustomField(args.card_id, args.custom_field_id, args.value);
  return { content: [{ type: "text", text: `Custom field ${args.custom_field_id} set on card ${args.card_id}` }] };
}
async function handleAssignMember(client, args) {
  if (args.action === "add") {
    await client.addMember(args.card_id, args.member_id);
    return { content: [{ type: "text", text: `Member ${args.member_id} added to card ${args.card_id}` }] };
  } else {
    await client.removeMember(args.card_id, args.member_id);
    return { content: [{ type: "text", text: `Member ${args.member_id} removed from card ${args.card_id}` }] };
  }
}
async function handleSearchCards(client, args) {
  const cards = await client.searchCards(args.board_id, args.query);
  return { content: [{ type: "text", text: JSON.stringify(cards, null, 2) }] };
}
async function handleGetCardActivity(client, args) {
  const activity = await client.getCardActivity(args.card_id);
  return { content: [{ type: "text", text: JSON.stringify(activity, null, 2) }] };
}
async function handleGetBoardActivity(client, args) {
  const activity = await client.getBoardActivity(args.board_id, args.limit);
  return { content: [{ type: "text", text: JSON.stringify(activity, null, 2) }] };
}

// src/trello/resources.ts
async function getBoardSnapshotResource(client, boardId) {
  const lists = await client.getBoardLists(boardId);
  const now = /* @__PURE__ */ new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1e3);
  const allCards = lists.flatMap((l) => l.cards || []);
  let overdueCount = 0;
  let staleCount = 0;
  for (const card of allCards) {
    if (card.due && new Date(card.due) < now && !card.dueComplete) {
      overdueCount++;
    }
    if (card.dateLastActivity && new Date(card.dateLastActivity) < twoDaysAgo) {
      staleCount++;
    }
  }
  return `# Board Snapshot

## Lists
${lists.map((l) => `- ${l.name}: ${l.cards?.length || 0} cards`).join("\n")}

## Issues
- Overdue cards: ${overdueCount}
- Stale cards (48+ hrs): ${staleCount}
- Total cards: ${allCards.length}
`;
}
async function getOverdueCardsResource(client, boardId) {
  const lists = await client.getBoardLists(boardId);
  const allCards = lists.flatMap((l) => l.cards || []);
  const now = /* @__PURE__ */ new Date();
  const overdueCards = allCards.filter(
    (card) => card.due && new Date(card.due) < now && !card.dueComplete
  );
  overdueCards.sort(
    (a, b) => new Date(a.due).getTime() - new Date(b.due).getTime()
  );
  return `# Overdue Cards (${overdueCards.length})

${overdueCards.map((card) => {
    const dueDate = new Date(card.due);
    const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1e3 * 60 * 60 * 24));
    return `- **${card.name}** (${daysOverdue} days overdue)
  Due: ${dueDate.toLocaleDateString()}
  ${card.url}`;
  }).join("\n\n")}
`;
}
async function getStaleCardsResource(client, boardId) {
  const lists = await client.getBoardLists(boardId);
  const allCards = lists.flatMap((l) => l.cards || []);
  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1e3);
  const staleCards = allCards.filter(
    (card) => card.dateLastActivity && new Date(card.dateLastActivity) < twoDaysAgo
  );
  staleCards.sort(
    (a, b) => new Date(a.dateLastActivity).getTime() - new Date(b.dateLastActivity).getTime()
  );
  return `# Stale Cards (${staleCards.length})
Cards with no activity in 48+ hours

${staleCards.map((card) => {
    const lastActivity = new Date(card.dateLastActivity);
    const daysStale = Math.floor((Date.now() - lastActivity.getTime()) / (1e3 * 60 * 60 * 24));
    return `- **${card.name}** (${daysStale} days since activity)
  Last: ${lastActivity.toLocaleDateString()}
  ${card.url}`;
  }).join("\n\n")}
`;
}
async function getTeamStatusResource(client, boardId) {
  const lists = await client.getBoardLists(boardId);
  const allCards = lists.flatMap((l) => l.cards || []);
  const members = await client.getBoardMembers(boardId);
  const memberStatus = /* @__PURE__ */ new Map();
  for (const member of members) {
    memberStatus.set(member.id, {
      name: member.fullName || member.username,
      cards: []
    });
  }
  for (const card of allCards) {
    for (const memberId of card.idMembers) {
      const status = memberStatus.get(memberId);
      if (status) {
        status.cards.push(card);
      }
    }
  }
  return `# Team Card Status

${Array.from(memberStatus.values()).map((status) => `
## ${status.name} (${status.cards.length} cards)
${status.cards.map((card) => `- ${card.name}`).join("\n")}
`).join("\n")}
`;
}

// src/trello/tool-registry.ts
function createTrelloTools(client, config) {
  return [
    // Card CRUD
    {
      name: "trello_list_cards",
      description: "Get all cards from a specific Trello list",
      inputSchema: listCardsSchema,
      handler: async (args) => await handleListCards(client, args)
    },
    {
      name: "trello_get_card",
      description: "Get details of a specific card",
      inputSchema: getCardSchema,
      handler: async (args) => await handleGetCard(client, args)
    },
    {
      name: "trello_create_card",
      description: "Create a new card",
      inputSchema: createCardSchema,
      handler: async (args) => await handleCreateCard(client, args)
    },
    {
      name: "trello_update_card",
      description: "Update an existing card",
      inputSchema: updateCardSchema,
      handler: async (args) => await handleUpdateCard(client, args)
    },
    {
      name: "trello_delete_card",
      description: "Delete a card permanently",
      inputSchema: deleteCardSchema,
      handler: async (args) => await handleDeleteCard(client, args)
    },
    {
      name: "trello_archive_card",
      description: "Archive a card (soft delete)",
      inputSchema: archiveCardSchema,
      handler: async (args) => await handleArchiveCard(client, args)
    },
    {
      name: "trello_add_comment",
      description: "Add a comment to a card",
      inputSchema: addCommentSchema,
      handler: async (args) => await handleAddComment(client, args)
    },
    {
      name: "trello_manage_checklist",
      description: "Create, update, or delete checklists",
      inputSchema: manageChecklistSchema,
      handler: async (args) => await handleManageChecklist(client, args)
    },
    {
      name: "trello_manage_labels",
      description: "Add or remove labels from a card",
      inputSchema: manageLabelsSchema,
      handler: async (args) => await handleManageLabels(client, args)
    },
    {
      name: "trello_set_custom_field",
      description: "Set a custom field value on a card",
      inputSchema: setCustomFieldSchema,
      handler: async (args) => await handleSetCustomField(client, args)
    },
    {
      name: "trello_assign_member",
      description: "Add or remove a member from a card",
      inputSchema: assignMemberSchema,
      handler: async (args) => await handleAssignMember(client, args)
    },
    {
      name: "trello_search_cards",
      description: "Search for cards on a board. Requires board_id (or uses default if configured).",
      inputSchema: searchCardsSchema,
      handler: async (args) => {
        const boardId = client.resolveBoardId(args.board_id);
        return await handleSearchCards(client, { ...args, board_id: boardId });
      }
    },
    {
      name: "trello_get_card_activity",
      description: "Get activity log for a card",
      inputSchema: getCardActivitySchema,
      handler: async (args) => await handleGetCardActivity(client, args)
    },
    {
      name: "trello_get_board_activity",
      description: "Get recent activity across a board. Requires board_id (or uses default if configured).",
      inputSchema: getBoardActivitySchema,
      handler: async (args) => {
        const boardId = client.resolveBoardId(args.board_id);
        return await handleGetBoardActivity(client, { ...args, board_id: boardId });
      }
    },
    // Board Management
    {
      name: "trello_list_boards",
      description: "List all Trello boards accessible to the authenticated user",
      inputSchema: { type: "object", properties: {} },
      handler: async () => {
        const boards = await client.listUserBoards();
        return {
          content: [{
            type: "text",
            text: JSON.stringify(boards.map((b) => ({
              id: b.id,
              name: b.name,
              desc: b.desc,
              url: b.url,
              closed: b.closed
            })), null, 2)
          }]
        };
      }
    },
    {
      name: "trello_get_board",
      description: "Get details of a specific board including lists and labels. Requires board_id (or uses default if configured).",
      inputSchema: {
        type: "object",
        properties: {
          board_id: { type: "string", description: "Board ID (uses default if configured and not provided)" }
        }
      },
      handler: async (args) => {
        const boardId = client.resolveBoardId(args.board_id);
        const board = await client.getBoard(boardId);
        return { content: [{ type: "text", text: JSON.stringify(board, null, 2) }] };
      }
    },
    {
      name: "trello_create_board",
      description: "Create a new Trello board",
      inputSchema: {
        type: "object",
        properties: {
          name: { type: "string", description: "Board name" },
          desc: { type: "string", description: "Board description (optional)" },
          default_lists: { type: "boolean", description: "Create default lists (To Do, Doing, Done)" },
          default_labels: { type: "boolean", description: "Create default labels" },
          permission_level: {
            type: "string",
            enum: ["private", "org", "public"],
            description: "Board visibility (default: private)"
          }
        },
        required: ["name"]
      },
      handler: async (args) => {
        const board = await client.createBoard({
          name: args.name,
          desc: args.desc,
          defaultLists: args.default_lists,
          defaultLabels: args.default_labels,
          prefs_permissionLevel: args.permission_level
        });
        return {
          content: [{
            type: "text",
            text: JSON.stringify({ success: true, board: { id: board.id, name: board.name, url: board.url } }, null, 2)
          }]
        };
      }
    },
    {
      name: "trello_update_board",
      description: "Update board name, description, or close/archive a board",
      inputSchema: {
        type: "object",
        properties: {
          board_id: { type: "string", description: "Board ID" },
          name: { type: "string", description: "New board name (optional)" },
          desc: { type: "string", description: "New board description (optional)" },
          closed: { type: "boolean", description: "Close/archive the board (optional)" }
        },
        required: ["board_id"]
      },
      handler: async (args) => {
        const board = await client.updateBoard(args.board_id, {
          name: args.name,
          desc: args.desc,
          closed: args.closed
        });
        return { content: [{ type: "text", text: JSON.stringify(board, null, 2) }] };
      }
    }
  ];
}
function createTrelloResources(client, config) {
  if (!config.defaultBoardId) {
    return [];
  }
  const boardId = config.defaultBoardId;
  return [
    {
      uri: "trello://board/snapshot",
      name: "Board Snapshot",
      description: "Current board state summary (default board)",
      mimeType: "text/plain",
      handler: async () => await getBoardSnapshotResource(client, boardId)
    },
    {
      uri: "trello://board/overdue",
      name: "Overdue Cards",
      description: "All overdue cards sorted by due date (default board)",
      mimeType: "text/plain",
      handler: async () => await getOverdueCardsResource(client, boardId)
    },
    {
      uri: "trello://board/stale",
      name: "Stale Cards",
      description: "Cards with no activity in 48+ hours (default board)",
      mimeType: "text/plain",
      handler: async () => await getStaleCardsResource(client, boardId)
    },
    {
      uri: "trello://board/team-status",
      name: "Team Status",
      description: "Cards grouped by assignee (default board)",
      mimeType: "text/plain",
      handler: async () => await getTeamStatusResource(client, boardId)
    }
  ];
}

// src/trello/prompts.ts
var morningPlanningPrompt = {
  name: "morning_planning",
  description: "Guided morning planning workflow with daily task selection",
  arguments: [
    {
      name: "focus_area",
      description: 'Optional focus area for today (e.g., "frontend", "bugs", "docs")',
      required: false
    }
  ],
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Let's plan my day.${`{{focus_area}}` ? " Focus area: {{focus_area}}" : ""}

Please:
1. Check my board snapshot for current tasks
2. Review what's in my active lists
3. Identify overdue and stale cards that need attention
4. Suggest a realistic plan for today based on:
   - Task priorities and due dates
   - Current workload
5. Help me decide which tasks to focus on

Use the trello_get_board and trello_list_cards tools.`
      }
    }
  ]
};
var weeklyReviewPrompt = {
  name: "weekly_review",
  description: "Complete weekly review workflow with accomplishments, stale task triage, and next week planning",
  arguments: [],
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Let's do my weekly review.

Please guide me through:
1. **Celebration**: Show cards completed this week
2. **Stale Tasks**: Review cards with no activity in 48+ hours - help me decide: keep, reschedule, delegate, or kill
3. **Overdue Review**: Check overdue cards and help me either complete or reschedule them
4. **Next Week Setup**: Help me prioritize based on:
   - What didn't get done this week
   - Upcoming due dates

Use trello_get_board, trello_list_cards, and trello_get_board_activity tools.`
      }
    }
  ]
};
var taskTriagePrompt = {
  name: "task_triage",
  description: "Decision helper for stale or stuck tasks - keep, reschedule, delegate, or kill",
  arguments: [
    {
      name: "card_id",
      description: "Card ID to triage",
      required: true
    }
  ],
  messages: [
    {
      role: "user",
      content: {
        type: "text",
        text: `Help me triage this card: {{card_id}}

Please:
1. Get the card details (title, description, last activity, due date)
2. Ask me questions to understand:
   - Is it still relevant?
   - What's blocking it?
   - Is it the right size?
   - Does someone else own it now?
3. Based on my answers, recommend one of:
   - **Keep**: It's still important, just needs a push
   - **Reschedule**: Move due date or to a different list
   - **Delegate**: Hand off to someone else
   - **Kill**: Archive it, it's not happening
4. Execute the decision

Use trello_get_card, trello_update_card, and trello_archive_card tools.`
      }
    }
  ]
};

// src/server.ts
function log(level, message, data) {
  const timestamp = (/* @__PURE__ */ new Date()).toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  if (level === "ERROR") {
    console.error(logMessage, data || "");
  } else {
    console.error(logMessage, data || "");
  }
}
function createTrellioServer() {
  const server = new Server(
    { name: "trellio-mcp-server", version: "1.0.0" },
    { capabilities: { tools: {}, resources: {}, prompts: {} } }
  );
  const config = getConfig();
  const trelloClient = new TrelloClient(config);
  const toolRegistry = new ToolRegistry();
  const resourceRegistry = new ResourceRegistry();
  toolRegistry.registerMultiple(createTrelloTools(trelloClient, config));
  resourceRegistry.registerMultiple(createTrelloResources(trelloClient, config));
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: toolRegistry.getAll().map((tool) => {
        const inputSchema = tool.inputSchema && typeof tool.inputSchema === "object" && "_def" in tool.inputSchema ? zodToJsonSchema(tool.inputSchema, { target: "openApi3", $refStrategy: "none" }) : tool.inputSchema;
        return { name: tool.name, description: tool.description, inputSchema };
      })
    };
  });
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    log("INFO", `Tool called: ${name}`, args);
    try {
      const tool = toolRegistry.get(name);
      if (!tool) throw new Error(`Unknown tool: ${name}`);
      return await tool.handler(args || {});
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      log("ERROR", `Tool ${name} failed: ${errorMessage}`);
      let userMessage = `Error executing tool ${name}: ${errorMessage}`;
      if (errorMessage.includes("401") || errorMessage.includes("Unauthorized")) {
        userMessage += "\n\nCheck your TRELLO_API_KEY and TRELLO_TOKEN.";
      } else if (errorMessage.includes("404") || errorMessage.includes("Not Found")) {
        userMessage += "\n\nVerify IDs (board, list, card) are correct.";
      } else if (errorMessage.includes("429") || errorMessage.includes("rate limit")) {
        userMessage += "\n\nRate limit exceeded. Wait a moment and try again.";
      }
      return { content: [{ type: "text", text: userMessage }], isError: true };
    }
  });
  server.setRequestHandler(ListResourcesRequestSchema, async () => {
    return {
      resources: resourceRegistry.getAll().map((resource) => ({
        uri: resource.uri,
        name: resource.name,
        description: resource.description,
        mimeType: resource.mimeType
      }))
    };
  });
  server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
    const { uri } = request.params;
    try {
      const resource = resourceRegistry.get(uri);
      if (!resource) throw new Error(`Unknown resource: ${uri}`);
      const text = await resource.handler();
      return { contents: [{ uri, mimeType: resource.mimeType, text }] };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { contents: [{ uri, mimeType: "text/plain", text: `Error reading resource: ${errorMessage}` }] };
    }
  });
  server.setRequestHandler(ListPromptsRequestSchema, async () => {
    return {
      prompts: [
        morningPlanningPrompt,
        weeklyReviewPrompt,
        taskTriagePrompt
      ]
    };
  });
  server.setRequestHandler(GetPromptRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const prompts = {
      morning_planning: morningPlanningPrompt,
      weekly_review: weeklyReviewPrompt,
      task_triage: taskTriagePrompt
    };
    const prompt = prompts[name];
    if (!prompt) throw new Error(`Unknown prompt: ${name}`);
    const messages = prompt.messages.map((msg) => {
      let text = msg.content.text;
      if (args) {
        Object.entries(args).forEach(([key, value]) => {
          text = text.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), String(value));
        });
      }
      return { role: msg.role, content: { type: msg.content.type, text } };
    });
    return { description: prompt.description, messages };
  });
  return server;
}

// src/index.ts
async function main() {
  try {
    const server = createTrellioServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Trellio MCP Server running on stdio");
  } catch (error) {
    console.error("Fatal error starting Trellio MCP Server:", error);
    process.exit(1);
  }
}
process.on("SIGINT", () => {
  console.error("Received SIGINT, shutting down gracefully...");
  process.exit(0);
});
process.on("SIGTERM", () => {
  console.error("Received SIGTERM, shutting down gracefully...");
  process.exit(0);
});
main();
//# sourceMappingURL=index.js.map