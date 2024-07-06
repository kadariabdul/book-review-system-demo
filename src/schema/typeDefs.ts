import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type Query {
    getBooks: [Book!]!
    getBook(id: Int!): Book
    getReviews(bookId: Int!, filter: ReviewFilterInput, skip: Int, take: Int): [Review!]!
    searchBooks(filter: BookFilterInput, skip: Int, take: Int): [Book!]!
    getMyReviews(skip: Int, take: Int): [Review!]!
  }
  
  type Mutation {
    login(email: String!, password: String!): AuthPayload
    register(name:String!, email: String!, password: String!): User
    addBook(title: String!, author: String!, publishedYear: Int!): Book
    addReview(bookId: Int!, rating: Int!, comment: String!): Review
    updateReview(id: Int!, rating: Int, comment: String): Review
    deleteReview(id: Int!): Review
  }

  type User {
    id: Int!
    name: String!
    email: String!
    reviews: [Review!]!
  }

  type Book {
    id: Int!
    title: String!
    author: String!
    publishedYear: Int!
    reviews: [Review!]!
  }

  type Review {
    id: ID!
    rating: Int!
    comment: String!
    book: Book!
    user: User!
    createdAt: String!
    updatedAt: String!
  }

  type AuthPayload {
    accessToken: String
    refreshToken: String
    user: User
  }

  input BookFilterInput {
    title: String
    author: String
  }
  input ReviewFilterInput {
    rating: Int
    comment: String
  }
`;

export default typeDefs;
