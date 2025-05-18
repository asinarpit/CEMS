# College Event Management System (CEMS)

A full-stack web application for managing college events, built with the MERN stack (MongoDB, Express, React, Node.js).

## Features

- **Role-based Authentication**: Student, Organizer, and Admin roles
- **Event Management**: Create, edit, view, and delete events
- **Event Registration**: Register for free and paid events
- **Payment Integration**: Mock payment gateway for paid events
- **Dark/Light Mode**: Toggle between dark and light themes
- **Responsive Design**: Mobile-friendly interface using Tailwind CSS

## Tech Stack

### Backend
- Node.js with Express.js
- MongoDB with Mongoose
- JWT Authentication
- RESTful API

### Frontend
- React.js with Vite
- React Router for navigation
- Redux Toolkit for state management
- Tailwind CSS for styling
- React Icons for icons
- React Toastify for notifications

## Installation

### Prerequisites
- Node.js (v14 or later)
- MongoDB (local or Atlas)

### Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/cems.git
cd cems
```

2. Install dependencies for both server and client:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

3. Create a `.env` file in the server directory with the following content:
```
MONGODB_URI=your_mongodb_connection_string
PORT=5000
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRE=30d
```

4. Create a `.env` file in the client directory with the following content:
```
VITE_API_URL=http://localhost:5000/api
```

## Running the Application

1. Start the backend server:
```bash
cd server
npm run dev
```

2. Start the React frontend in a new terminal:
```bash
cd client
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173` to view the application.

## Seeding Data

To populate the database with sample data:

```bash
cd server
npm run seed
```

This will create:
- 3 user accounts (admin, organizer, student)
- 20 random events with different categories, dates, and images

To clear the database:

```bash
cd server
npm run unseed
```

## Project Structure

```
cems/
├── client/               # React frontend
│   ├── public/           # Public assets
│   └── src/              # Source files
│       ├── app/          # Redux store
│       ├── components/   # Reusable components
│       ├── features/     # Redux slices
│       └── pages/        # Page components
├── server/               # Express backend
│   ├── middleware/       # Express middleware
│   ├── models/           # Mongoose models
│   └── routes/           # API routes
└── README.md             # This file
```

## User Roles

- **Student**: Can view events and register for them
- **Organizer**: Can create and manage their own events
- **Admin**: Has full access to all events and users

## Demo Accounts

- **Admin**: admin@example.com / password123
- **Organizer**: organizer@example.com / password123
- **Student**: student@example.com / password123

## License

This project is licensed under the MIT License. 