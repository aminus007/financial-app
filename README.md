# Personal Finance Management Web App

A comprehensive personal finance management application that helps users track their income, expenses, and budgets effectively.

## Features

- 🔐 User Authentication (Sign up, Login, Password Reset)
- 📊 Dashboard with Financial Overview
- 💰 Income & Expense Tracking
- 📈 Budget Management
- 📊 Reports and Analytics
- 💳 Multiple Account Management
- 🌙 Dark Mode Support
- 📱 Responsive Design

## Tech Stack

- Frontend: React.js with Tailwind CSS
- Backend: Node.js with Express
- Database: MongoDB
- Authentication: JWT
- Charts: Chart.js
- Date Handling: date-fns

## Prerequisites

- Node.js (v14 or higher)
- MongoDB
- npm or yarn

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the backend directory with the following variables:
```
PORT=5000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
```

4. Start the development server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the frontend directory with the following variables:
```
REACT_APP_API_URL=http://localhost:5000
```

4. Start the development server:
```bash
npm start
```

## Project Structure

```
finance-web-app/
├── backend/
│   ├── config/         # Configuration files
│   ├── controllers/    # Route controllers
│   ├── middleware/     # Custom middleware
│   ├── models/         # Database models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   └── utils/          # Utility functions
└── frontend/
    ├── public/         # Static files
    └── src/
        ├── components/ # Reusable components
        ├── pages/      # Page components
        ├── context/    # React context
        ├── hooks/      # Custom hooks
        ├── services/   # API services
        └── utils/      # Utility functions
```

## API Documentation

The API documentation is available at `/api-docs` when running the backend server.

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is licensed under the MIT License. 