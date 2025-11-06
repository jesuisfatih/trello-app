import OAuth from 'oauth-1.0a';
import crypto from 'crypto';

const TRELLO_API_BASE = 'https://api.trello.com';

export interface TrelloConfig {
  apiKey: string;
  apiSecret: string;
  token?: string;
}

export class TrelloClient {
  private oauth: OAuth;
  private config: TrelloConfig;

  constructor(config: TrelloConfig) {
    this.config = config;
    this.oauth = new OAuth({
      consumer: {
        key: config.apiKey,
        secret: config.apiSecret,
      },
      signature_method: 'HMAC-SHA1',
      hash_function(baseString, key) {
        return crypto.createHmac('sha1', key).update(baseString).digest('base64');
      },
    });
  }

  private buildUrl(path: string, params: Record<string, string> = {}): string {
    const url = new URL(`${TRELLO_API_BASE}${path}`);
    url.searchParams.append('key', this.config.apiKey);
    if (this.config.token) {
      url.searchParams.append('token', this.config.token);
    }
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
    return url.toString();
  }

  async request(
    method: string,
    path: string,
    data?: any,
    queryParams: Record<string, string> = {}
  ): Promise<any> {
    const url = this.buildUrl(path, queryParams);
    
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    const response = await fetch(url, options);

    if (response.status === 429) {
      const retryAfter = response.headers.get('Retry-After');
      throw new Error(`Rate limit exceeded. Retry after: ${retryAfter || 'unknown'}`);
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Trello API error: ${response.status} - ${error}`);
    }

    if (response.status === 204) {
      return null;
    }

    return response.json();
  }

  // Boards
  async getBoards(memberId: string = 'me') {
    return this.request('GET', `/1/members/${memberId}/boards`);
  }

  async getBoard(boardId: string) {
    return this.request('GET', `/1/boards/${boardId}`);
  }

  async createBoard(name: string, params: Record<string, string> = {}) {
    return this.request('POST', '/1/boards', null, { name, ...params });
  }

  async updateBoard(boardId: string, updates: Record<string, string>) {
    return this.request('PUT', `/1/boards/${boardId}`, null, updates);
  }

  async deleteBoard(boardId: string) {
    return this.request('DELETE', `/1/boards/${boardId}`);
  }

  // Lists
  async getLists(boardId: string) {
    return this.request('GET', `/1/boards/${boardId}/lists`);
  }

  async getList(listId: string) {
    return this.request('GET', `/1/lists/${listId}`);
  }

  async createList(name: string, boardId: string, pos: string = 'bottom') {
    return this.request('POST', '/1/lists', null, { name, idBoard: boardId, pos });
  }

  async updateList(listId: string, updates: Record<string, string>) {
    return this.request('PUT', `/1/lists/${listId}`, null, updates);
  }

  async archiveList(listId: string) {
    return this.request('PUT', `/1/lists/${listId}/closed`, null, { value: 'true' });
  }

  // Cards
  async getCards(listId: string) {
    return this.request('GET', `/1/lists/${listId}/cards`);
  }

  async getCard(cardId: string) {
    return this.request('GET', `/1/cards/${cardId}`);
  }

  async createCard(params: {
    name: string;
    idList: string;
    desc?: string;
    pos?: string;
    due?: string;
    idMembers?: string[];
    idLabels?: string[];
  }) {
    return this.request('POST', '/1/cards', null, params as any);
  }

  async updateCard(cardId: string, updates: Record<string, string>) {
    return this.request('PUT', `/1/cards/${cardId}`, null, updates);
  }

  async deleteCard(cardId: string) {
    return this.request('DELETE', `/1/cards/${cardId}`);
  }

  async moveCard(cardId: string, listId: string, pos: string = 'bottom') {
    return this.request('PUT', `/1/cards/${cardId}`, null, { idList: listId, pos });
  }

  // Comments (Actions)
  async getComments(cardId: string) {
    return this.request('GET', `/1/cards/${cardId}/actions`, {}, { filter: 'commentCard' });
  }

  async addComment(cardId: string, text: string) {
    return this.request('POST', `/1/cards/${cardId}/actions/comments`, null, { text });
  }

  async updateComment(cardId: string, commentId: string, text: string) {
    return this.request('PUT', `/1/cards/${cardId}/actions/${commentId}/comments`, null, { text });
  }

  async deleteComment(cardId: string, commentId: string) {
    return this.request('DELETE', `/1/cards/${cardId}/actions/${commentId}/comments`);
  }

  // Members
  async getCardMembers(cardId: string) {
    return this.request('GET', `/1/cards/${cardId}/members`);
  }

  async addMemberToCard(cardId: string, memberId: string) {
    return this.request('POST', `/1/cards/${cardId}/idMembers`, null, { value: memberId });
  }

  async removeMemberFromCard(cardId: string, memberId: string) {
    return this.request('DELETE', `/1/cards/${cardId}/idMembers/${memberId}`);
  }

  // Labels
  async getLabels(boardId: string) {
    return this.request('GET', `/1/boards/${boardId}/labels`);
  }

  async addLabelToCard(cardId: string, labelId: string) {
    return this.request('POST', `/1/cards/${cardId}/idLabels`, null, { value: labelId });
  }

  async removeLabelFromCard(cardId: string, labelId: string) {
    return this.request('DELETE', `/1/cards/${cardId}/idLabels/${labelId}`);
  }

  // Webhooks
  async createWebhook(params: {
    description: string;
    callbackURL: string;
    idModel: string;
  }) {
    return this.request('POST', '/1/webhooks', null, params as any);
  }

  async getWebhook(webhookId: string) {
    return this.request('GET', `/1/webhooks/${webhookId}`);
  }

  async updateWebhook(webhookId: string, updates: Record<string, string>) {
    return this.request('PUT', `/1/webhooks/${webhookId}`, null, updates);
  }

  async deleteWebhook(webhookId: string) {
    return this.request('DELETE', `/1/webhooks/${webhookId}`);
  }

  // OAuth helpers
  static getRequestTokenUrl(apiKey: string): string {
    return `${TRELLO_API_BASE}/1/OAuthGetRequestToken`;
  }

  static getAuthorizeUrl(token: string, options: {
    name: string;
    scope: string;
    expiration: string;
    callbackUrl: string;
  }): string {
    const params = new URLSearchParams({
      oauth_token: token,
      name: options.name,
      scope: options.scope,
      expiration: options.expiration,
      return_url: options.callbackUrl,
    });
    return `https://trello.com/1/OAuthAuthorizeToken?${params.toString()}`;
  }

  static getAccessTokenUrl(apiKey: string): string {
    return `${TRELLO_API_BASE}/1/OAuthGetAccessToken`;
  }
}

export function createTrelloClient(token?: string): TrelloClient {
  return new TrelloClient({
    apiKey: process.env.TRELLO_API_KEY || '',
    apiSecret: process.env.TRELLO_API_SECRET || '',
    token,
  });
}

