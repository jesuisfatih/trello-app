/**
 * Shared TypeScript types
 */

export interface Shop {
  id: string;
  domain: string;
  accessTokenOffline?: string;
  installedAt: Date;
  plan?: string;
  status: string;
}

export interface TrelloConnection {
  id: string;
  shopId: string;
  trelloMemberId: string;
  token: string;
  scope: string;
  expiresAt?: Date;
}

export interface TrelloBoard {
  id: string;
  name: string;
  desc?: string;
  closed: boolean;
  url: string;
}

export interface TrelloList {
  id: string;
  name: string;
  idBoard: string;
  closed: boolean;
  pos: number;
}

export interface TrelloCard {
  id: string;
  name: string;
  desc?: string;
  idList: string;
  idBoard: string;
  closed: boolean;
  due?: string;
  dueComplete?: boolean;
  idMembers?: string[];
  idLabels?: string[];
  url: string;
}

export interface TrelloComment {
  id: string;
  type: string;
  date: string;
  data: {
    text: string;
    card?: {
      id: string;
      name: string;
    };
  };
  memberCreator: {
    id: string;
    fullName: string;
    username: string;
  };
}

export interface EventLog {
  id: string;
  shopId?: string;
  source: 'shopify' | 'trello' | 'system';
  type: string;
  payload: any;
  status: 'success' | 'error' | 'pending';
  errorMsg?: string;
  createdAt: Date;
}

