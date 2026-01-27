import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { LocationsService } from '../locations/locations.service';
import { UserRole } from '../users/schemas/user.schema';
import { LocationType } from '../locations/schemas/location.schema';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const locationsService = app.get(LocationsService);

  console.log('🌱 Starting seed...');

  // Create admin user
  try {
    const adminExists = await usersService.findByUsername('admin');
    if (!adminExists) {
      // usersService.create() özü şifrəni hash edəcək, biz sadəcə plain text göndəririk
      await usersService.create({
        username: 'admin',
        password: 'admin123', // Plain text - usersService.create() hash edəcək
        fullName: 'Admin İstifadəçi',
        role: UserRole.ADMIN,
        active: true,
      });
      console.log('✅ Admin user created (username: admin, password: admin123)');
    } else {
      console.log('ℹ️  Admin user already exists');
      // Əgər mövcuddursa, şifrəni yeniləyək (əgər yanlış hash olunubsa)
      console.log('ℹ️  To reset password, delete the user and run seed again');
    }
  } catch (error) {
    console.log('⚠️  Error creating admin user:', error.message);
  }

  // Create 3 Warehouses
  const warehouses = [
    { name: 'Anbar 1', address: 'Bakı, Nəsimi rayonu, Xətai prospekti 123', phone: '+994 12 123 45 67' },
    { name: 'Anbar 2', address: 'Bakı, Səbail rayonu, İstiqlaliyyət küçəsi 456', phone: '+994 12 234 56 78' },
    { name: 'Anbar 3', address: 'Bakı, Yasamal rayonu, Nizami küçəsi 789', phone: '+994 12 345 67 89' },
  ];

  for (const warehouse of warehouses) {
    try {
      const existing = await locationsService.findAll({ name: warehouse.name });
      if (existing.length === 0) {
        await locationsService.create({
          ...warehouse,
          type: LocationType.WAREHOUSE,
          active: true,
        }, 'seed-script');
        console.log(`✅ Warehouse created: ${warehouse.name}`);
      } else {
        console.log(`ℹ️  Warehouse already exists: ${warehouse.name}`);
      }
    } catch (error) {
      console.log(`⚠️  Error creating warehouse ${warehouse.name}:`, error.message);
    }
  }

  // Create 3 Stores
  const stores = [
    { name: 'Mağaza 1', address: 'Bakı, Nəsimi rayonu, Təbriz küçəsi 10', phone: '+994 12 111 22 33' },
    { name: 'Mağaza 2', address: 'Bakı, Səbail rayonu, Füzuli küçəsi 20', phone: '+994 12 222 33 44' },
    { name: 'Mağaza 3', address: 'Bakı, Yasamal rayonu, Rəşid Behbudov küçəsi 30', phone: '+994 12 333 44 55' },
  ];

  for (const store of stores) {
    try {
      const existing = await locationsService.findAll({ name: store.name });
      if (existing.length === 0) {
        await locationsService.create({
          ...store,
          type: LocationType.STORE,
          active: true,
        }, 'seed-script');
        console.log(`✅ Store created: ${store.name}`);
      } else {
        console.log(`ℹ️  Store already exists: ${store.name}`);
      }
    } catch (error) {
      console.log(`⚠️  Error creating store ${store.name}:`, error.message);
    }
  }

  console.log('✅ Seed completed!');
  await app.close();
}

bootstrap().catch((error) => {
  console.error('❌ Seed failed:', error);
  process.exit(1);
});

