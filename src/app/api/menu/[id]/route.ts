import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_CATEGORIES = ['snacks', 'meals', 'beverages', 'desserts'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, price, category, imageUrl, available } = body;

    // Validate that user is not trying to update restricted fields
    if ('id' in body || 'createdAt' in body) {
      return NextResponse.json(
        { error: 'Cannot update id or createdAt fields', code: 'INVALID_FIELDS' },
        { status: 400 }
      );
    }

    // Validate price if provided
    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
            code: 'INVALID_CATEGORY',
          },
          { status: 400 }
        );
      }
    }

    // Check if menu item exists
    const existingItem = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (price !== undefined) updates.price = price;
    if (category !== undefined) updates.category = category;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl?.trim() || null;
    if (available !== undefined) updates.available = available;

    // Update the menu item
    const updated = await db
      .update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update menu item', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = params.id;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const existingItem = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the menu item
    const deleted = await db
      .delete(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete menu item', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Menu item deleted successfully',
        id: deleted[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { menuItems } from '@/db/schema';
import { eq } from 'drizzle-orm';

const VALID_CATEGORIES = ['snacks', 'meals', 'beverages', 'desserts'];

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { name, description, price, category, imageUrl, available } = body;

    // Validate that user is not trying to update restricted fields
    if ('id' in body || 'createdAt' in body) {
      return NextResponse.json(
        { error: 'Cannot update id or createdAt fields', code: 'INVALID_FIELDS' },
        { status: 400 }
      );
    }

    // Validate price if provided
    if (price !== undefined) {
      if (typeof price !== 'number' || price <= 0) {
        return NextResponse.json(
          { error: 'Price must be a positive number', code: 'INVALID_PRICE' },
          { status: 400 }
        );
      }
    }

    // Validate category if provided
    if (category !== undefined) {
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          {
            error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
            code: 'INVALID_CATEGORY',
          },
          { status: 400 }
        );
      }
    }

    // Check if menu item exists
    const existingItem = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Build update object with only provided fields
    const updates: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim() || null;
    if (price !== undefined) updates.price = price;
    if (category !== undefined) updates.category = category;
    if (imageUrl !== undefined) updates.imageUrl = imageUrl?.trim() || null;
    if (available !== undefined) updates.available = available;

    // Update the menu item
    const updated = await db
      .update(menuItems)
      .set(updates)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    if (updated.length === 0) {
      return NextResponse.json(
        { error: 'Failed to update menu item', code: 'UPDATE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(updated[0], { status: 200 });
  } catch (error) {
    console.error('PUT error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
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

    if (!id || isNaN(parseInt(id))) {
      return NextResponse.json(
        { error: 'Valid ID is required', code: 'INVALID_ID' },
        { status: 400 }
      );
    }

    // Check if menu item exists
    const existingItem = await db
      .select()
      .from(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .limit(1);

    if (existingItem.length === 0) {
      return NextResponse.json(
        { error: 'Menu item not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Delete the menu item
    const deleted = await db
      .delete(menuItems)
      .where(eq(menuItems.id, parseInt(id)))
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json(
        { error: 'Failed to delete menu item', code: 'DELETE_FAILED' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Menu item deleted successfully',
        id: deleted[0].id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + (error as Error).message },
      { status: 500 }
    );
  }
}