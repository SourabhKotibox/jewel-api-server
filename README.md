# Madhu Backend API

Express · MongoDB · JWT · Multer uploads

## Setup
```bash
cd backend
npm install
cp .env.example .env   # if needed
# start MongoDB locally, then:
npm run seed
npm run dev            # http://localhost:5001
```

## Auth (separate portals)

| Portal | Endpoints | Who |
|--------|-----------|-----|
| **Admin** | `POST /api/auth/admin/login` | Staff roles only |
| **Admin** | `POST /api/auth/admin/register` | Superadmin creates staff |
| **User** | `POST /api/auth/user/register` | Customers only |
| **User** | `POST /api/auth/user/login` | Customers only |
| Both | `GET /api/auth/{admin\|user}/me` | JWT profile |

JWT payload includes `portal: "admin" | "user"`.

### Seed accounts
- Admin: `admin@madhujewellery.com` / `admin123`
- Customer: `customer@madhujewellery.com` / `customer123`

## Uploads (Multer)
- `POST /api/upload` — single file (admin JWT)
- `POST /api/upload/multiple` — up to 12 files
- Static: `GET /uploads/:filename`
- Product create/update accepts `images` multipart
- Category accepts `img` multipart

## Entity CRUD (admin JWT)
`/api/inventory` `/api/attributes` `/api/invoices` `/api/shipments` `/api/refunds`
`/api/transactions` `/api/coupons` `/api/campaigns` `/api/reviews` `/api/newsletter`
`/api/cms-pages` `/api/faqs` `/api/blog` `/api/taxes` `/api/stores` `/api/testimonials`
`/api/media` `/api/locales` `/api/channels` `/api/roles`
Plus: `/api/products` `/api/orders` `/api/customers` `/api/categories` `/api/settings`

Customer: `GET /api/orders/mine`
