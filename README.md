# Web Security Fundamentals | User Dashboard
## Installation
These instructions will help you set up and run the HTTPS server locally on your device.
1. **Clone the Repository**    
    `git clone https://github.com/rcriz22/DevPortfolio_UserDashboard` \
    `cd DevPortfolio_UserDashboard`
    `cd Phase3_Portfolio`
    `cd Portfolio_Backend (for my Backend)`
    `cd Portfolio_Frontend (for my Frontend)`
2. **Install Dependencies**
  For my Portfolio_Frontend
    react | react-dom | react-router-dom
These are packages needed for development, building, or linting:
  vite → build tool and dev server
  @vitejs/plugin-react → React support for Vite
  eslint → code linting
  @eslint/js → ESLint JavaScript parser/config
  eslint-plugin-react-hooks → linting rules for React hooks
  eslint-plugin-react-refresh → integration with React Fast Refresh
  globals → provides global variable definitions for ESLint
 `npm install -D vite @vitejs/plugin-react eslint @eslint/js eslint-plugin-react-hooks eslint-plugin-react-refresh globals`
 `npm install react react-dom react-router-dom`

  For my Portfolio_Backend
  These are all packages your backend needs to run:
  - bcrypt
  - bcryptjs
  - cookie-parser
  - cors
  - crypto
  - csurf
  - dotenv
  - escape-html
  - express
  - express-rate-limit
  - express-validator
  - helmet
  - jsonwebtoken
  - mongoose
  - nodemailer
  - passport
  - passport-google-oauth20

`npm install bcrypt bcryptjs cookie-parser cors crypto csurf dotenv escape-html express express-rate-limit express-validator helmet jsonwebtoken mongoose nodemailer passport passport-google-oauth20
`
`npm install -D nodemon`

**Create .env file** \
`JWT_SECRET=your_jwt_secret` \
`REFRESH_SECRET=your_refresh_secret` \
`GOOGLE_CLIENT_ID=your_client_id` \
`GOOGLE_CLIENT_SECRET=your_client_secret` \
`EMAIL_USER=your.email@gmail.com` \
`EMAIL_PASS=your_app_password`

**Start MongoDB**\
  Ensure MongoDB is running locally 


## SECURITY IMPLEMENTATION
**Input Validation**
I made sure the server checks all the user inputs so that they follow the rules we set. 
For example:
- Emails have to be valid when signing up or updating.
- Usernames can’t have weird or invalid characters.
- Passwords must be a certain length and meet basic complexity.
I handled this using our own middleware (validateProfileUpdate) and express-validator.
