# Book Review System

## Using ApolloServer GraphQL Postgres Prisma TypeScript

## Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/kadariabdul/book-review-system-demo.git
   ```
2. Navigate to the project directory:
   ```bash
   cd book-review-system-demo
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Create a `.env` file in the root directory and environment variables from `.env.sample`. 
5. Run the Prisma migrations:
   ```bash
   npx prisma migrate dev --init
   ```
6. Start the server:
   ```bash
   npm run dev
   ```

## Build Project then run
```
npm run build && npm start
```

## To run unit test-cases
```
npm run test
```

## API Documentation

This Apollo GraphQL server provides the following endpoints:

- `/graphql` - GraphQL endpoint.

### Authentication

- Some endpoints may require authentication. Ensure to include a valid `Authorization` header with your GraphQL requests in the format `Bearer <token_here>`.

- To ensure secure access, we have implemented an access token and refresh token mechanism. You will need to generate a new access token periodically using the GraphQL mutation `getNewAccessToken`.

