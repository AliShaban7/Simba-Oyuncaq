import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { UserRole } from '../users/schemas/user.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);

  console.log('🔄 Resetting admin user...');

  try {
    // Mövcud admin-i tap
    const admin = await usersService.findByUsername('admin');
    
    if (admin) {
      // Şifrəni yenilə
      await usersService.update(admin._id.toString(), {
        password: 'admin123', // Plain text - usersService.update() hash edəcək
        active: true,
      });
      console.log('✅ Admin password reset (username: admin, password: admin123)');
    } else {
      // Yeni admin yarat
      await usersService.create({
        username: 'admin',
        password: 'admin123',
        fullName: 'Admin İstifadəçi',
        role: UserRole.ADMIN,
        active: true,
      });
      console.log('✅ Admin user created (username: admin, password: admin123)');
    }
  } catch (error) {
    console.error('❌ Error resetting admin:', error.message);
    process.exit(1);
  }

  await app.close();
  process.exit(0);
}

bootstrap();


