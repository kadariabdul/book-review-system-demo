import express, { Application } from 'express';
import { ApolloServer } from 'apollo-server-express';
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core';
import http from 'http';
import { makeExecutableSchema } from '@graphql-tools/schema';
import typeDefs from './schema/typeDefs';
import resolvers from './schema/resolvers';

async function startApolloServer(typeDefs: any, resolvers: any) {
  const app: Application = express();
  const httpServer = http.createServer(app);
  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const server = new ApolloServer({
    schema,
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  });

  await server.start();
  server.applyMiddleware({ app: app as any, path: '/graphql' });

  await new Promise<void>(resolve => httpServer.listen({ port: 4000 }, resolve));
  console.log(`🚀 Server ready at http://localhost:4000/graphql`);
}

startApolloServer(typeDefs, resolvers);
