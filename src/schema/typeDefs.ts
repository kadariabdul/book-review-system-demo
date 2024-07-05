import { gql } from 'graphql-tag';
import { DocumentNode } from 'graphql';

const typeDefs: DocumentNode = gql`
  type Query {
    hello: String
  }
`;

export default typeDefs;
