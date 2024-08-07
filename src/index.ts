import express from 'express';
import helmet from 'helmet';
import cors from 'cors'; // Add CORS import
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
import { PrismaClient } from '@prisma/client';
import typeDefs from './schema/typeDefs';
import resolvers from './schema/resolvers';
import CustomError from './customError';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const app = express();

app.use(
  helmet({
    contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false, // Disable CSP in development for debugging
  })
);

app.use(cors());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({
    prisma,
    req,
  }),
  formatError: (error) => {
    if (error.originalError instanceof CustomError) {
      const { message, statusCode, code, stack } = error.originalError;
      return {
        message,
        extensions: {
          code: code ?? 'BAD_REQUEST',
          statusCode,
          stack: process.env.NODE_ENV === 'development' ? stack : undefined, // Only include stack trace in development mode
        },
      };
    }
    return {
      message: error.message ?? 'INTERNAL_SERVER_ERROR',
      statusCode: 500,
      extensions: {
        code: error.extensions?.code ?? 'INTERNAL_SERVER_ERROR',
      },
    };
  },
  plugins: [
    ApolloServerPluginLandingPageGraphQLPlayground()
  ],
  introspection: true, // Enable introspection
});

async function startServer() {
  await server.start();
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  const PORT = process.env.PORT || 4000;
  const serverInstance = app.listen({ port: PORT }, () =>
    console.log(`Server ready at http://localhost:${PORT}/graphql`)
  );

  const shutdown = () => {
    serverInstance.close(() => {
      console.log('Server closed');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('Error starting server:', err.message);
  process.exit(1);
});