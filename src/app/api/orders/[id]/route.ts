import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { orders } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_STATUSES = ['pending', 'preparing', 'ready', 'completed', 'cancelled'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        {
          error: 'Valid ID is required',
          code: 'INVALID_ID',
        },
        { status: 400 }
      );
    }

    const orderId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { status } = body;

    // Validate status is provided
    if (!status) {
      return NextResponse.json(
        {
          error: 'Status is required',
          code: 'MISSING_STATUS',
        },
        { status: 400 }
      );
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        {
          error: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
          code: 'INVALID_STATUS',
        },
        { status: 400 }
      );
    }

    // Check if order exists
    const existingOrder = await db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);

    if (existingOrder.length === 0) {
      return NextResponse.json(
        {
          error: 'Order not found',
          code: 'ORDER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update order status
    const updatedOrder = await db
      .update(orders)
      .set({
        status: status,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    if (updatedOrder.length === 0) {
      return NextResponse.json(
        {
          error: 'Failed to update order',
          code: 'UPDATE_FAILED',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(updatedOrder[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error'),
      },
      { status: 500 }
    );
  }
}