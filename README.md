# Simba Oyuncaq Mağazası - Inventory + POS + Debtors System

Tam funksional inventar, satış nöqtəsi (POS) və borclular idarəetmə sistemi.

## Texnologiyalar

### Backend
- **Node.js** + **NestJS** - RESTful API
- **MongoDB** + **Mongoose** - Verilənlər bazası
- **JWT** - Autentifikasiya
- **bcrypt** - Şifrə hash-ləmə

### Frontend
- **React** + **TypeScript** - UI framework
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Routing
- **Zustand** - State management
- **Axios** - HTTP client

## Xüsusiyyətlər

### ✅ Modullar
- **Məhsullar** - Barcode dəstəyi, variantlar, qiymət idarəetməsi
- **Lokasiyalar** - 3 Anbar + 3 Mağaza
- **Ehtiyat Hərəkətləri** - Event-based tracking, heç bir dəyişiklik gizli deyil
- **POS** - Sürətli satış, barcode skan, ödəniş üsulları
- **Müştərilər & Borclular** - Kredit satış, borc idarəetməsi
- **Təchizatçılar** - Creditor tracking
- **Hesabatlar** - Satış, ehtiyat, borclular hesabatları
- **İstifadəçilər & Rollar** - Admin, Menecer, Kassir, Anbar

### 🔒 Təhlükəsizlik
- JWT autentifikasiya
- Rol əsaslı icazələr
- Audit loglar (bütün əməliyyatlar)
- Endirim limitləri (Kassir: 20%, Menecer: 50%)
- Satış ləğvi yalnız Menecer/Admin

### 📊 Qaydalar
- Ehtiyat dəyişiklikləri həmişə Stock Movement kimi qeyd olunur
- Kritik sənədlər silinmir, yalnız VOID/CANCEL
- Hər əməliyyat audit log-da qeyd olunur
- Mənfi ehtiyat yalnız Admin icazəsi ilə

## Quraşdırma

### Tələblər
- Node.js 18+
- MongoDB 6+
- npm və ya yarn

### Backend Quraşdırma

```bash
cd backend
npm install

# .env faylını yaradın
cp .env.example .env
# .env faylını redaktə edin
# Qeyd: MongoDB Atlas istifadə edirsinizsə, local MongoDB quraşdırmağa ehtiyac yoxdur
# Local MongoDB üçün: brew services start mongodb-community (macOS) və ya sudo systemctl start mongod (Linux)

# Seed script-i işə salın (3 anbar, 3 mağaza, admin istifadəçi)
npm run seed

# Development server
npm run start:dev
```

Backend `http://localhost:3000` ünvanında işləyəcək.

### Frontend Quraşdırma

```bash
cd frontend
npm install

# Development server
npm run dev
```

Frontend `http://localhost:5173` ünvanında işləyəcək.

## Environment Variables

### Backend (.env)
```env
# Local MongoDB:
# MONGODB_URI=mongodb://localhost:27017/simba-oyuncaq

# MongoDB Atlas (Cloud):
MONGODB_URI=mongodb+srv://Simba-Oyuncaq:admin123@simba-oyuncaq.jkwy5ao.mongodb.net/simba-oyuncaq?retryWrites=true&w=majority

JWT_SECRET=your-super-secret-jwt-key-change-in-production
JWT_EXPIRES_IN=7d
PORT=3000
NODE_ENV=development
ALLOW_NEGATIVE_STOCK=false
```

### Frontend
Frontend-də `.env` faylı yaradın (istəyə bağlı):
```env
VITE_API_URL=http://localhost:3000
```

## İstifadə

### İlk Giriş
- **İstifadəçi adı:** `admin`
- **Şifrə:** `admin123`

### Rollar və İcazələr

#### Admin/Owner
- Bütün əməliyyatlar
- İstifadəçi idarəetməsi
- Qiymət dəyişiklikləri
- 50% endirim təsdiqi
- Satış ləğvi
- Bütün hesabatlar

#### Manager
- Satış yaratma
- Qiymət dəyişiklikləri
- 50% endirim təsdiqi
- Satış ləğvi
- Hesabatlar

#### Cashier
- Satış yaratma
- Öz satışlarını görüntüləmə
- Qiymət dəyişikliyi yoxdur
- 20% endirim limiti
- Satış silmə yoxdur

#### Warehouse
- Məhsul əlavə etmə
- Ehtiyat hərəkətləri
- Transferlər

## API Endpoints

### Auth
- `POST /auth/login` - Giriş
- `GET /auth/profile` - Profil

