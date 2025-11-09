import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

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

    const cartItemId = parseInt(id);

    // Parse request body
    const body = await request.json();
    const { quantity } = body;

    // Validate quantity
    if (quantity === undefined || quantity === null) {
      return NextResponse.json(
        {
          error: 'Quantity is required',
          code: 'MISSING_REQUIRED_FIELD',
        },
        { status: 400 }
      );
    }

    if (typeof quantity !== 'number' || !Number.isInteger(quantity) || quantity <= 0) {
      return NextResponse.json(
        {
          error: 'Quantity must be a positive integer greater than 0',
          code: 'INVALID_QUANTITY',
        },
        { status: 400 }
      );
    }

    // Check if cart item exists
    const existingCartItem = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (existingCartItem.length === 0) {
      return NextResponse.json(
        {
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Update cart item
    const updated = await db
      .update(cartItems)
      .set({
        quantity,
      })
      .where(eq(cartItems.id, cartItemId))
      .returning();

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const cartItemId = parseInt(id);

    // Check if cart item exists
    const existingCartItem = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, cartItemId))
      .limit(1);

    if (existingCartItem.length === 0) {
      return NextResponse.json(
        {
          error: 'Cart item not found',
          code: 'CART_ITEM_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Delete cart item
    const deleted = await db
      .delete(cartItems)
      .where(eq(cartItems.id, cartItemId))
      .returning();

    return NextResponse.json(
      {
        message: 'Cart item removed successfully',
        id: deleted[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error: ' + (error as Error).message,
      },
      { status: 500 }
    );
  }
}