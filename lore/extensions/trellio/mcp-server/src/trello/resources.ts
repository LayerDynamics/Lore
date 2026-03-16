/**
 * Trello MCP Resources
 *
 * Read-only context resources. All take boardId as a parameter
 * (resolved from default config by the registry).
 */

import type { TrelloClient } from './client.js';
import type { TrelloCard } from '../types.js';

export async function getBoardSnapshotResource(client: TrelloClient, boardId: string) {
  const lists = await client.getBoardLists(boardId);

  const now = new Date();
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const allCards = lists.flatMap(l => l.cards || []);

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
${lists.map(l => `- ${l.name}: ${l.cards?.length || 0} cards`).join('\n')}

## Issues
- Overdue cards: ${overdueCount}
- Stale cards (48+ hrs): ${staleCount}
- Total cards: ${allCards.length}
`;
}

export async function getOverdueCardsResource(client: TrelloClient, boardId: string) {
  const lists = await client.getBoardLists(boardId);
  const allCards = lists.flatMap(l => l.cards || []);

  const now = new Date();
  const overdueCards = allCards.filter(card =>
    card.due && new Date(card.due) < now && !card.dueComplete
  );

  overdueCards.sort((a, b) =>
    new Date(a.due!).getTime() - new Date(b.due!).getTime()
  );

  return `# Overdue Cards (${overdueCards.length})

${overdueCards.map(card => {
  const dueDate = new Date(card.due!);
  const daysOverdue = Math.floor((now.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
  return `- **${card.name}** (${daysOverdue} days overdue)\n  Due: ${dueDate.toLocaleDateString()}\n  ${card.url}`;
}).join('\n\n')}
`;
}

export async function getStaleCardsResource(client: TrelloClient, boardId: string) {
  const lists = await client.getBoardLists(boardId);
  const allCards = lists.flatMap(l => l.cards || []);

  const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);
  const staleCards = allCards.filter(card =>
    card.dateLastActivity && new Date(card.dateLastActivity) < twoDaysAgo
  );

  staleCards.sort((a, b) =>
    new Date(a.dateLastActivity).getTime() - new Date(b.dateLastActivity).getTime()
  );

  return `# Stale Cards (${staleCards.length})
Cards with no activity in 48+ hours

${staleCards.map(card => {
  const lastActivity = new Date(card.dateLastActivity);
  const daysStale = Math.floor((Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
  return `- **${card.name}** (${daysStale} days since activity)\n  Last: ${lastActivity.toLocaleDateString()}\n  ${card.url}`;
}).join('\n\n')}
`;
}

export async function getTeamStatusResource(client: TrelloClient, boardId: string) {
  const lists = await client.getBoardLists(boardId);
  const allCards = lists.flatMap(l => l.cards || []);
  const members = await client.getBoardMembers(boardId);

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

  return `# Team Card Status

${Array.from(memberStatus.values()).map(status => `
## ${status.name} (${status.cards.length} cards)
${status.cards.map(card => `- ${card.name}`).join('\n')}
`).join('\n')}
`;
}
