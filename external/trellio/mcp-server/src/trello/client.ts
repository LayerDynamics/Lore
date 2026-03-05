/**
 * Trello REST API Client
 *
 * Typed REST client wrapping fetch with rate limiting, error handling,
 * and automatic auth parameter injection.
 */

import type { TrelloCard, TrelloList, TrelloLabel, TrelloMember, TrelloChecklist } from '../types.js';
import type { ServerConfig } from '../types.js';

export class TrelloClient {
  private config: ServerConfig['trello'];
  private lastRequestTime = 0;
  private readonly rateLimit = 100; // 100ms between calls

  constructor(config: ServerConfig['trello']) {
    this.config = config;
  }

  /**
   * Rate limiting wrapper
   */
  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimit - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

  /**
   * Make authenticated API request
   */
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await this.applyRateLimit();

    const url = new URL(`https://api.trello.com/1${endpoint}`);
    url.searchParams.set('key', this.config.apiKey);
    url.searchParams.set('token', this.config.token);

    const response = await fetch(url.toString(), options);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Trello API error (${response.status}): ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  // ========================================================================
  // CARD CRUD OPERATIONS
  // ========================================================================

  /**
   * Get all cards from a specific list
   */
  async listCards(listId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(
      `/lists/${listId}/cards?customFieldItems=true&members=true&checklists=all`
    );
  }

