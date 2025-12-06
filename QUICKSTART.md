# Tranquil Dashboard - Quick Start Guide

## 🚀 Get Started in 3 Steps

### 1. Install Dependencies
```bash
cd newdashboard
npm install
```

### 2. Configure Environment
Create `.env.local`:
```env
NEXT_PUBLIC_SERVER_API=http://localhost:9501/api
```

### 3. Start Development Server
```bash
npm run dev
```

Visit: `http://localhost:3000/admin/login`

---

## 🎨 Tranquil Brand Colors

```css
Primary (Dark Blue):  #0D1925
Secondary (Green):    #6FAD42
Tertiary (Gold):      #FDDD81
Accent (Light Green): #9BC73C
Error (Red):          #FF3B30
```

---

## 🔑 Default Admin Credentials

Use the credentials from your `.env` file:
- Email: Value of `ADMIN_EMAIL` in server `.env`
- Password: Your admin password

---

## 📁 Admin Pages Structure

```
/admin/login          → Login page
/admin/dashboard      → Overview & metrics
/admin/properties     → Property management
/admin/units          → Unit management (unique numbers)
/admin/tenants        → Tenant CRUD
/admin/bills          → Bill creation & tracking
/admin/payments       → Payment recording
/admin/maintenance    → Maintenance requests
/admin/announcements  → Broadcast messages
/admin/analytics      → Reports & charts
/admin/settings       → App configuration
/admin/users          → User management (admin only)
```

---

## 🛠 Common Tasks

### Create a Property
1. Login → Navigate to Properties
2. Click "Add Property"
3. Fill in: Name, Address, Description
4. Save

### Add Units to Property
1. Select property from dropdown
2. Navigate to Units
3. Click "Add Unit"
4. Enter unique unit number (e.g., "A101", "BLDG1-201")
5. Set rent, bedrooms, bathrooms
6. Save

### Register a Tenant
1. Tenant uses mobile app
2. Provides unit number during signup
3. System validates unit exists and is vacant
4. Tenant account created and linked to unit
5. Unit status changes to "occupied"

### Create a Bill
1. Select property
2. Navigate to Bills
3. Click "Create Bill"
4. Select tenant/unit
5. Add line items (rent, water, electricity, etc.)
6. Set due date
7. Save

### Record a Payment
1. Navigate to Payments
2. Click "Record Payment"
3. Select tenant/unit
4. Enter amount and payment method
5. Add Mpesa code (if applicable)
6. Save

---

## 🔧 Troubleshooting

### Server not responding?
```bash
# Check server is running
cd ../server
npm start

# Verify it's on port 9501
curl http://localhost:9501/api/health
```

### Login not working?
1. Check `.env.local` has correct `NEXT_PUBLIC_SERVER_API`
2. Verify server is running
3. Check browser console for errors
4. Try clearing browser cache

### Styles not loading?
```bash
# Clear Next.js cache
rm -rf .next
npm run dev
```

---

## 📚 Key Files

- `app/store/AuthStore.jsx` - Authentication state
- `app/store/LandlordStore.jsx` - Property/tenant state
- `app/components/AdminLayout.jsx` - Admin layout
- `app/styles/global.css` - Tranquil colors & styles
- `app/admin/*/page.jsx` - Admin pages

---

## 💡 Tips

1. **Always select a property** before viewing units/tenants/bills
2. **Unit numbers are globally unique** - use prefixes for multiple buildings
3. **Tenants register via mobile app** - provide them with their unit number
4. **Token refresh is automatic** - no manual intervention needed
5. **Use the property dropdown** in the navbar to switch between properties

---

## 🎯 Next Steps

1. ✅ Start the server (`cd ../server && npm start`)
2. ✅ Start the dashboard (`npm run dev`)
3. ✅ Login at `/admin/login`
4. ✅ Create your first property
5. ✅ Add units to the property
6. ✅ Share unit numbers with tenants
7. ✅ Tenants register via mobile app
8. ✅ Start managing your properties!

---

## 📞 Need Help?

- Check `MIGRATION_COMPLETE.md` for detailed documentation
- Review server logs for API errors
- Use browser DevTools for frontend debugging
- Check the Network tab for failed requests

---

**Happy Managing! 🏘️**
