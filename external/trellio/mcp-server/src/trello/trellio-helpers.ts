/**
 * Trellio Board-Specific Logic
 *
 * Board structure constants, energy level mapping, and pipeline rules.
 */

import type { EnergyLevel, PipelineList, TrelloCard, BoardSnapshot, DailyPlanningContext, ServerConfig } from '../types.js';
import type { TrelloClient } from './client.js';

// Energy level to label name mapping
export const ENERGY_LABELS = {
  1: 'Brain Dead',
  2: 'Low Energy',
  3: 'Medium Energy',
  4: 'High Energy',
  5: 'High Energy',
} as const;

// Label name to energy level reverse mapping
export const LABEL_TO_ENERGY: Record<string, EnergyLevel> = {
  'Brain Dead': 1,
  'Low Energy': 2,
  'Medium Energy': 3,
  'High Energy': 4,
};

// Pipeline list names
export const PIPELINE_LISTS = {
  reference: 'Reference',
  this_week: 'This Week',
  today: 'Today',
  doing: 'Doing',
  done: 'Done',
} as const;

/**
 * Get energy level from a card's labels
 */
export function getEnergyLevelFromCard(card: TrelloCard, config: ServerConfig['trello']): EnergyLevel {
  // Check card labels against config energy labels
  for (const label of card.labels) {
    // Match by label ID or name
    if (label.id === config.labels.highEnergy || label.name === 'High Energy') return 4;
    if (label.id === config.labels.mediumEnergy || label.name === 'Medium Energy') return 3;
    if (label.id === config.labels.lowEnergy || label.name === 'Low Energy') return 2;
    if (label.id === config.labels.brainDead || label.name === 'Brain Dead') return 1;
  }

  // Default to medium energy if no label found
  return 3;
}

/**
 * Get full board snapshot with overdue/stale counts and energy distribution
 */
export async function getBoardSnapshot(
  client: TrelloClient,
  config: ServerConfig['trello'],
  includeCards = true
): Promise<BoardSnapshot> {
  const lists = await client.getBoardLists(config.boardId);

  // Count cards and build snapshot
  const listData = lists.map((list) => ({
    name: list.name,
    id: list.id,
    cardCount: list.cards?.length || 0,
    cards: includeCards ? list.cards : undefined,
  }));

  // Count overdue and stale cards
  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  let overdueCounts = 0;
  let staleCounts = 0;

  const allCards = lists.flatMap((l) => l.cards || []);

  for (const card of allCards) {
    if (card.due && new Date(card.due) < now && !card.dueComplete) {
      overdueCounts++;
    }
    if (card.dateLastActivity && new Date(card.dateLastActivity) < twoDaysAgo) {
      staleCounts++;
    }
  }

  // Energy distribution
  const energyDistribution = {
    high: 0,
    medium: 0,
    low: 0,
    brainDead: 0,
  };

  for (const card of allCards) {
    const energyLabel = card.labels.find((l) =>
      [config.labels.highEnergy, config.labels.mediumEnergy, config.labels.lowEnergy, config.labels.brainDead].includes(l.id)
    );

    if (energyLabel?.id === config.labels.highEnergy) energyDistribution.high++;
    else if (energyLabel?.id === config.labels.mediumEnergy) energyDistribution.medium++;
    else if (energyLabel?.id === config.labels.lowEnergy) energyDistribution.low++;
    else if (energyLabel?.id === config.labels.brainDead) energyDistribution.brainDead++;
  }

  return {
    lists: listData,
    overdueCounts,
    staleCounts,
    energyDistribution,
  };
}

/**
 * Get daily planning context: Today + This Week cards with energy filter
 */
