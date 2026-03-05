/**
 * Trello MCP Resources
 *
 * Read-only context resources for board state, overdue cards, stale cards,
 * team status, energy distribution, and configuration.
 */

import type { TrelloClient } from './client.js';
import type { ServerConfig, TrelloCard } from '../types.js';
import { getBoardSnapshot } from './trellio-helpers.js';

/**
 * Get board snapshot resource
 */
export async function getBoardSnapshotResource(client: TrelloClient, config: ServerConfig['trello']) {
  const snapshot = await getBoardSnapshot(client, config, false);

  const text = `# Trellio Board Snapshot

## Lists
${snapshot.lists.map(l => `- ${l.name}: ${l.cardCount} cards`).join('\n')}

## WIP Status
- Doing: ${snapshot.wipStatus.doing.current}/${snapshot.wipStatus.doing.limit} ${snapshot.wipStatus.doing.exceeded ? '⚠️ EXCEEDED' : '✓'}
- Today: ${snapshot.wipStatus.today.current}/${snapshot.wipStatus.today.limit} ${snapshot.wipStatus.today.exceeded ? '⚠️ EXCEEDED' : '✓'}

## Issues
- Overdue cards: ${snapshot.overdueCounts}
- Stale cards (48+ hrs): ${snapshot.staleCounts}

## Energy Distribution
- High Energy: ${snapshot.energyDistribution.high}
- Medium Energy: ${snapshot.energyDistribution.medium}
- Low Energy: ${snapshot.energyDistribution.low}
- Brain Dead: ${snapshot.energyDistribution.brainDead}
`;

  return text;
}

/**
 * Get overdue cards resource
 */
export async function getOverdueCardsResource(client: TrelloClient, config: ServerConfig['trello']) {
  const lists = await client.getBoardLists(config.boardId);
  const allCards = lists.flatMap(l => l.cards || []);

  const now = new Date();
  const overdueCards = allCards.filter(card =>
    card.due && new Date(card.due) < now && !card.dueComplete
  );

  overdueCards.sort((a, b) => {
    const aDue = new Date(a.due!);
    const bDue = new Date(b.due!);
    return aDue.getTime() - bDue.getTime();
  });

  const text = `# Overdue Cards (${overdueCards.length})

${overdueCards.map(card => {
  const dueDate = new Date(card.due!);
  const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return `- **${card.name}** (${daysOverdue} days overdue)\n  Due: ${dueDate.toLocaleDateString()}\n  ${card.url}`;
}).join('\n\n')}
`;

  return text;
}

/**
 * Get stale cards resource
 */
export async function getStaleCardsResource(client: TrelloClient, config: ServerConfig['trello']) {
  const lists = await client.getBoardLists(config.boardId);
  const allCards = lists.flatMap(l => l.cards || []);

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const staleCards = allCards.filter(card =>
    card.dateLastActivity && new Date(card.dateLastActivity) < twoDaysAgo
  );

  staleCards.sort((a, b) => {
    const aDate = new Date(a.dateLastActivity);
    const bDate = new Date(b.dateLastActivity);
    return aDate.getTime() - bDate.getTime();
  });

  const text = `# Stale Cards (${staleCards.length})
Cards with no activity in 48+ hours

${staleCards.map(card => {
  const lastActivity = new Date(card.dateLastActivity);
  const daysStale = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  return `- **${card.name}** (${daysStale} days since activity)\n  Last: ${lastActivity.toLocaleDateString()}\n  ${card.url}`;
}).join('\n\n')}
`;

  return text;
}

/**
 * Get team status resource
 */
export async function getTeamStatusResource(client: TrelloClient, config: ServerConfig['trello']) {
  const lists = await client.getBoardLists(config.boardId);
  const allCards = lists.flatMap(l => l.cards || []);
  const members = await client.getBoardMembers(config.boardId);

  const memberStatus = new Map<string, { name: string; cards: TrelloCard[] }>();

  for (const member of members) {
    memberStatus.set(member.id, {
      name: member.fullName || member.username,
      cards: [],
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

  const text = `# Team Card Status

${Array.from(memberStatus.values()).map(status => `
## ${status.name} (${status.cards.length} cards)
${status.cards.map(card => `- ${card.name}`).join('\n')}
`).join('\n')}
`;

  return text;
}

/**
 * Get energy distribution resource
 */
export async function getEnergyDistributionResource(client: TrelloClient, config: ServerConfig['trello']) {
  const snapshot = await getBoardSnapshot(client, config, false);

  const text = `# Energy Distribution by List

Total cards by energy level:
- High Energy: ${snapshot.energyDistribution.high}
- Medium Energy: ${snapshot.energyDistribution.medium}
- Low Energy: ${snapshot.energyDistribution.low}
- Brain Dead: ${snapshot.energyDistribution.brainDead}

WIP Status:
- Doing: ${snapshot.wipStatus.doing.current}/${snapshot.wipStatus.doing.limit}
- Today: ${snapshot.wipStatus.today.current}/${snapshot.wipStatus.today.limit}
`;

  return text;
}

/**
 * Get board config resource
 */
export async function getBoardConfigResource(config: ServerConfig['trello']) {
  const text = `# Trellio Board Configuration

## Lists
- Reference: ${config.lists.reference}
- This Week: ${config.lists.thisWeek}
- Today: ${config.lists.today}
- Doing: ${config.lists.doing}
- Done: ${config.lists.done}

## Labels
- High Energy: ${config.labels.highEnergy}
- Medium Energy: ${config.labels.mediumEnergy}
- Low Energy: ${config.labels.lowEnergy}
- Brain Dead: ${config.labels.brainDead}
- Due Soon: ${config.labels.dueSoon}

## Board ID
${config.boardId}
`;

  return text;
}
