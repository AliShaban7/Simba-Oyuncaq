# Simba Oyuncaq - Sürətli Başlanğıc

## 1. MongoDB Konfiqurasiyası

**Seçim 1: MongoDB Atlas (Cloud) - Tövsiyə olunur**

- `.env` faylında connection string artıq konfiqurasiya edilib
- Heç bir local quraşdırma lazım deyil

**Seçim 2: Local MongoDB**

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows
# MongoDB Compass və ya servis kimi işə salın
```

## 2. Backend Quraşdırma

```bash
cd backend
npm install

# .env faylını yaradın
cat > .env << EOF
# MongoDB Atlas (Cloud) - artıq konfiqurasiya edilib
MONGODB_URI=mongodb+srv://Simba-Oyuncaq:admin123@simba-oyuncaq.jkwy5ao.mongodb.net/simba-oyuncaq?retryWrites=true&w=majority

# Local MongoDB istifadə edirsinizsə:
# MONGODB_URI=mongodb://localhost:27017/simba-oyuncaq

JWT_SECRET=simba-secret-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
ALLOW_NEGATIVE_STOCK=false
EOF

# Seed script-i işə salın
npm run seed

# Server-i başladın
npm run start:dev
```

Backend `http://localhost:3000` ünvanında işləyəcək.

## 3. Frontend Quraşdırma

Yeni terminal pəncərəsində:

```bash
cd frontend
npm install
npm run dev
```

Frontend `http://localhost:5173` ünvanında işləyəcək.

## 4. Giriş

Brauzerdə `http://localhost:5173` açın və giriş edin:

- **İstifadəçi adı:** `admin`
- **Şifrə:** `admin123`

## 5. İlk Addımlar

1. **Məhsul əlavə edin** - Products səhifəsində
2. **Ehtiyat daxil edin** - Stock səhifəsində (PURCHASE_IN hərəkəti)
3. **Satış edin** - POS səhifəsində
4. **Hesabatları yoxlayın** - Reports səhifəsində

## Problemlər?

- MongoDB Atlas istifadə edirsinizsə, local MongoDB lazım deyil
- Connection string düzgündür? `.env` faylında yoxlayın
- Backend port 3000-də? `lsof -i :3000` ilə yoxlayın
- Frontend port 5173-də? `lsof -i :5173` ilə yoxlayın
- MongoDB Atlas-da IP whitelist yoxlayın (0.0.0.0/0 - bütün IP-lərə icazə verin)

## API Test

```bash
# Backend test
curl http://localhost:3000

# Login test
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

---

**Uğurlar!** 🦁
