# 🌯 L8 Shawarma Website

A full website for L8 Shawarma, 41 Lodge Lane, Liverpool L8 0QT.

## 📁 File Structure

```
l8shawarma/
├── index.html        ← Main website (Home, Menu, About, Contact)
├── style.css         ← Styles for main website
├── login.html        ← Login & Sign Up page
├── checkout.html     ← Order checkout with delivery address & payment
├── auth.css          ← Styles for login & checkout pages
└── backend/
    ├── server.js     ← Node.js/Express backend server
    ├── package.json  ← Dependencies
    └── .env.example  ← Environment variables template
```

## 🚀 How to Run

### 1. Open the Frontend (no setup needed)
Just open `index.html` in your browser — the website works right away for browsing.

### 2. Run the Backend (for login & payments)

```bash
# Go into the backend folder
cd backend

# Install dependencies
npm install

# Copy the env file and fill in your keys
cp .env.example .env

# Start the server
npm start
# or for auto-restart during development:
npm run dev
```

Server will run at: **http://localhost:3000**

## 🔑 Setting Up Stripe Payments

1. Go to [https://dashboard.stripe.com](https://dashboard.stripe.com) and create a free account
2. Go to **Developers → API Keys**
3. Copy your **Secret Key** and **Publishable Key**
4. Paste them into your `.env` file

## 📱 Pages

| Page | Description |
|------|-------------|
| `index.html` | Main page: hero, menu, about, contact, map |
| `login.html` | Login + Sign Up forms |
| `checkout.html` | Delivery address + payment checkout |

## 🌐 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/register` | Create new account |
| POST | `/api/login` | Login |
| GET | `/api/me` | Get logged-in user |
| POST | `/api/delivery` | Save delivery address |
| POST | `/api/payment/intent` | Create Stripe payment |
| POST | `/api/payment` | Place full order |

## 📞 Business Info

- **Address:** 41 Lodge Lane, Liverpool L8 0QT
- **Email:** hello@l8shawarma.co.uk
- **UberEats / Deliveroo:** Link when registered

## 📝 TODO (Before Going Live)

- [ ] Replace placeholder phone number with real number
- [ ] Add real Stripe keys to `.env`
- [ ] Set up a real database (MongoDB or MySQL recommended)
- [ ] Register on UberEats/Deliveroo and update order links
- [ ] Add real product photos
- [ ] Confirm opening hours with owner
- [ ] Set up professional email (hello@l8shawarma.co.uk)
- [ ] Deploy to hosting (Vercel frontend, Railway/Render for backend)
