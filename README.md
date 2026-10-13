# Essence Unisex Salon & Spa — Management App (Starter)

A responsive React + Vite starter app for recording salon sales, calculating VAT at 7.5%, calculating staff commission at 30%, and reviewing monthly staff sales reports.

## Run locally

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

Open the local URL shown by Vite (normally http://localhost:5173).

To create a production build:

```bash
npm run build
npm run preview
```

## Current features

- Monthly dashboard and totals
- Record sales by date, staff member, service, customer and amount
- Automatic VAT (7.5%) and commission (30%) calculations
- Staff directory and monthly staff sales leaderboard
- Search and CSV export for sales and monthly staff reports
- Responsive desktop/tablet/mobile layout
- Data persists in the current browser using localStorage

## Important limitations

This is a first frontend version. Records are stored only in the browser/device where they are entered. They are not synced between devices, and clearing browser data can erase them. It has no login, cloud database, role-based permissions or automated backups yet. Do not use it as the only record of real business transactions until a secure database, authentication, access policies and backups have been configured. Export CSV reports regularly.

The VAT and commission rates are assumptions requested for this starter. Confirm the correct VAT treatment and commission basis with your accountant before using reports for official tax or payroll decisions. Current formula: VAT = entered amount × 7.5%; commission = entered amount × 30%.

## Recommended next production steps

1. Create a GitHub repository and upload this project.
2. Deploy to a host whose plan terms allow commercial use (check current pricing and usage limits).
3. Connect a hosted PostgreSQL database such as Supabase.
4. Add authentication and row-level security so staff can only see permitted records.
5. Add backup and restore procedures and test them before relying on the system.
