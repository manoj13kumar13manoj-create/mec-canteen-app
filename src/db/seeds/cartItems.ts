import { db } from '@/db';
import { cartItems } from '@/db/schema';

async function main() {
    const sampleCartItems = [
        {
            userId: 1,
            menuItemId: 1,
            quantity: 2,
            createdAt: new Date('2024-01-15T10:30:00').toISOString(),
        },
        {
            userId: 1,
            menuItemId: 5,
            quantity: 1,
            createdAt: new Date('2024-01-15T10:32:00').toISOString(),
        },
        {
            userId: 1,
            menuItemId: 8,
            quantity: 3,
            createdAt: new Date('2024-01-15T10:35:00').toISOString(),
        },
        {
            userId: 1,
            menuItemId: 12,
            quantity: 1,
            createdAt: new Date('2024-01-15T10:38:00').toISOString(),
        }
    ];

    await db.insert(cartItems).values(sampleCartItems);
    
    console.log('✅ Cart items seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});