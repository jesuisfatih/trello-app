# API Documentation

## Authentication

All API endpoints (except webhooks and OAuth callbacks) require authentication via Shopify session token.

### Headers

```
Authorization: Bearer <session-token>
```

Get session token from App Bridge:

```javascript
const token = await window.shopify.idToken();
```

## Shopify Endpoints

### POST /api/shopify/token

Exchange session token for Shopify Admin API access token.

**Request:**
```json
{
  "requestedTokenType": "online" // or "offline"
}
```

**Response:**
```json
{
  "accessToken": "shpat_xxx",
  "shop": "example.myshopify.com",
  "expiresIn": 60
}
```

### POST /api/shopify/webhooks/[...topic]

Receive Shopify webhooks (APP_UNINSTALLED, GDPR topics).

**Headers:**
- `X-Shopify-Hmac-SHA256`: HMAC signature
- `X-Shopify-Shop-Domain`: Shop domain

**Topics:**
- `app/uninstalled`
- `customers/data_request`
- `customers/redact`
- `shop/redact`

## Trello OAuth

### GET /api/trello/oauth/start

Initiate Trello OAuth flow.

**Response:**
```json
{
  "authorizeUrl": "https://trello.com/1/OAuthAuthorizeToken?..."
}
```

### GET /api/trello/oauth/callback

OAuth callback endpoint (automatic redirect).

**Query Parameters:**
- `oauth_token`: Request token
- `oauth_verifier`: Verification code
- `state`: State parameter with token secret

## Trello Boards

### GET /api/trello/boards

List all boards for connected Trello account.

**Response:**
```json
{
  "boards": [
    {
      "id": "board123",
      "name": "My Board",
      "desc": "Board description",
      "url": "https://trello.com/b/...",
      "closed": false
    }
  ]
}
```

### POST /api/trello/boards

Create a new board.

**Request:**
```json
{
  "name": "New Board",
  "desc": "Optional description",
  "defaultLists": "true"
}
```

**Response:**
```json
{
  "board": {
    "id": "board123",
    "name": "New Board",
    ...
  }
}
```

### GET /api/trello/boards/:boardId

Get board details.

**Response:**
```json
{
  "board": {
    "id": "board123",
    "name": "My Board",
    ...
  }
}
```

### PUT /api/trello/boards/:boardId

Update board.

**Request:**
```json
{
  "name": "Updated Name",
  "desc": "Updated description",
  "closed": false
}
```

### DELETE /api/trello/boards/:boardId

Delete (close) board.

**Response:**
```json
{
  "success": true
}
```

## Trello Lists

### GET /api/trello/lists?boardId=:boardId

List all lists on a board.

**Query Parameters:**
- `boardId` (required): Board ID

**Response:**
```json
{
  "lists": [
    {
      "id": "list123",
      "name": "To Do",
      "idBoard": "board123",
      "closed": false,
      "pos": 16384
    }
  ]
}
```

### POST /api/trello/lists

Create a new list.

**Request:**
```json
{
  "name": "Done",
  "idBoard": "board123",
  "pos": "bottom"
}
```

## Trello Cards

### GET /api/trello/cards?listId=:listId

List all cards in a list.

**Query Parameters:**
- `listId` (required): List ID

**Response:**
```json
{
  "cards": [
    {
      "id": "card123",
      "name": "Task 1",
      "desc": "Description",
      "idList": "list123",
      "due": "2024-12-31T23:59:59.999Z",
      "closed": false
    }
  ]
}
```

### POST /api/trello/cards

Create a new card.

**Request:**
```json
{
  "name": "New Task",
  "idList": "list123",
  "desc": "Optional description",
  "due": "2024-12-31",
  "pos": "top",
  "idMembers": ["member123"],
  "idLabels": ["label123"]
}
```

**Response:**
```json
{
  "card": {
    "id": "card123",
    "name": "New Task",
    ...
  }
}
```

### GET /api/trello/cards/:cardId

Get card details.

**Response:**
```json
{
  "card": {
    "id": "card123",
    "name": "Task 1",
    "desc": "Full description",
    ...
  }
}
```

### PUT /api/trello/cards/:cardId

Update card.

**Request:**
```json
{
  "name": "Updated Task",
  "desc": "Updated description",
  "idList": "list456",
  "due": "2024-12-31",
  "closed": false
}
```

