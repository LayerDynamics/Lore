/**
 * Trello REST API Client
 *
 * Multi-board focused. No board ID baked in — all board-specific
 * methods take boardId as a parameter.
 */

import type { TrelloCard, TrelloList, TrelloLabel, TrelloMember, TrelloChecklist, TrelloConfig } from '../types.js';

export class TrelloClient {
  private config: TrelloConfig;
  private lastRequestTime = 0;
  private readonly rateLimit = 100;

  constructor(config: TrelloConfig) {
    this.config = config;
  }

  private async applyRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.rateLimit) {
      await new Promise((resolve) => setTimeout(resolve, this.rateLimit - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();
  }

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

  /** Resolve board ID from explicit param or default config */
  resolveBoardId(boardId?: string): string {
    const resolved = boardId || this.config.defaultBoardId;
    if (!resolved) {
      throw new Error('No board_id provided and no default TRELLO_BOARD_ID configured. Use trello_list_boards to find board IDs.');
    }
    return resolved;
  }

  // Card CRUD
  async listCards(listId: string): Promise<TrelloCard[]> {
    return this.request<TrelloCard[]>(
      `/lists/${listId}/cards?customFieldItems=true&members=true&checklists=all`
    );
  }

  async getCard(cardId: string): Promise<TrelloCard> {
    return this.request<TrelloCard>(
      `/cards/${cardId}?customFieldItems=true&members=true&checklists=all&actions=commentCard`
    );
  }

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

  async deleteCard(cardId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}`, { method: 'DELETE' });
  }

  async archiveCard(cardId: string): Promise<TrelloCard> {
    return this.updateCard(cardId, { closed: true });
  }

  // Labels
  async addLabel(cardId: string, labelId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idLabels`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ value: labelId }).toString(),
    });
  }

  async removeLabel(cardId: string, labelId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idLabels/${labelId}`, {
      method: 'DELETE',
    });
  }

  async getBoardLabels(boardId: string): Promise<TrelloLabel[]> {
    return this.request<TrelloLabel[]>(`/boards/${boardId}/labels`);
  }

  // Comments
  async addComment(cardId: string, text: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/actions/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ text }).toString(),
    });
  }

  // Checklists
  async createChecklist(cardId: string, name: string): Promise<TrelloChecklist> {
    return this.request<TrelloChecklist>(`/cards/${cardId}/checklists`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name }).toString(),
    });
  }

  async addChecklistItem(checklistId: string, name: string): Promise<void> {
    await this.request<void>(`/checklists/${checklistId}/checkItems`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ name }).toString(),
    });
  }

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

  async deleteChecklist(checklistId: string): Promise<void> {
    await this.request<void>(`/checklists/${checklistId}`, { method: 'DELETE' });
  }

  // Custom Fields
  async setCustomField(cardId: string, customFieldId: string, value: any): Promise<void> {
    await this.request<void>(`/cards/${cardId}/customField/${customFieldId}/item`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ value }),
    });
  }

  // Members
  async addMember(cardId: string, memberId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idMembers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ value: memberId }).toString(),
    });
  }

  async removeMember(cardId: string, memberId: string): Promise<void> {
    await this.request<void>(`/cards/${cardId}/idMembers/${memberId}`, {
      method: 'DELETE',
    });
  }

  async getBoardMembers(boardId: string): Promise<TrelloMember[]> {
    return this.request<TrelloMember[]>(`/boards/${boardId}/members`);
  }

  // Board & Lists
  async getBoardLists(boardId: string): Promise<TrelloList[]> {
    return this.request<TrelloList[]>(`/boards/${boardId}/lists?cards=all&card_customFieldItems=true`);
  }

  async searchCards(boardId: string, query: string): Promise<TrelloCard[]> {
    const encodedQuery = encodeURIComponent(`${query} board:${boardId}`);
    const results = await this.request<{ cards: TrelloCard[] }>(`/search?query=${encodedQuery}&modelTypes=cards`);
    return results.cards;
  }

  async getCardActivity(cardId: string): Promise<any[]> {
    return this.request<any[]>(`/cards/${cardId}/actions`);
  }

  async getBoardActivity(boardId: string, limit = 50): Promise<any[]> {
    return this.request<any[]>(`/boards/${boardId}/actions?limit=${limit}`);
  }

  async listUserBoards(): Promise<any[]> {
    return this.request<any[]>('/members/me/boards');
  }

  async getBoard(boardId: string): Promise<any> {
    return this.request<any>(`/boards/${boardId}?lists=all&labels=all&members=all`);
  }

  async createBoard(data: {
    name: string;
    desc?: string;
    defaultLists?: boolean;
    defaultLabels?: boolean;
    prefs_permissionLevel?: 'private' | 'org' | 'public';
  }): Promise<any> {
    const body = new URLSearchParams();
    body.set('name', data.name);
    if (data.desc) body.set('desc', data.desc);
    body.set('defaultLists', String(data.defaultLists !== false));
    body.set('defaultLabels', String(data.defaultLabels !== false));
    if (data.prefs_permissionLevel) body.set('prefs_permissionLevel', data.prefs_permissionLevel);

    return this.request<any>('/boards', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
  }

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
