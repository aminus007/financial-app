# MindfulMoney - Personal Finance Management App

A full-stack personal finance management application built with React, Node.js, Express, and MongoDB.

## Features

- 📊 Dashboard with financial overview and charts
- 💰 Transaction management
- 📈 Budget tracking
- 🎯 Savings goals
- 🌓 Dark mode support
- �� Responsive design
- 🧮 **Salary Allocator:** Input your salary and use interactive sliders to customize the 50-30-20 rule (Needs, Savings, Wants). Sliders auto-adjust to always total 100%, with suggested defaults and instant calculation.

## Tech Stack

### Frontend
- React
- React Router
- Tailwind CSS
- Recharts
- Axios

### Backend
- Node.js
- Express
- MongoDB
- Mongoose
- JWT Authentication

## Getting Started

1. Clone the repository
```bash
git clone https://github.com/aminus007/financial-app/financial-app.git
cd financial-app
```

2. Install dependencies
```bash
npm install
```

3. Set up environment variables
```bash
# Create .env file in server directory
cp server/.env.example server/.env
# Update the values in .env with your configuration
```

4. Start development servers
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:3000

## Project Structure

```
financial-app/
├── client/              # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/      # Page components
│   │   ├── services/   # API services
│   │   └── hooks/      # Custom hooks
│   └── ...
├── server/             # Express backend
│   ├── models/        # Mongoose models
│   ├── routes/        # API routes
│   ├── middleware/    # Custom middleware
│   └── ...
└── ...
```

## License

MIT 