### DELETE /api/trello/cards/:cardId

Delete card.

**Response:**
```json
{
  "success": true
}
```

## Trello Comments

### GET /api/trello/cards/:cardId/comments

Get all comments on a card.

**Response:**
```json
{
  "comments": [
    {
      "id": "action123",
      "type": "commentCard",
      "date": "2024-11-06T12:00:00.000Z",
      "data": {
        "text": "This is a comment"
      },
      "memberCreator": {
        "id": "member123",
        "fullName": "John Doe"
      }
    }
  ]
}
```

### POST /api/trello/cards/:cardId/comments

Add a comment to a card.

**Request:**
```json
{
  "text": "This is a new comment"
}
```

**Response:**
```json
{
  "comment": {
    "id": "action123",
    "data": {
      "text": "This is a new comment"
    },
    ...
  }
}
```

### PUT /api/trello/cards/:cardId/comments/:commentId

Update a comment.

**Request:**
```json
{
  "text": "Updated comment text"
}
```

### DELETE /api/trello/cards/:cardId/comments/:commentId

Delete a comment.

**Response:**
```json
{
  "success": true
}
```

## Trello Webhooks

### HEAD /api/trello/webhooks

Trello webhook verification endpoint.

**Response:** 200 OK

### POST /api/trello/webhooks

Receive Trello webhook events.

**Request:**
```json
{
  "action": {
    "type": "updateCard",
    "data": { ... },
    "date": "2024-11-06T12:00:00.000Z"
  },
  "model": {
    "id": "board123",
    "name": "My Board"
  }
}
```

**Response:**
```json
{
  "received": true
}
```

### PUT /api/trello/webhooks

Create a new webhook.

**Request:**
```json
{
  "description": "Board webhook",
  "idModel": "board123"
}
```

**Response:**
```json
{
  "webhook": {
    "id": "webhook123",
    "description": "Board webhook",
    "idModel": "board123",
    "callbackURL": "https://your-app.com/api/trello/webhooks",
    "active": true
  }
}
```

## GraphQL Proxy

### POST /api/graphql

Proxy GraphQL queries to Shopify Admin API.

**Request:**
```json
{
  "query": "query { shop { name } }",
  "variables": {}
}
```

**Response:**
```json
{
  "data": {
    "shop": {
      "name": "My Shop"
    }
  }
}
```

## Health Check

### GET /api/health

Health check endpoint for monitoring.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-11-06T12:00:00.000Z"
}
```

## Error Responses

All endpoints return errors in this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes

- `AUTH_ERROR` (401) - Authentication failed
- `VALIDATION_ERROR` (400) - Invalid request data
- `RATE_LIMIT_ERROR` (429) - Rate limit exceeded
- `SHOPIFY_ERROR` (500) - Shopify API error
- `TRELLO_ERROR` (500) - Trello API error
- `INTERNAL_ERROR` (500) - Server error

## Rate Limits

### Trello
- 300 requests per 10 seconds per API key
- 100 requests per 10 seconds per token

Rate limit errors include `retryAfter` field (seconds).

### Shopify
- Follows Shopify's GraphQL API rate limits
- Token exchange requests are limited by Shopify

## Webhooks

### Shopify Webhook Verification

```javascript
const hmac = request.headers['x-shopify-hmac-sha256'];
const body = await request.text();
const hash = crypto
  .createHmac('sha256', SHOPIFY_API_SECRET)
  .update(body, 'utf8')
  .digest('base64');
const valid = crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(hmac));
```

### Trello Webhook Verification

Trello webhooks require:
1. HEAD request returns 200 OK
2. Valid HTTPS certificate
3. Response within 5 seconds

## Example Usage

### Authenticated Fetch (Client-side)

```javascript
import { authenticatedFetch } from '@/lib/app-bridge';

const response = await authenticatedFetch('/api/trello/boards');
const data = await response.json();
```

### Creating a Card

```javascript
const response = await authenticatedFetch('/api/trello/cards', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'New Task',
    idList: 'list123',
    desc: 'Task description'
  })
});
const { card } = await response.json();
```

### Adding a Comment

```javascript
const response = await authenticatedFetch(`/api/trello/cards/${cardId}/comments`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    text: 'Great work!'
  })
});
const { comment } = await response.json();
```

