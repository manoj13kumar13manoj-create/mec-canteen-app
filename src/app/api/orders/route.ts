import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, menuItems } from '@/db/schema';
import { eq, inArray, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userIdParam = searchParams.get('userId');

    if (!userIdParam || isNaN(parseInt(userIdParam))) {
      return NextResponse.json({
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    const userId = parseInt(userIdParam);

    // Fetch all orders for the user
    const userOrders = await db.select()
      .from(orders)
      .where(eq(orders.userId, userId))
      .orderBy(desc(orders.createdAt));

    if (userOrders.length === 0) {
      return NextResponse.json([]);
    }

    // Get order IDs
    const orderIds = userOrders.map(order => order.id);

    // Fetch all order items for these orders
    const allOrderItems = await db.select()
      .from(orderItems)
      .where(inArray(orderItems.orderId, orderIds));

    // Get unique menu item IDs
    const menuItemIds = [...new Set(allOrderItems.map(item => item.menuItemId))];

    // Fetch menu item details
    const menuItemsData = await db.select()
      .from(menuItems)
      .where(inArray(menuItems.id, menuItemIds));

    // Create a map of menu items for quick lookup
    const menuItemsMap = new Map(
      menuItemsData.map(item => [item.id, item])
    );

    // Structure the response with orders and their items
    const ordersWithItems = userOrders.map(order => {
      const items = allOrderItems
        .filter(item => item.orderId === order.id)
        .map(item => {
          const menuItem = menuItemsMap.get(item.menuItemId);
          return {
            id: item.id,
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            price: item.price,
            menuItem: menuItem ? {
              id: menuItem.id,
              name: menuItem.name,
              price: menuItem.price,
              imageUrl: menuItem.imageUrl
            } : null
          };
        });

      return {
        id: order.id,
        userId: order.userId,
        totalAmount: order.totalAmount,
        status: order.status,
        pickupLocation: order.pickupLocation,
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        items
      };
    });

    return NextResponse.json(ordersWithItems);

  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, pickupLocation, items } = body;

    // Validate required fields
    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({
        error: 'Valid userId is required',
        code: 'INVALID_USER_ID'
      }, { status: 400 });
    }

    if (!pickupLocation || typeof pickupLocation !== 'string' || pickupLocation.trim() === '') {
      return NextResponse.json({
        error: 'pickupLocation is required',
        code: 'MISSING_PICKUP_LOCATION'
      }, { status: 400 });
    }

    // Validate pickupLocation value
    const validLocations = ['Main Canteen', 'Library Cafe', 'Hostel Canteen'];
    if (!validLocations.includes(pickupLocation)) {
      return NextResponse.json({
        error: 'pickupLocation must be one of: Main Canteen, Library Cafe, Hostel Canteen',
        code: 'INVALID_PICKUP_LOCATION'
      }, { status: 400 });
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({
        error: 'items array is required and must not be empty',
        code: 'EMPTY_CART'
      }, { status: 400 });
    }

    // Validate items structure
    for (const item of items) {
      if (!item.menuItemId || isNaN(parseInt(item.menuItemId))) {
        return NextResponse.json({
          error: 'Each item must have a valid menuItemId',
          code: 'INVALID_MENU_ITEM_ID'
        }, { status: 400 });
      }
      if (!item.quantity || isNaN(parseInt(item.quantity)) || parseInt(item.quantity) <= 0) {
        return NextResponse.json({
          error: 'Each item must have a valid quantity greater than 0',
          code: 'INVALID_QUANTITY'
        }, { status: 400 });
      }
    }

    // Fetch menu items to get prices and validate they exist
    const menuItemIds = items.map(item => parseInt(item.menuItemId));
    const menuItemsData = await db.select()
      .from(menuItems)
      .where(inArray(menuItems.id, menuItemIds));

    if (menuItemsData.length !== menuItemIds.length) {
      return NextResponse.json({
        error: 'One or more menu items not found',
        code: 'MENU_ITEMS_NOT_FOUND'
      }, { status: 404 });
    }

    // Create a map of menu items for price lookup
    const menuItemsMap = new Map(
      menuItemsData.map(item => [item.id, item])
    );

    // Calculate total amount
    let totalAmount = 0;
    const orderItemsData = items.map(item => {
      const menuItem = menuItemsMap.get(parseInt(item.menuItemId));
      if (!menuItem) {
        throw new Error('Menu item not found');
      }
      const itemTotal = menuItem.price * parseInt(item.quantity);
      totalAmount += itemTotal;
      return {
        menuItemId: parseInt(item.menuItemId),
        quantity: parseInt(item.quantity),
        price: menuItem.price
      };
    });

    // Create order
    const currentTimestamp = new Date().toISOString();
    const newOrder = await db.insert(orders)
      .values({
        userId: parseInt(userId),
        totalAmount,
        status: 'pending',
        pickupLocation: pickupLocation.trim(),
        createdAt: currentTimestamp,
        updatedAt: currentTimestamp
      })
      .returning();

    if (newOrder.length === 0) {
      return NextResponse.json({
        error: 'Failed to create order',
        code: 'ORDER_CREATION_FAILED'
      }, { status: 500 });
    }

    const createdOrder = newOrder[0];

    // Create order items
    const orderItemsToInsert = orderItemsData.map(item => ({
      orderId: createdOrder.id,
      menuItemId: item.menuItemId,
      quantity: item.quantity,
      price: item.price,
      createdAt: currentTimestamp
    }));

    const createdOrderItems = await db.insert(orderItems)
      .values(orderItemsToInsert)
      .returning();

    // Fetch menu item details for response
    const responseItems = createdOrderItems.map(item => {
      const menuItem = menuItemsMap.get(item.menuItemId);
      return {
        id: item.id,
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        price: item.price,
        menuItem: menuItem ? {
          id: menuItem.id,
          name: menuItem.name,
          price: menuItem.price,
          imageUrl: menuItem.imageUrl
        } : null
      };
    });

    // Return complete order with items
    const response = {
      id: createdOrder.id,
      userId: createdOrder.userId,
      totalAmount: createdOrder.totalAmount,
      status: createdOrder.status,
      pickupLocation: createdOrder.pickupLocation,
      createdAt: createdOrder.createdAt,
      updatedAt: createdOrder.updatedAt,
      items: responseItems
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({
      error: 'Internal server error: ' + (error as Error).message
    }, { status: 500 });
  }
}