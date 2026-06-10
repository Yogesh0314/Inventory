# Smart Inventory Management System

A production-grade, full-stack inventory management solution built with React, Node.js, and MongoDB.

## 🚀 Features

- **Inventory Tracking:** Real-time stock levels, low-stock alerts, and manual adjustments.
- **Supplier Management:** Centralized database for all suppliers linked to products.
- **Transaction History:** Automated ledger for all purchases and sales.
- **Audit Logs:** Complete history of system actions for accountability.
- **Analytics Dashboard:** Visual trends and key performance indicators.
- **Bulk Operations:** Import/Export via CSV and Excel.
- **Reporting:** Professional PDF report generation.
- **Hybrid Database:** Seamlessly switches between MongoDB and a local JSON fallback.

## 🛠️ Tech Stack

- **Frontend:** React 19, Tailwind CSS, TanStack Query, Recharts, Lucide Icons.
- **Backend:** Node.js, Express, Zod (Validation), Winston (Logging).
- **Database:** MongoDB (Production) / JSON File (Development).
- **Auth:** JWT with Role-Based Access Control (Admin/Staff).
- **DevOps:** Docker, Vitest (Testing).

## 📦 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- Docker (Optional, for containerized setup)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/Yogesh0314/Inventory.git
cd Inventory

# Install Backend dependencies
cd backend
npm install
cp .env.example .env

# Install Frontend dependencies
cd ../frontend
npm install
```

### 3. Running the App

#### Using Docker (Recommended)
```bash
docker-compose up --build
```

#### Manual Start
**Backend:**
```bash
cd backend
npm run dev
```
**Frontend:**
```bash
cd frontend
npm run dev
```

## 🧪 Testing

```bash
cd backend
npm test
```

## 📄 License
ISC
