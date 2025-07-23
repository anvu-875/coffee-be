# Coffee Shop Backend

This is a Node.js backend project for a coffee shop, built with TypeScript, Express, PostgreSQL, and Prisma ORM.

## Features
- User authentication (JWT)
- Product (coffee) management
- Order management
- REST API endpoints

## Getting Started

1. Install dependencies:
   ```sh
   npm install
   ```
2. Set up your `.env` file (see `.env.example`).
3. Initialize the database:
   ```sh
   npx prisma migrate dev --name init
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```

## Scripts
- `npm run dev` — Start in development mode
- `npm run build` — Build for production
- `npm start` — Start in production

## Project Structure
- `src/` — Source code
- `prisma/` — Prisma schema and migrations

## License
MIT
