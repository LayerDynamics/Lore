/**
 * Tests for Trello Client
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TrelloClient } from '../../src/trello/client.js';
import type { ServerConfig } from '../../src/types.js';

describe('TrelloClient', () => {
  let client: TrelloClient;
  let mockConfig: ServerConfig['trello'];

  beforeEach(() => {
    mockConfig = {
      apiKey: 'test-api-key',
      token: 'test-token',
      boardId: 'test-board-id',
      lists: {
        reference: 'list-1',
        thisWeek: 'list-2',
        today: 'list-3',
        doing: 'list-4',
        done: 'list-5',
      },
      labels: {
        highEnergy: 'label-1',
        mediumEnergy: 'label-2',
        lowEnergy: 'label-3',
        brainDead: 'label-4',
        dueSoon: 'label-5',
      },
    };

    // Mock global fetch
    global.fetch = vi.fn();

    client = new TrelloClient(mockConfig);
  });

  describe('listCards', () => {
    it('should fetch cards from a list', async () => {
      const mockCards = [
        { id: 'card-1', name: 'Test Card 1' },
        { id: 'card-2', name: 'Test Card 2' },
      ];

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCards,
      });

      const result = await client.listCards('list-1');

      expect(result).toEqual(mockCards);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/lists/list-1/cards'),
        expect.any(Object)
      );
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 404,
        text: async () => 'Not found',
      });

      await expect(client.listCards('invalid-list')).rejects.toThrow('Trello API error (404): Not found');
    });
  });

  describe('createCard', () => {
    it('should create a card with required fields', async () => {
      const mockCard = {
        id: 'new-card-id',
        name: 'New Task',
        url: 'https://trello.com/c/new-card-id',
      };

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => mockCard,
      });

      const result = await client.createCard({
        name: 'New Task',
        idList: 'list-1',
      });

      expect(result).toEqual(mockCard);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/cards'),
        expect.objectContaining({
          method: 'POST',
        })
      );
    });
  });

  describe('rate limiting', () => {
    it('should enforce rate limiting between requests', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'test' }),
      });

      const startTime = Date.now();

      // Make two requests
      await client.getCard('card-1');
      await client.getCard('card-2');

      const endTime = Date.now();
      const elapsed = endTime - startTime;

      // Should take at least 100ms (rate limit) between requests
      expect(elapsed).toBeGreaterThanOrEqual(100);
    });
  });
});
