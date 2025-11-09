import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            email: 'student@mec.edu',
            name: 'Raj Kumar',
            role: 'student',
            createdAt: new Date().toISOString(),
        },
        {
            email: 'admin@mec.edu',
            name: 'Canteen Manager',
            role: 'admin',
            createdAt: new Date().toISOString(),
        },
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});