export async function getDailyPlanningContext(
  client: TrelloClient,
  config: ServerConfig['trello'],
  energyFilter?: EnergyLevel
): Promise<DailyPlanningContext> {
  const todayCards = await client.listCards(config.lists.today);
  const thisWeekCards = await client.listCards(config.lists.thisWeek);

  // Filter by energy if specified
  const filterByEnergy = (cards: TrelloCard[]) => {
    if (!energyFilter) return cards;

    const targetEnergyLabel = ENERGY_LABELS[energyFilter];
    return cards.filter((card) =>
      card.labels.some((label) => label.name === targetEnergyLabel)
    );
  };

  return {
    todayCards: filterByEnergy(todayCards),
    thisWeekCards: filterByEnergy(thisWeekCards),
    energyFilter,
  };
}

/**
 * Move card through pipeline
 */
export async function moveCardThroughPipeline(
  client: TrelloClient,
  config: ServerConfig['trello'],
  cardId: string,
  targetList: PipelineList
): Promise<{ success: boolean; message: string; warning?: string }> {
  // Map pipeline name to list ID
  const listIdMap: Record<PipelineList, string> = {
    reference: config.lists.reference,
    this_week: config.lists.thisWeek,
    today: config.lists.today,
    doing: config.lists.doing,
    done: config.lists.done,
  };

  const targetListId = listIdMap[targetList];

  // Move the card
  await client.updateCard(cardId, { idList: targetListId, pos: 'top' });

  // Get card for energy mismatch warning
  const card = await client.getCard(cardId);
  let warning: string | undefined;

  if (targetList === 'doing') {
    // Check if card has a high-energy label but user might be low-energy
    const hasHighEnergy = card.labels.some((l) => l.id === config.labels.highEnergy);
    if (hasHighEnergy) {
      warning = 'Card has High Energy label - make sure you have capacity for this task';
    }
  }

  return {
    success: true,
    message: `Card moved to ${PIPELINE_LISTS[targetList]}`,
    warning,
  };
}

/**
 * Quick add task with all Trellio metadata in one call
 */
export async function quickAddTask(
  client: TrelloClient,
  config: ServerConfig['trello'],
  params: {
    title: string;
    list?: PipelineList;
    energy?: EnergyLevel;
    priority?: 'High' | 'Medium' | 'Low';
    timeEstimate?: string;
    taskType?: string;
    dueDate?: string;
    quickWin?: boolean;
    assignee?: string;
  }
): Promise<TrelloCard> {
  // Default to This Week
  const listIdMap: Record<PipelineList, string> = {
    reference: config.lists.reference,
    this_week: config.lists.thisWeek,
    today: config.lists.today,
    doing: config.lists.doing,
    done: config.lists.done,
  };

  const targetListId = listIdMap[params.list || 'this_week'];

  // Map energy to label
  const labelIds: string[] = [];
  if (params.energy) {
    const energyLabelMap: Record<number, string> = {
      1: config.labels.brainDead,
      2: config.labels.lowEnergy,
      3: config.labels.mediumEnergy,
      4: config.labels.highEnergy,
      5: config.labels.highEnergy,
    };
    labelIds.push(energyLabelMap[params.energy]);
  }

  // Create card
  const card = await client.createCard({
    name: params.title,
    idList: targetListId,
    due: params.dueDate,
    idLabels: labelIds,
    idMembers: params.assignee ? [params.assignee] : undefined,
    pos: 'top',
  });

  // Set custom fields (would need custom field IDs from config - simplified for now)
  // In a real implementation, we'd call setCustomField for timeEstimate, taskType, priority, quickWin

  return card;
}

/**
 * Delegate task: create card with handoff checklist
 */
export async function delegateTask(
  client: TrelloClient,
  config: ServerConfig['trello'],
  params: {
    title: string;
    assignee: string;
    description: string;
    priority: 'High' | 'Medium' | 'Low';
    dueDate: string;
  }
): Promise<TrelloCard> {
  // Create card in This Week
  const card = await client.createCard({
    name: params.title,
    idList: config.lists.thisWeek,
    desc: params.description,
    due: params.dueDate,
    idMembers: [params.assignee],
    pos: 'top',
  });

  // Add Delegation Handoff checklist
  const checklist = await client.createChecklist(card.id, 'Delegation Handoff');
  await client.addChecklistItem(checklist.id, 'Context and background provided');
  await client.addChecklistItem(checklist.id, 'Expected outcome clarified');
  await client.addChecklistItem(checklist.id, 'Resources and access granted');
  await client.addChecklistItem(checklist.id, 'Follow-up scheduled');

  return card;
}