  /**
   * Get a single card by ID
   */
  async getCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(
      `/cards/${cardId}?customFieldItems=true&members=true&checklists=all&actions=commentCard`
    );
  }

  /**
   * Create a new card
   */
  async createCard(data: {
    name: string;
    idList: string;
    desc?: string;
    due?: string;
    idLabels?: string[];
    idMembers?: string[];
    pos?: 'top' | 'bottom' | number;
  }): Promise<TrelloCard> {
    const body = new URLSearchParams();
    body.set('name', data.name);
    body.set('idList', data.idList);
    if (data.desc) body.set('desc', data.desc);
    if (data.due) body.set('due', data.due);
    if (data.idLabels) body.set('idLabels', data.idLabels.join(','));
    if (data.idMembers) body.set('idMembers', data.idMembers.join(','));
    if (data.pos) body.set('pos', String(data.pos));

    return this.request<TrelloCard>('/cards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

  /**
   * Update an existing card
   */
  async updateCard(
    cardId: string,
    data: {
      name?: string;
      desc?: string;
      due?: string;
      dueComplete?: boolean;
      idList?: string;
      pos?: 'top' | 'bottom' | number;
      closed?: boolean;
    }
  ): Promise<TrelloCard> {
    const body = new URLSearchParams();
    if (data.name !== undefined) body.set('name', data.name);
    if (data.desc !== undefined) body.set('desc', data.desc);
    if (data.due !== undefined) body.set('due', data.due);
    if (data.dueComplete !== undefined) body.set('dueComplete', String(data.dueComplete));
    if (data.idList !== undefined) body.set('idList', data.idList);
    if (data.pos !== undefined) body.set('pos', String(data.pos));
    if (data.closed !== undefined) body.set('closed', String(data.closed));

    return this.request<TrelloCard>(`/cards/${cardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

  /**
   * Delete a card permanently
   */
  async deleteCard(cardId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}`, { method: 'DELETE' });
  }

  /**
   * Archive a card (soft delete)
   */
  async archiveCard(cardId: string): Promise<TrelloCard> {
    return this.updateCard(cardId, { closed: true });
  }

  // ========================================================================
  // LABELS
  // ========================================================================

  /**
   * Add a label to a card
   */
  async addLabel(cardId: string, labelId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idLabels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ value: labelId }).toString(),
    });
  }

  /**
   * Remove a label from a card
   */
  async removeLabel(cardId: string, labelId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idLabels/${labelId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all labels for the board
   */
  async getBoardLabels(boardId: string): Promise<TrelloLabel[]> {
    return this.request<TrelloLabel[]>(`/boards/${boardId}/labels`);
  }

  // ========================================================================
  // COMMENTS
  // ========================================================================

  /**
   * Add a comment to a card
   */
  async addComment(cardId: string, text: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/actions/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text }).toString(),
    });
  }

  // ========================================================================
  // CHECKLISTS
  // ========================================================================

  /**
   * Create a checklist on a card
   */
  async createChecklist(cardId: string, name: string): Promise<TrelloChecklist> {
    return this.request<TrelloChecklist>(`/cards/${cardId}/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name }).toString(),
    });
  }

  /**
   * Add an item to a checklist
   */
  async addChecklistItem(checklistId: string, name: string): Promise<void> {
    await this.request<void>(`/checklists/${checklistId}/checkItems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name }).toString(),
    });
  }

  /**
   * Update checklist item state
   */
  async updateChecklistItem(
    cardId: string,
    checkItemId: string,
    state: 'complete' | 'incomplete'
  ): Promise<void> {
    await this.request<void>(`/cards/${cardId}/checkItem/${checkItemId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ state }).toString(),
    });
  }

  /**
   * Delete a checklist
   */
  async deleteChecklist(checklistId: string): Promise<void> {
    await this.request<void>(`/checklists/${checklistId}`, { method: 'DELETE' });
  }

  // ========================================================================
  // CUSTOM FIELDS
  // ========================================================================

  /**
   * Set a custom field value on a card
   */
  async setCustomField(cardId: string, customFieldId: string, value: any): Promise<void> {
    await this.request<void>(`/cards/${cardId}/customField/${customFieldId}/item`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  }

  // ========================================================================
  // MEMBERS
  // ========================================================================

  /**
   * Add a member to a card
   */
  async addMember(cardId: string, memberId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idMembers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ value: memberId }).toString(),
    });
  }

  /**
   * Remove a member from a card
   */
  async removeMember(cardId: string, memberId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idMembers/${memberId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Get all members of the board
   */
  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    return this.request<TrelloMember[]>(`/boards/${boardId}/members`);
  }

  // ========================================================================
  // BOARD & LISTS
  // ========================================================================

  /**
   * Get all lists on a board
   */
  async getBoardLists(boardId: string): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${boardId}/lists?cards=all&card_customFieldItems=true`);
  }

  /**
   * Search cards on a board
   */
  async searchCards(boardId: string, query: string): Promise<TrelloCard[]> {
    const encodedQuery = encodeURIComponent(`${query} board:${boardId}`);
    const results = await this.request<{ cards: TrelloCard[] }>(`/search?query=${encodedQuery}&modelTypes=cards`);
    return results.cards;
  }

  /**
   * Get card activity/actions
   */
  async getCardActivity(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/actions`);
  }

  /**
   * Get board activity
   */
  async getBoardActivity(boardId: string, limit = 50): Promise<any[]> {
    return this.request<any[]>(`/boards/${boardId}/actions?limit=${limit}`);
  }

  // ========================================================================
  // BOARD MANAGEMENT OPERATIONS
  // ========================================================================

  /**
   * Get all boards for the authenticated user
   */
  async listUserBoards(): Promise<any[]> {
    return this.request<any[]>('/members/me/boards');
  }

  /**
   * Get board details
   */
  async getBoard(boardId: string): Promise<any> {
    return this.request<any>(`/boards/${boardId}?lists=all&labels=all&members=all`);
  }

  /**
   * Create a new board
   */
  async createBoard(data: {
    name: string;
    desc?: string;
    defaultLists?: boolean;
    defaultLabels?: boolean;
    prefs_permissionLevel?: 'private' | 'org' | 'public';
    prefs_background?: string;
  }): Promise<any> {
    const body = new URLSearchParams();
    body.set('name', data.name);
    if (data.desc) body.set('desc', data.desc);
    body.set('defaultLists', String(data.defaultLists !== false));
    body.set('defaultLabels', String(data.defaultLabels !== false));
    if (data.prefs_permissionLevel) body.set('prefs_permissionLevel', data.prefs_permissionLevel);
    if (data.prefs_background) body.set('prefs_background', data.prefs_background);

    return this.request<any>('/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

  /**
   * Update board details
   */
  async updateBoard(boardId: string, data: {
    name?: string;
    desc?: string;
    closed?: boolean;
  }): Promise<any> {
    const body = new URLSearchParams();
    if (data.name) body.set('name', data.name);
    if (data.desc !== undefined) body.set('desc', data.desc);
    if (data.closed !== undefined) body.set('closed', String(data.closed));

    return this.request<any>(`/boards/${boardId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }
}
