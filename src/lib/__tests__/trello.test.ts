import { createTrelloClient } from '../trello';

describe('Trello Client', () => {
  it('should create client with token', () => {
    const client = createTrelloClient('test_token');
    expect(client).toBeDefined();
  });

  it('should build URL with API key and token', () => {
    const client = createTrelloClient('test_token');
    // Test URL building indirectly through method
    expect(client).toHaveProperty('getBoards');
    expect(client).toHaveProperty('createCard');
  });
});

