import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';

async function cleanupUsers() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('🧹 Starting user cleanup...');

  try {
    // Get all users
    const allUsers = await usersService.findAll();
    console.log(`Found ${allUsers.length} users in database`);

    // Filter out admin users
    const nonAdminUsers = allUsers.filter(user => user.role !== 'admin');
    console.log(`Found ${nonAdminUsers.length} non-admin users to remove`);

    if (nonAdminUsers.length === 0) {
      console.log('✅ No non-admin users found. Database is already clean.');
    } else {
      // Remove each non-admin user
      for (const user of nonAdminUsers) {
        console.log(`Removing user: ${user.fullName} (${user.username}) - Role: ${user.role}`);
        await usersService.remove(user._id.toString());
      }
      console.log(`✅ Successfully removed ${nonAdminUsers.length} non-admin users`);
    }

    // Show remaining users
    const remainingUsers = await usersService.findAll();
    console.log(`\n📋 Remaining users (${remainingUsers.length}):`);
    remainingUsers.forEach(user => {
      console.log(`  - ${user.fullName} (${user.username}) - Role: ${user.role}`);
    });

  } catch (error) {
    console.error('❌ Error during cleanup:', error.message);
  }

  console.log('✅ Cleanup completed!');
  await app.close();
}

cleanupUsers().catch((error) => {
  console.error('❌ Cleanup failed:', error);
  process.exit(1);
});
