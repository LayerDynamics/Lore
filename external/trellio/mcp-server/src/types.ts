/**
 * Shared TypeScript types for Trellio MCP Server
 */

// Trello Types
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

// Trellio-Specific Types
export type EnergyLevel = 1 | 2 | 3 | 4 | 5;
export type PipelineList = 'reference' | 'this_week' | 'today' | 'doing' | 'done';

export interface BoardSnapshot {
  lists: {
    name: string;
    id: string;
    cardCount: number;
    cards?: TrelloCard[];
  }[];
  overdueCounts: number;
  staleCounts: number;
  energyDistribution: {
    high: number;
    medium: number;
    low: number;
    brainDead: number;
  };
}

export interface DailyPlanningContext {
  todayCards: TrelloCard[];
  thisWeekCards: TrelloCard[];
  energyFilter?: EnergyLevel;
  capacity?: number;
}

// Coach Types
export interface CrashState {
  tier: 0 | 1 | 2 | 3 | 4;
  daysSinceLastActivity: number;
  lastActivityDate: string | null;
  suggestedAction: string;
}

export interface DayCapacity {
  energyLevel: EnergyLevel;
  availableHours: number;
  meetingHours: number;
  productiveHours: number;
  suggestedTaskCount: number;
}

export interface WeeklyStats {
  completionRate: number;
  averageTimeInDoing: number;
  energyPattern: {
    high: number;
    medium: number;
    low: number;
    brainDead: number;
  };
  delegationRatio: number;
}

// Configuration Types
export interface ServerConfig {
  trello: {
    apiKey: string;
    token: string;
    boardId: string;
    lists: {
      reference: string;
      thisWeek: string;
      today: string;
      doing: string;
      done: string;
    };
    labels: {
      highEnergy: string;
      mediumEnergy: string;
      lowEnergy: string;
      brainDead: string;
      dueSoon: string;
    };
  };
  project: {
    dir: string;
  };
}
