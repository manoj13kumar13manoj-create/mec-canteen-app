import { db } from '@/db';
import { orders } from '@/db/schema';

async function main() {
    const sampleOrders = [
        {
            userId: 1,
            totalAmount: 85,
            status: 'completed',
            pickupLocation: 'Main Canteen',
            createdAt: new Date('2024-01-15T09:30:00').toISOString(),
            updatedAt: new Date('2024-01-15T10:15:00').toISOString(),
        },
        {
            userId: 1,
            totalAmount: 150,
            status: 'ready',
            pickupLocation: 'Library Cafe',
            createdAt: new Date('2024-01-16T12:45:00').toISOString(),
            updatedAt: new Date('2024-01-16T13:20:00').toISOString(),
        },
        {
            userId: 1,
            totalAmount: 220,
            status: 'preparing',
            pickupLocation: 'Hostel Canteen',
            createdAt: new Date('2024-01-17T14:20:00').toISOString(),
            updatedAt: new Date('2024-01-17T14:35:00').toISOString(),
        },
        {
            userId: 1,
            totalAmount: 95,
            status: 'pending',
            pickupLocation: 'Main Canteen',
            createdAt: new Date('2024-01-18T08:15:00').toISOString(),
            updatedAt: new Date('2024-01-18T08:15:00').toISOString(),
        }
    ];

    await db.insert(orders).values(sampleOrders);
    
    console.log('✅ Orders seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});