/**
 * Clean up board: archive Done, move Doing -> This Week, move Today -> This Week
 */
export async function cleanUpBoard(
  client: TrelloClient,
  config: ServerConfig['trello']
): Promise<{ archived: number; movedToThisWeek: number }> {
  // Get cards from each list
  const doneCards = await client.listCards(config.lists.done);
  const doingCards = await client.listCards(config.lists.doing);
  const todayCards = await client.listCards(config.lists.today);

  // Archive all Done cards
  for (const card of doneCards) {
    await client.archiveCard(card.id);
  }

  // Move Doing and Today cards to This Week
  const cardsToMove = [...doingCards, ...todayCards];
  for (const card of cardsToMove) {
    await client.updateCard(card.id, { idList: config.lists.thisWeek });
  }

  return {
    archived: doneCards.length,
    movedToThisWeek: cardsToMove.length,
  };
}

/**
 * Get energy-matched tasks from This Week/Today
 */
export async function getEnergyMatchedTasks(
  client: TrelloClient,
  config: ServerConfig['trello'],
  energyLevel: EnergyLevel
): Promise<TrelloCard[]> {
  const thisWeekCards = await client.listCards(config.lists.thisWeek);
  const todayCards = await client.listCards(config.lists.today);

  const allCards = [...thisWeekCards, ...todayCards];
  const targetEnergyLabel = ENERGY_LABELS[energyLevel];

  // Filter cards by energy level (match or lower)
  const matchedCards = allCards.filter((card) => {
    const cardEnergyLabel = card.labels.find((l) =>
      Object.values(ENERGY_LABELS).includes(l.name as any)
    );

    if (!cardEnergyLabel) return false;

    const cardEnergy = LABEL_TO_ENERGY[cardEnergyLabel.name] || 5;
    return cardEnergy <= energyLevel;
  });

  // Sort by: Quick Win > lowest energy > shortest time estimate
  matchedCards.sort((a, b) => {
    // Quick Win priority (would check custom field in real implementation)
    // For now, sort by energy level
    const aEnergy = LABEL_TO_ENERGY[a.labels.find((l) => Object.values(ENERGY_LABELS).includes(l.name as any))?.name || 'High Energy'] || 5;
    const bEnergy = LABEL_TO_ENERGY[b.labels.find((l) => Object.values(ENERGY_LABELS).includes(l.name as any))?.name || 'High Energy'] || 5;

    return aEnergy - bEnergy;
  });

  return matchedCards;
}

/**
 * Batch update multiple cards
 */
export async function batchUpdateCards(
  client: TrelloClient,
  updates: Array<{
    cardId: string;
    changes: {
      name?: string;
      desc?: string;
      idList?: string;
      due?: string;
      labelIds?: string[];
    };
  }>
): Promise<{ success: number; failed: number; errors: string[] }> {
  let success = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const update of updates) {
    try {
      await client.updateCard(update.cardId, {
        name: update.changes.name,
        desc: update.changes.desc,
        idList: update.changes.idList,
        due: update.changes.due,
      });

      // Handle labels separately
      if (update.changes.labelIds) {
        const card = await client.getCard(update.cardId);
        // Remove existing labels
        for (const label of card.labels) {
          await client.removeLabel(update.cardId, label.id);
        }
        // Add new labels
        for (const labelId of update.changes.labelIds) {
          await client.addLabel(update.cardId, labelId);
        }
      }

      success++;
    } catch (error) {
      failed++;
      errors.push(`Card ${update.cardId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { success, failed, errors };
}
