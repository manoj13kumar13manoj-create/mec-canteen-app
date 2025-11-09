import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { menuItems } from '@/db/schema';
import { eq, like, or, and } from 'drizzle-orm';

const VALID_CATEGORIES = ['snacks', 'meals', 'beverages', 'desserts'] as const;

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '100'), 100);
    const offset = parseInt(searchParams.get('offset') ?? '0');

    // Single item by ID
    if (id) {
      if (isNaN(parseInt(id))) {
        return NextResponse.json(
          { error: 'Valid ID is required', code: 'INVALID_ID' },
          { status: 400 }
        );
      }

      const item = await db
        .select()
        .from(menuItems)
        .where(eq(menuItems.id, parseInt(id)))
        .limit(1);

      if (item.length === 0) {
        return NextResponse.json(
          { error: 'Menu item not found', code: 'NOT_FOUND' },
          { status: 404 }
        );
      }

      return NextResponse.json(item[0], { status: 200 });
    }

    // List items with optional filters
    let query = db.select().from(menuItems);
    const conditions = [];

    // Category filter
    if (category) {
      if (!VALID_CATEGORIES.includes(category as any)) {
        return NextResponse.json(
          { 
            error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}`,
            code: 'INVALID_CATEGORY' 
          },
          { status: 400 }
        );
      }
      conditions.push(eq(menuItems.category, category));
    }

    // Search filter
    if (search) {
      conditions.push(
        or(
          like(menuItems.name, `%${search}%`),
          like(menuItems.description, `%${search}%`)
        )
      );
    }

    // Apply filters if any
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const items = await query.limit(limit).offset(offset);

    return NextResponse.json(items, { status: 200 });
  } catch (error: any) {
    console.error('GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, price, category, imageUrl, available } = body;

    // Validate required fields
    if (!name || name.trim() === '') {
      return NextResponse.json(
        { error: 'Name is required', code: 'MISSING_NAME' },
        { status: 400 }
      );
    }

    if (price === undefined || price === null) {
      return NextResponse.json(
        { error: 'Price is required', code: 'MISSING_PRICE' },
        { status: 400 }
      );
    }

    if (!category || category.trim() === '') {
      return NextResponse.json(
        { error: 'Category is required', code: 'MISSING_CATEGORY' },
        { status: 400 }
      );
    }

    // Validate price is a positive number
    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return NextResponse.json(
        { error: 'Price must be a positive number', code: 'INVALID_PRICE' },
        { status: 400 }
      );
    }

    // Validate category
    if (!VALID_CATEGORIES.includes(category as any)) {
      return NextResponse.json(
        {
          error: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
          code: 'INVALID_CATEGORY',
        },
        { status: 400 }
      );
    }

    // Prepare insert data
    const insertData: any = {
      name: name.trim(),
      price: parsedPrice,
      category: category.trim(),
      available: available !== undefined ? Boolean(available) : true,
      createdAt: new Date().toISOString(),
    };

    // Add optional fields if provided
    if (description !== undefined && description !== null) {
      insertData.description = description.trim();
    }

    if (imageUrl !== undefined && imageUrl !== null && imageUrl.trim() !== '') {
      insertData.imageUrl = imageUrl.trim();
    }

    // Insert into database
    const newMenuItem = await db.insert(menuItems).values(insertData).returning();

    return NextResponse.json(newMenuItem[0], { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json(
      { error: 'Internal server error: ' + error.message },
      { status: 500 }
    );
  }
}