import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders, orderItems, menuItems, users } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '50'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Build base query with status filter if provided
    let query = db.select({
      id: orders.id,
      userId: orders.userId,
      totalAmount: orders.totalAmount,
      status: orders.status,
      pickupLocation: orders.pickupLocation,
      createdAt: orders.createdAt,
      updatedAt: orders.updatedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
      },
    })
    .from(orders)
    .leftJoin(users, eq(orders.userId, users.id))
    .orderBy(desc(orders.createdAt))
    .limit(limit)
    .offset(offset);

    // Apply status filter if provided
    if (status) {
      query = query.where(eq(orders.status, status));
    }

    const ordersResult = await query;

    // Get order items with menu items for each order
    const ordersWithItems = await Promise.all(
      ordersResult.map(async (order) => {
        const items = await db.select({
          id: orderItems.id,
          menuItemId: orderItems.menuItemId,
          quantity: orderItems.quantity,
          price: orderItems.price,
          menuItem: {
            id: menuItems.id,
            name: menuItems.name,
            imageUrl: menuItems.imageUrl,
          },
        })
        .from(orderItems)
        .leftJoin(menuItems, eq(orderItems.menuItemId, menuItems.id))
        .where(eq(orderItems.orderId, order.id));

        return {
          id: order.id,
          userId: order.userId,
          totalAmount: order.totalAmount,
          status: order.status,
          pickupLocation: order.pickupLocation,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          user: order.user,
          items: items,
        };
      })
    );

    return NextResponse.json(ordersWithItems, { status: 200 });
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
        code: 'INTERNAL_ERROR'
      },
      { status: 500 }
    );
  }
}