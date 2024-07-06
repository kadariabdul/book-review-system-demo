import resolvers from '../src/schema/resolvers';
import { prismaMock } from './mocks/prisma.mock';
import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import CustomError from '../src/customError';
import { getUserId } from '../src/auth';
import { create } from 'domain';

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
}));
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));
jest.mock('../src/auth', () => ({
  getUserId: jest.fn(),
}));

describe('Resolvers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  describe('Query getMyReviews test cases', () => {
    it('Success: should return reviews for authenticated user', async () => {
      const userId = 1;
      const reviews = [
        { id: 1, rating: 5, comment: 'Great book!', bookId: 1, userId, createdAt: new Date(), updatedAt: new Date()},
        { id: 2, rating: 4, comment: 'Good read.', bookId: 2, userId, createdAt: new Date(), updatedAt: new Date()},
      ];

      (getUserId as jest.Mock).mockReturnValue(userId);
      prismaMock.review.findMany.mockResolvedValue(reviews);

      const result = await resolvers.Query.getMyReviews(
        {},
        { skip: 0, take: 10 },
        { prisma: prismaMock, req: {} }
      );

      expect(result).toEqual(reviews);
      expect(prismaMock.review.findMany).toHaveBeenCalledWith({
        where: { userId },
        skip: 0,
        take: 10,
      });
    });

    it('Error: should throw an error if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockReturnValue(null);
      const expectedError = new CustomError('User not authenticated', 401, 'UNAUTHORIZED');

      await expect(
        resolvers.Query.getMyReviews({}, { skip: 0, take: 10 }, { prisma: prismaMock, req: {} })
      ).rejects.toThrow(expectedError);

      expect(prismaMock.review.findMany).not.toHaveBeenCalled();
    });

    it('Error: should throw validation error on invalid skip and take', async () => {
      const userId = 1;
      (getUserId as jest.Mock).mockReturnValue(userId);

      const expectedError = new CustomError('\"skip\" must be a number', 400, 'BAD_USER_INPUT');

      await expect(
        resolvers.Query.getMyReviews({}, { skip: 'invalid', take: 10 }, { prisma: prismaMock, req: {} })
      ).rejects.toThrow(expectedError);

      expect(prismaMock.review.findMany).not.toHaveBeenCalled();
    });

    it('Error: should throw an error if fetching reviews fails', async () => {
      const userId = 1;
      (getUserId as jest.Mock).mockReturnValue(userId);
      prismaMock.review.findMany.mockRejectedValue(new Error('Failed to fetch reviews'));

      const expectedError = new CustomError('Failed to getReviews', 500, 'INTERNAL_SERVER_ERROR');

      await expect(
        resolvers.Query.getMyReviews({}, { skip: 0, take: 10 }, { prisma: prismaMock, req: {} })
      ).rejects.toThrow(expectedError);

      expect(prismaMock.review.findMany).toHaveBeenCalledTimes(1);
    });
  });
  describe('Query getBooks test cases', () => {
    it('Success: should return all books', async () => {
      const books = [{ id: 1, title: 'Book 1', author: 'Author 1', publishedYear: 2024 }, { id: 2, title: 'Book 2', author: 'Author 2', publishedYear: 2024 }];
      prismaMock.book.findMany.mockResolvedValue(books);

      const result = await resolvers.Query.getBooks({}, {}, { prisma: prismaMock });

      expect(result).toEqual(books);
      expect(prismaMock.book.findMany).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw an error if getBooks fails', async () => {
      const expectedError = new CustomError('Failed to getBooks', 500, 'INTERNAL_SERVER_ERROR');
      prismaMock.book.findMany.mockRejectedValue(new Error('Failed to getBooks'));

      await expect(resolvers.Query.getBooks({}, {}, { prisma: prismaMock }))
        .rejects
        .toThrow(expectedError);

      expect(prismaMock.book.findMany).toHaveBeenCalledTimes(1);
    });
  });
  describe('Query getReviews test cases', () => {
    it('Success: should return reviews for a book', async () => {
      const reviews = [
        { id: 1, rating: 4, comment: 'Good book', bookId: 1, userId: 1, createdAt: new Date(), updatedAt: new Date() },
      ];
      prismaMock.review.findMany.mockResolvedValue(reviews);

      const result = await resolvers.Query.getReviews(
        {},
        { bookId: 1, filter: {}, skip: 0, take: 10 },
        { prisma: prismaMock }
      );

      expect(result).toEqual(reviews);
      expect(prismaMock.review.findMany).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw an internal server error if fetching reviews fails', async () => {
      const expectedError = new CustomError('Failed to getReviews', 500, 'INTERNAL_SERVER_ERROR');
      prismaMock.review.findMany.mockRejectedValue(new Error('Failed to fetch reviews'));

      await expect(
        resolvers.Query.getReviews(
          {},
          { bookId: 1, filter: {}, skip: 0, take: 10 },
          { prisma: prismaMock }
        )
      ).rejects.toThrow(expectedError);

      expect(prismaMock.review.findMany).toHaveBeenCalledTimes(1);
    });
  });
  describe('Query searchBooks test cases', () => {
    it('Success: should return books based on filter', async () => {
      const books = [{ id: 1, title: 'Book 1', author: 'Author 1', publishedYear: 2024 }];
      prismaMock.book.findMany.mockResolvedValue(books);

      const result = await resolvers.Query.searchBooks(
        {},
        { filter: { title: 'Book 1' }, skip: 0, take: 10 },
        { prisma: prismaMock }
      );

      expect(result).toEqual(books);
      expect(prismaMock.book.findMany).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw an internal server error if searching books fails', async () => {
      const expectedError = new CustomError('Failed to searchBooks', 500, 'INTERNAL_SERVER_ERROR');
      prismaMock.book.findMany.mockRejectedValue(new Error('Failed to search books'));

      await expect(
        resolvers.Query.searchBooks(
          {},
          { filter: { title: 'Book 1' }, skip: 0, take: 10 },
          { prisma: prismaMock }
        )
      ).rejects.toThrow(expectedError);

      expect(prismaMock.book.findMany).toHaveBeenCalledTimes(1);
    });
  });
  describe('Query searchBooks test cases', () => {
    it('Success: should return books based on filter', async () => {
      const books = [{ id: 1, title: 'Book 1', author: 'Author 1', publishedYear: 2024 }];
      prismaMock.book.findMany.mockResolvedValue(books);

      const result = await resolvers.Query.searchBooks(
        {},
        { filter: { title: 'Book 1' }, skip: 0, take: 10 },
        { prisma: prismaMock }
      );

      expect(result).toEqual(books);
      expect(prismaMock.book.findMany).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw an internal server error if searching books fails', async () => {
      const expectedError = new CustomError('Failed to searchBooks', 500, 'INTERNAL_SERVER_ERROR');
      prismaMock.book.findMany.mockRejectedValue(new Error('Failed to search books'));

      await expect(
        resolvers.Query.searchBooks(
          {},
          { filter: { title: 'Book 1' }, skip: 0, take: 10 },
          { prisma: prismaMock }
        )
      ).rejects.toThrow(expectedError);

      expect(prismaMock.book.findMany).toHaveBeenCalledTimes(1);
    });
  });
  describe('Mutation register user test cases', () => {
    it('Error: should throw validation error on invalid email', async () => {
      const user: any = { id: 1, name: 'john', email: 'test' };
      const invalidEmail = 'test';
      const expectedError = new CustomError("\"email\" must be a valid email", 400, 'BAD_USER_INPUT');
      await expect(
        resolvers.Mutation.register(
          {},
          { name: 'john', email: invalidEmail, password: 'password' },
          { prisma: prismaMock }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
    it('Error: should throw an error if email already exists', async () => {
      const existingUser: any = { id: 1, name: 'john', email: 'test@example.com' };
      prismaMock.user.findUnique.mockResolvedValue(existingUser);
      const expectedError = new CustomError('Email Already Exits', 400, 'INVALID_USER');
      await expect(
        resolvers.Mutation.register(
          {},
          { name: 'john', email: 'test@example.com', password: 'password' },
          { prisma: prismaMock }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.user.create).not.toHaveBeenCalled();
    });
    it('Success: register a new user', async () => {
      const user: any = { id: 1, name: 'john', email: 'test@example.com' };
      const hashedPassword = 'hashedPassword';
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue(user);

      (hash as jest.Mock).mockResolvedValue(hashedPassword);

      const result = await resolvers.Mutation.register(
        {},
        { name: 'john', email: 'test@example.com', password: 'password' },
        { prisma: prismaMock }
      );

      expect(result).toEqual(user);
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(prismaMock.user.create).toHaveBeenCalledTimes(1);
      expect(hash).toHaveBeenCalledWith('password', 10);
    });
  });
  describe('Mutation login user test cases', () => {
    it('should return tokens for valid user', async () => {
      const user: any = { id: 1, email: 'test@example.com', password: 'hashedPassword' };
      const accessToken = 'mockAccessToken';
      const refreshToken = 'mockRefreshToken';
      prismaMock.user.findUnique.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValueOnce(accessToken).mockReturnValueOnce(refreshToken);
      const result = await resolvers.Mutation.login(
        {},
        { email: 'test@example.com', password: 'password' },
        { prisma: prismaMock }
      );
      expect(result).toEqual({ accessToken, refreshToken, user });
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(compare).toHaveBeenCalledTimes(1);
      expect(jwt.sign).toHaveBeenCalledTimes(2);
    });
    it('should throw an error for invalid password', async () => {
      const user: any = { id: 1, email: 'test@example.com', password: 'hashedPassword' };
      const expectedError = new CustomError('Invalid password', 401, 'UNAUTHORIZED');
      prismaMock.user.findUnique.mockResolvedValue(user);
      (compare as jest.Mock).mockResolvedValue(false);
      await expect(
        resolvers.Mutation.login(
          {},
          { email: 'test@example.com', password: 'wrongPassword' },
          { prisma: prismaMock }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
      expect(compare).toHaveBeenCalledTimes(1);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });
  describe('Mutation addBook test cases', () => {
    it('Success: should add a new book', async () => {
      const book: any = { id: 1, title: 'New Book', author: 'Author', publishedYear: 2024 };
      const userId = 1;
      (getUserId as jest.Mock).mockReturnValue(userId);
      prismaMock.book.create.mockResolvedValue(book);

      const result = await resolvers.Mutation.addBook(
        {},
        { title: 'New Book', publishedYear: 2024, author: 'Author' },
        { prisma: prismaMock, req: {} }
      );

      expect(result).toEqual(book);
      expect(prismaMock.book.create).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw validation error on invalid book data', async () => {
      const invalidTitle = '';
      const expectedError = new CustomError("\"title\" is not allowed to be empty", 400, 'BAD_USER_INPUT');
      (getUserId as jest.Mock).mockReturnValue(1);

      await expect(
        resolvers.Mutation.addBook(
          {},
          { title: invalidTitle, publishedYear: 2024, author: 'Author' },
          { prisma: prismaMock, req: {} }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.book.create).not.toHaveBeenCalled();
    });
  });
  describe('Mutation addReview test cases', () => {
    it('Success: should add a new review', async () => {
      const review: any = { id: 1, bookId: 1, rating: 5, comment: 'Great book!', userId: 1 };
      const userId = 1;
      (getUserId as jest.Mock).mockReturnValue(userId);
      prismaMock.review.create.mockResolvedValue(review);

      const result = await resolvers.Mutation.addReview(
        {},
        { bookId: 1, rating: 5, comment: 'Great book!' },
        { prisma: prismaMock, req: {} }
      );

      expect(result).toEqual(review);
      expect(prismaMock.review.create).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw validation error on invalid review data', async () => {
      const invalidRating = 6;
      const expectedError = new CustomError("\"rating\" must be less than or equal to 5", 400, 'BAD_USER_INPUT');
      (getUserId as jest.Mock).mockReturnValue(1);

      await expect(
        resolvers.Mutation.addReview(
          {},
          { bookId: 1, rating: invalidRating, comment: 'Great book!' },
          { prisma: prismaMock, req: {} }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });

    it('Error: should throw an error if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockReturnValue(null);
      const expectedError = new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
      await expect(
        resolvers.Mutation.addReview(
          {},
          { bookId: 1, rating: 5, comment: 'Great book!' },
          { prisma: prismaMock, req: {} }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.review.create).not.toHaveBeenCalled();
    });
  });
  describe('Mutation updateReview test cases', () => {
    it('Success: should update a review', async () => {
      const review: any = { id: 1, bookId: 1, rating: 5, comment: 'Updated review', userId: 1 };
      const userId = 1;
      (getUserId as jest.Mock).mockReturnValue(userId);
      prismaMock.review.update.mockResolvedValue(review);

      const result = await resolvers.Mutation.updateReview(
        {},
        { id: 1, rating: 5, text: 'Updated review' },
        { prisma: prismaMock, req: {} }
      );

      expect(result).toEqual(review);
      expect(prismaMock.review.update).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw validation error on invalid review data', async () => {
      const invalidRating = 6;
      const expectedError = new CustomError("\"rating\" must be less than or equal to 5", 400, 'BAD_USER_INPUT');
      (getUserId as jest.Mock).mockReturnValue(1);

      await expect(
        resolvers.Mutation.updateReview(
          {},
          { id: 1, rating: invalidRating, text: 'Updated review' },
          { prisma: prismaMock, req: {} }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.review.update).not.toHaveBeenCalled();
    });

    it('Error: should throw an error if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockReturnValue(null);
      const expectedError = new CustomError('User not authenticated', 401, 'UNAUTHORIZED');

      await expect(
        resolvers.Mutation.updateReview(
          {},
          { id: 1, rating: 5, text: 'Updated review' },
          { prisma: prismaMock, req: {} }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.review.update).not.toHaveBeenCalled();
    });
  });
  describe('Mutation deleteReview test cases', () => {
    it('Success: should delete a review', async () => {
      const review: any = { id: 1, bookId: 1, rating: 5, text: 'Great book!', userId: 1 };
      const userId = 1;
      (getUserId as jest.Mock).mockReturnValue(userId);
      prismaMock.review.delete.mockResolvedValue(review);

      const result = await resolvers.Mutation.deleteReview(
        {},
        { id: 1 },
        { prisma: prismaMock, req: {} }
      );

      expect(result).toEqual(review);
      expect(prismaMock.review.delete).toHaveBeenCalledTimes(1);
    });

    it('Error: should throw validation error on invalid review ID', async () => {
      const invalidId = "invalid";
      const expectedError = new CustomError("\"id\" must be a number", 400, 'BAD_USER_INPUT');
      (getUserId as jest.Mock).mockReturnValue(1);

      await expect(
        resolvers.Mutation.deleteReview(
          {},
          { id: invalidId },
          { prisma: prismaMock, req: {} }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.review.delete).not.toHaveBeenCalled();
    });

    it('Error: should throw an error if user is not authenticated', async () => {
      (getUserId as jest.Mock).mockReturnValue(null);
      const expectedError = new CustomError('User not authenticated', 401, 'UNAUTHORIZED');

      await expect(
        resolvers.Mutation.deleteReview(
          {},
          { id: 1 },
          { prisma: prismaMock, req: {} }
        )
      ).rejects.toThrow(expectedError);
      expect(prismaMock.review.delete).not.toHaveBeenCalled();
    });
  });

});
