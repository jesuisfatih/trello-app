/**
 * Shopify GraphQL queries and mutations
 * API Version: 2026-01
 */

export const SHOP_QUERY = `
  query Shop {
    shop {
      id
      name
      email
      myshopifyDomain
      plan {
        displayName
      }
    }
  }
`;

export const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          title
          handle
          status
          totalInventory
          createdAt
        }
      }
    }
  }
`;

export const ORDERS_QUERY = `
  query Orders($first: Int!) {
    orders(first: $first) {
      edges {
        node {
          id
          name
          email
          createdAt
          totalPriceSet {
            shopMoney {
              amount
              currencyCode
            }
          }
          displayFinancialStatus
          displayFulfillmentStatus
        }
      }
    }
  }
`;

export const APP_SUBSCRIPTION_CREATE = `
  mutation AppSubscriptionCreate(
    $name: String!
    $lineItems: [AppSubscriptionLineItemInput!]!
    $returnUrl: URL!
    $test: Boolean
  ) {
    appSubscriptionCreate(
      name: $name
      lineItems: $lineItems
      returnUrl: $returnUrl
      test: $test
    ) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
        status
      }
      confirmationUrl
    }
  }
`;

export const APP_SUBSCRIPTION_CANCEL = `
  mutation AppSubscriptionCancel($id: ID!) {
    appSubscriptionCancel(id: $id) {
      userErrors {
        field
        message
      }
      appSubscription {
        id
        status
      }
    }
  }
`;

export const ACCESS_SCOPES_QUERY = `
  query AccessScopes {
    appInstallation {
      accessScopes {
        handle
        description
      }
    }
  }
`;

export const WEBHOOKS_QUERY = `
  query WebhookSubscriptions($first: Int!) {
    webhookSubscriptions(first: $first) {
      edges {
        node {
          id
          topic
          endpoint {
            __typename
            ... on WebhookHttpEndpoint {
              callbackUrl
            }
          }
        }
      }
    }
  }
`;

