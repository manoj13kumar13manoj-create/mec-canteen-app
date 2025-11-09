import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { cartItems, menuItems } from '@/db/schema';
import { eq, and } from 'drizzle-orm';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const userId = searchParams.get('userId');

    if (!userId || isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    const userCartItems = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        menuItemId: cartItems.menuItemId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        menuItem: {
          id: menuItems.id,
          name: menuItems.name,
          description: menuItems.description,
          price: menuItems.price,
          category: menuItems.category,
          imageUrl: menuItems.imageUrl,
          available: menuItems.available,
        },
      })
      .from(cartItems)
      .innerJoin(menuItems, eq(cartItems.menuItemId, menuItems.id))
      .where(eq(cartItems.userId, parseInt(userId)));

    return NextResponse.json(userCartItems, { status: 200 });
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
    const { userId, menuItemId, quantity = 1 } = body;

    if (!userId) {
      return NextResponse.json({ 
        error: "userId is required",
        code: "MISSING_USER_ID" 
      }, { status: 400 });
    }

    if (!menuItemId) {
      return NextResponse.json({ 
        error: "menuItemId is required",
        code: "MISSING_MENU_ITEM_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(userId))) {
      return NextResponse.json({ 
        error: "Valid userId is required",
        code: "INVALID_USER_ID" 
      }, { status: 400 });
    }

    if (isNaN(parseInt(menuItemId))) {
      return NextResponse.json({ 
        error: "Valid menuItemId is required",
        code: "INVALID_MENU_ITEM_ID" 
      }, { status: 400 });
    }

    const parsedQuantity = parseInt(quantity.toString());
    if (isNaN(parsedQuantity) || parsedQuantity <= 0) {
      return NextResponse.json({ 
        error: "Quantity must be a positive integer",
        code: "INVALID_QUANTITY" 
      }, { status: 400 });
    }

    const existingCartItem = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.userId, parseInt(userId)),
          eq(cartItems.menuItemId, parseInt(menuItemId))
        )
      )
      .limit(1);

    if (existingCartItem.length > 0) {
      const updatedCartItem = await db
        .update(cartItems)
        .set({
          quantity: existingCartItem[0].quantity + parsedQuantity,
        })
        .where(eq(cartItems.id, existingCartItem[0].id))
        .returning();

      return NextResponse.json(updatedCartItem[0], { status: 201 });
    } else {
      const newCartItem = await db
        .insert(cartItems)
        .values({
          userId: parseInt(userId),
          menuItemId: parseInt(menuItemId),
          quantity: parsedQuantity,
          createdAt: new Date().toISOString(),
        })
        .returning();

      return NextResponse.json(newCartItem[0], { status: 201 });
    }
  } catch (error) {
    console.error('POST error:', error);
    return NextResponse.json({ 
      error: 'Internal server error: ' + (error as Error).message 
    }, { status: 500 });
  }
}