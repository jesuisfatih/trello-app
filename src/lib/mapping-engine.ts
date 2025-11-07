import prisma from './db';
import { createTrelloClient } from './trello';

export interface MappingRule {
  id: string;
  enabled: boolean;
  trigger: {
    source: 'shopify';
    event: string; // 'orders/create', 'products/create', etc.
  };
  action: {
    type: 'create_card' | 'update_card' | 'move_card' | 'add_comment';
    boardId?: string;
    listId?: string;
    cardTemplate?: string;
  };
  filters?: {
    field: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }[];
}

/**
 * Process Shopify webhook and execute mappings
 */
export async function processMappings(
  shopId: string,
  webhookTopic: string,
  webhookData: any
) {
  try {
    // Get shop settings with mappings
    const settings = await prisma.settings.findUnique({
      where: { shopId },
      include: {
        shop: true,
      },
    })

    if (!settings) {
      console.log('No settings found for shop')
      return
    }

    const connection = await prisma.trelloConnection.findFirst({
      where: { shopId },
      orderBy: { createdAt: 'asc' },
    })

    if (!connection) {
      console.log('No Trello connection for mapping')
      return
    }

    const mappingOptions = settings.mappingOptions as any
    const trelloToken = connection.token
    const trelloClient = createTrelloClient(trelloToken)

    // Process based on webhook topic
    switch (webhookTopic) {
      case 'orders/create':
        await handleOrderCreated(trelloClient, mappingOptions, webhookData, shopId);
        break;
      
      case 'orders/fulfilled':
        await handleOrderFulfilled(trelloClient, mappingOptions, webhookData, shopId);
        break;
      
      case 'products/create':
        await handleProductCreated(trelloClient, mappingOptions, webhookData, shopId);
        break;
      
      case 'customers/create':
        await handleCustomerCreated(trelloClient, mappingOptions, webhookData, shopId);
        break;
      
      default:
        console.log(`No mapping handler for ${webhookTopic}`);
    }
  } catch (error) {
    console.error('Mapping processing error:', error);
    
    // Log error
    await prisma.eventLog.create({
      data: {
        shopId,
        source: 'system',
        type: 'mapping_error',
        payload: { webhookTopic, error: (error as Error).message },
        status: 'error',
        errorMsg: (error as Error).message,
      },
    });
  }
}

async function handleOrderCreated(client: any, mappings: any, order: any, shopId: string) {
  const orderMapping = mappings?.newOrder;
  
  if (!orderMapping?.enabled || !orderMapping.listId) {
    return;
  }

  try {
    const cardName = `Order #${order.order_number || order.name}`;
    const cardDesc = `
Customer: ${order.customer?.first_name} ${order.customer?.last_name}
Email: ${order.email}
Total: ${order.total_price} ${order.currency}
Items: ${order.line_items?.length || 0}

Created: ${order.created_at}
    `.trim();

    const card = await client.createCard({
      name: cardName,
      idList: orderMapping.listId,
      desc: cardDesc,
      pos: 'top',
    });

    await prisma.eventLog.create({
      data: {
        shopId,
        source: 'system',
        type: 'mapping_executed',
        payload: {
          trigger: 'orders/create',
          action: 'create_card',
          orderId: order.id,
          cardId: card.id,
        },
        status: 'success',
      },
    });

    console.log(`Created card for order #${order.order_number}`);
  } catch (error) {
    console.error('Order mapping error:', error);
    throw error;
  }
}

async function handleOrderFulfilled(client: any, mappings: any, order: any, shopId: string) {
  const fulfillmentMapping = mappings?.orderFulfilled;
  
  if (!fulfillmentMapping?.enabled || !fulfillmentMapping.targetListId) {
    return;
  }

  // This would require storing card ID when order created
  // For now, just log it
  await prisma.eventLog.create({
    data: {
      shopId,
      source: 'system',
      type: 'mapping_executed',
      payload: {
        trigger: 'orders/fulfilled',
        orderId: order.id,
        note: 'Would move card to fulfilled list',
      },
      status: 'success',
    },
  });
}

async function handleProductCreated(client: any, mappings: any, product: any, shopId: string) {
  const productMapping = mappings?.newProduct;
  
  if (!productMapping?.enabled || !productMapping.listId) {
    return;
  }

  try {
    const cardName = product.title;
    const cardDesc = `
${product.body_html || ''}

Price: ${product.variants?.[0]?.price || 'N/A'}
SKU: ${product.variants?.[0]?.sku || 'N/A'}
Inventory: ${product.variants?.[0]?.inventory_quantity || 0}

Created: ${product.created_at}
    `.trim();

    const card = await client.createCard({
      name: cardName,
      idList: productMapping.listId,
      desc: cardDesc,
    });

    await prisma.eventLog.create({
      data: {
        shopId,
        source: 'system',
        type: 'mapping_executed',
        payload: {
          trigger: 'products/create',
          action: 'create_card',
          productId: product.id,
          cardId: card.id,
        },
        status: 'success',
      },
    });

    console.log(`Created card for product: ${product.title}`);
  } catch (error) {
    console.error('Product mapping error:', error);
    throw error;
  }
}

async function handleCustomerCreated(client: any, mappings: any, customer: any, shopId: string) {
  const customerMapping = mappings?.newCustomer;
  
  if (!customerMapping?.enabled || !customerMapping.listId) {
    return;
  }

  try {
    const cardName = `${customer.first_name} ${customer.last_name}`;
    const cardDesc = `
Email: ${customer.email}
Phone: ${customer.phone || 'N/A'}
Orders: ${customer.orders_count || 0}
Total Spent: ${customer.total_spent || '0.00'}

Created: ${customer.created_at}
    `.trim();

    const card = await client.createCard({
      name: cardName,
      idList: customerMapping.listId,
      desc: cardDesc,
    });

    await prisma.eventLog.create({
      data: {
        shopId,
        source: 'system',
        type: 'mapping_executed',
        payload: {
          trigger: 'customers/create',
          action: 'create_card',
          customerId: customer.id,
          cardId: card.id,
        },
        status: 'success',
      },
    });

    console.log(`Created card for customer: ${customer.email}`);
  } catch (error) {
    console.error('Customer mapping error:', error);
    throw error;
  }
}

