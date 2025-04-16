# Personal Finance Manager

A comprehensive web application for managing personal finances, built with React, Node.js, and MongoDB.

## Features

- User Authentication (Sign up, Login, Password Reset)
- Dashboard with Financial Overview
- Income & Expense Tracking
- Budget Management
- Financial Reports & Analytics
- Account Management
- Dark Mode Support
- Responsive Design

## Tech Stack

- **Frontend**: React.js with TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Node.js + Express
- **Database**: MongoDB
- **Authentication**: JWT + OAuth2
- **Charting**: Chart.js
- **PDF Generation**: PDFKit

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- npm or yarn

## Setup Instructions

1. Clone the repository:
```bash
git clone https://github.com/yourusername/personal-finance-manager.git
cd personal-finance-manager
```

2. Install dependencies:
```bash
npm install
cd client
npm install
cd ..
```

3. Configure environment variables:
- Copy `.env.example` to `.env`
- Update the values in `.env` with your configuration

4. Start the development server:
```bash
# Start backend only
npm run dev

# Start frontend only
npm run client

# Start both frontend and backend
npm run dev:full
```

## Project Structure

```
personal-finance-manager/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── services/
│       └── utils/
├── server/                 # Node.js backend
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   └── middleware/
├── .env                    # Environment variables
├── package.json
└── README.md
```

## API Documentation

The API documentation is available at `/api-docs` when running the server in development mode.

## Testing

Run tests using:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@example.com or open an issue in the repository. 