### Products
- `GET /products` - Məhsul siyahısı
- `POST /products` - Yeni məhsul
- `GET /products/:id` - Məhsul detalları
- `PATCH /products/:id` - Məhsul redaktə
- `DELETE /products/:id` - Məhsul silmə
- `GET /products/barcode/:barcode` - Barkod ilə axtarış

### Locations
- `GET /locations` - Lokasiya siyahısı
- `POST /locations` - Yeni lokasiya
- `PATCH /locations/:id` - Lokasiya redaktə
- `DELETE /locations/:id` - Lokasiya silmə

### Stock Movements
- `GET /stock-movements` - Hərəkət siyahısı
- `POST /stock-movements` - Yeni hərəkət
- `POST /stock-movements/transfer` - Transfer
- `GET /stock-movements/stock/:productId/:locationId` - Ehtiyat miqdarı
- `GET /stock-movements/by-location/:locationId` - Lokasiya üzrə ehtiyat
- `GET /stock-movements/low-stock` - Az ehtiyat

### Sales
- `GET /sales` - Satış siyahısı
- `POST /sales` - Yeni satış
- `GET /sales/:id` - Satış detalları
- `POST /sales/:id/void` - Satış ləğvi
- `POST /sales/cash-closing` - Gün sonu bağlanış
- `GET /sales/cash-closings` - Bağlanış tarixçəsi

### Customers
- `GET /customers` - Müştəri siyahısı
- `POST /customers` - Yeni müştəri
- `GET /customers/:id` - Müştəri detalları
- `PATCH /customers/:id` - Müştəri redaktə
- `GET /customers/top-debtors` - Ən çox borcu olanlar

### Suppliers
- `GET /suppliers` - Təchizatçı siyahısı
- `POST /suppliers` - Yeni təchizatçı
- `PATCH /suppliers/:id` - Təchizatçı redaktə

### Ledger
- `GET /ledger` - Ledger qeydləri
- `POST /ledger` - Yeni qeyd
- `POST /ledger/payment` - Ödəniş qeydi
- `GET /ledger/balance` - Balans

### Reports
- `GET /reports/stock-by-location` - Lokasiya üzrə ehtiyat
- `GET /reports/low-stock` - Az ehtiyat
- `GET /reports/sales` - Satış hesabatı
- `GET /reports/sales-by-cashier` - Kassir üzrə satış
- `GET /reports/sales-by-store` - Mağaza üzrə satış
- `GET /reports/top-debtors` - Ən çox borcu olanlar
- `GET /reports/cash-closing-history` - Gün sonu tarixçəsi

## Struktur

```
Simba-Oyuncaq/
├── backend/
│   ├── src/
│   │   ├── auth/          # Autentifikasiya
│   │   ├── users/         # İstifadəçilər
│   │   ├── products/      # Məhsullar
│   │   ├── locations/     # Lokasiyalar
│   │   ├── stock-movements/ # Ehtiyat hərəkətləri
│   │   ├── sales/         # Satışlar
│   │   ├── customers/     # Müştərilər
│   │   ├── suppliers/     # Təchizatçılar
│   │   ├── ledger/        # Ledger
│   │   ├── reports/       # Hesabatlar
│   │   ├── audit-logs/    # Audit loglar
│   │   └── scripts/       # Seed script
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/         # Səhifələr
│   │   ├── components/    # Komponentlər
│   │   ├── store/         # State management
│   │   └── api/           # API client
│   └── package.json
└── README.md
```

## Branding

Simba rəngləri:
- **Primary:** #F4A300 (qızılı/narıncı)
- **Secondary:** #2E1A12 (tünd qəhvəyi)
- **Accent:** #FFD36A (açıq qızıl)
- **Background:** #FFF7E6 (isti ağ)

## Qeydlər

- Bütün interfeys Azərbaycan dilindədir
- Barcode skaner klaviatura kimi işləyir (barcode input sahəsi avtomatik fokus alır)
- Ehtiyat hərəkətləri həmişə qeyd olunur, heç bir gizli dəyişiklik yoxdur
- Satışlar silinmir, yalnız ləğv edilir (void)
- Audit loglar bütün əməliyyatları izləyir

## İstehsal üçün

```bash
# Backend build
cd backend
npm run build
npm run start:prod

# Frontend build
cd frontend
npm run build
# dist/ qovluğunu istənilən static server-ə deploy edin
```

## Dəstək

Suallar və problemlər üçün issue açın.

---

**Simba Oyuncaq Mağazası** 🦁 - Güclü və etibarlı inventar sistemi

