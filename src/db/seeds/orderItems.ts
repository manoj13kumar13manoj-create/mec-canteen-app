import { db } from '@/db';
import { orderItems } from '@/db/schema';

async function main() {
    const sampleOrderItems = [
        // Order 1 items (₹85 total)
        {
            orderId: 1,
            menuItemId: 1,
            quantity: 1,
            price: 60.00,
            createdAt: new Date('2024-01-15T09:15:00').toISOString(),
        },
        {
            orderId: 1,
            menuItemId: 6,
            quantity: 1,
            price: 25.00,
            createdAt: new Date('2024-01-15T09:15:00').toISOString(),
        },
        
        // Order 2 items (₹150 total)
        {
            orderId: 2,
            menuItemId: 4,
            quantity: 1,
            price: 120.00,
            createdAt: new Date('2024-01-15T12:30:00').toISOString(),
        },
        {
            orderId: 2,
            menuItemId: 9,
            quantity: 1,
            price: 30.00,
            createdAt: new Date('2024-01-15T12:30:00').toISOString(),
        },
        
        // Order 3 items (₹220 total)
        {
            orderId: 3,
            menuItemId: 5,
            quantity: 1,
            price: 140.00,
            createdAt: new Date('2024-01-16T13:45:00').toISOString(),
        },
        {
            orderId: 3,
            menuItemId: 7,
            quantity: 2,
            price: 30.00,
            createdAt: new Date('2024-01-16T13:45:00').toISOString(),
        },
        {
            orderId: 3,
            menuItemId: 10,
            quantity: 1,
            price: 50.00,
            createdAt: new Date('2024-01-16T13:45:00').toISOString(),
        },
        
        // Order 4 items (₹95 total)
        {
            orderId: 4,
            menuItemId: 2,
            quantity: 2,
            price: 35.00,
            createdAt: new Date('2024-01-16T16:20:00').toISOString(),
        },
        {
            orderId: 4,
            menuItemId: 8,
            quantity: 1,
            price: 25.00,
            createdAt: new Date('2024-01-16T16:20:00').toISOString(),
        },
    ];

    await db.insert(orderItems).values(sampleOrderItems);
    
    console.log('✅ Order items seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});