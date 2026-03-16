/**
 * Trello type definitions for Trellio MCP Server
 */

export interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  idList: string;
  due: string | null;
  dueComplete: boolean;
  labels: TrelloLabel[];
  idMembers: string[];
  customFieldItems?: TrelloCustomFieldItem[];
  checklists?: TrelloChecklist[];
  url: string;
  dateLastActivity: string;
}

export interface TrelloLabel {
  id: string;
  name: string;
  color: string;
}

export interface TrelloList {
  id: string;
  name: string;
  cards?: TrelloCard[];
}

export interface TrelloCustomFieldItem {
  id: string;
  idCustomField: string;
  idValue?: string;
  value?: {
    text?: string;
    number?: number;
    date?: string;
    checked?: string;
  };
}

export interface TrelloChecklist {
  id: string;
  name: string;
  checkItems: TrelloCheckItem[];
}

export interface TrelloCheckItem {
  id: string;
  name: string;
  state: 'complete' | 'incomplete';
}

export interface TrelloMember {
  id: string;
  username: string;
  fullName: string;
}

export interface TrelloConfig {
  apiKey: string;
  token: string;
  defaultBoardId?: string;
}
