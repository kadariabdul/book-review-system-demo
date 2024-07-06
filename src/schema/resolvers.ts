import { hash, compare } from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { authMiddleware, authMiddlewareRefresh } from '../middleware/auth';
import { ACCESS_TOKEN_EXPIRY, APP_SECRET, APP_SECRET_REFRESH, REFRESH_TOKEN_EXPIRY } from '../auth';
import { registerSchema, loginSchema, getBookSchema, getReviewsSchema, addBookSchema, addReviewSchema, updateReviewSchema, deleteReviewSchema, getReviewsSchemaFilter, getMyReviewsSchema } from './validators';
import CustomError from '../customError';
const resolvers = {
    Query: {
        getBooks: async (parent: any, args: any, context: { prisma: { book: { findMany: () => any; }; }; }) => {
            try {
                return context.prisma.book.findMany();
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to getBooks', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
        getReviews: async (parent: any, { bookId, filter, skip, take }: any, context: { prisma: { review: { findMany: (arg0: { where: any; skip: any; take: any; }) => any; }; }; }) => {
            try {
                const { error } = getReviewsSchemaFilter.validate({ bookId, filter, skip, take });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const where: any = { bookId };
                if (filter) {
                    if (filter.rating) {
                        where.rating = filter.rating;
                    }
                    if (filter.comment) {
                        where.comment = { contains: filter.text, mode: 'insensitive' };
                    }
                }

                const reviews = await context.prisma.review.findMany({
                    where,
                    skip: skip ?? 0,
                    take: take ?? 10,
                });

                return reviews;
            } catch (error) {
                throw new CustomError('Failed to getReviews', 500, 'INTERNAL_SERVER_ERROR');
            }
        },
        getMyReviews: authMiddleware(async (parent: any, { skip, take }: any, context: { prisma: { review: { findMany: (arg0: { where: any; skip: any; take: any; }) => any; }; }; } | any) => {
            try {
                const userId = context.userId;
                if (!userId) {
                    throw new CustomError('User not authenticated', 401, 'UNAUTHORIZED');
                }
                const { error } = getMyReviewsSchema.validate({ skip, take });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const reviews = await context.prisma.review.findMany({
                    where: { userId },
                    skip: skip ?? 0,
                    take: take ?? 10,
                });
                return reviews;
            } catch (error) {
                throw new CustomError(error instanceof CustomError ? error.message : 'Failed to getReviews', error instanceof CustomError ? error.statusCode : 500, error instanceof CustomError ? error.code : 'INTERNAL_SERVER_ERROR');
            }
        }),        
        searchBooks: async (parent: any, { filter, skip, take }: any, context: { prisma: { book: { findMany: (arg0: { where: {}; skip: any; take: any; }) => any; }; }; }) => {
            try {
                const where: any = {};
                if (filter) {
                    if (filter.title) {
                        where.title = { contains: filter.title, mode: 'insensitive' };
                    }
                    if (filter.author) {
                        where.author = { contains: filter.author, mode: 'insensitive' };
                    }
                }
                const books = await context.prisma.book.findMany({
                    where,
                    skip: skip ?? 0,
                    take: take ?? 10,
                });

                return books;
            } catch (error) {
                throw new CustomError('Failed to searchBooks', 500, 'INTERNAL_SERVER_ERROR');
            }
        },
        getBook: async (parent: any, { id }: any, context: any) => {
            try {
                const { error } = getBookSchema.validate({ id });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const book = await context.prisma.book.findUnique({ where: { id } });
                if (!book) {
                    throw new CustomError('Book not found', 404, 'NOT_FOUND');
                }
                return book;
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to getBook', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
    },
    Mutation: {
        register:async (parent: any, { name, email, password }: any, context: {
            prisma: {
                user: {
                    findUnique(arg0: { where: { email: any; }; }): unknown; create: (arg0: { data: { name: string, email: string; password: string; }; }) => any;
                };
            };
        }) => {
            try {
                const { error } = registerSchema.validate({ name, email, password });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const userExits = await context.prisma.user.findUnique({ where: { email } });
                if (userExits) {
                    throw new CustomError('Email Already Exits', 400, 'INVALID_USER');
                }
                const hashedPassword = await hash(password, 10);
                const user = await context.prisma.user.create({
                    data: { name, email, password: hashedPassword },
                });
                return user;
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to register error', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
        login: async (parent: any, { email, password }: any, context: { prisma: { user: { findUnique: (arg0: { where: { email: any; }; }) => any; }; }; }) => {
            try {
                const { error } = loginSchema.validate({ email, password });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const user = await context.prisma.user.findUnique({ where: { email } });
                if (!user) {
                    throw new CustomError('No such user found', 404, 'NOT_FOUND');
                }
                const valid = await compare(password, user.password);
                if (!valid) {
                    throw new CustomError('Invalid password', 401, 'UNAUTHORIZED');
                }
                const token = jwt.sign({ ...user }, APP_SECRET, {
                    expiresIn: ACCESS_TOKEN_EXPIRY
                });
                const refresh = jwt.sign({ ...user }, APP_SECRET_REFRESH, {
                    expiresIn: REFRESH_TOKEN_EXPIRY
                });
                return { accessToken: token, refreshToken: refresh, user };
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to login', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
        getNewAccessToken: authMiddlewareRefresh(async (parent: any, { }: any, context: { prisma:  { user: { findUnique: (arg0: { where: { id: any; }; }) => any; }; }; } | any) => {
            try {
                const userId = context.userId;
                const user = await context.prisma.user.findUnique({ where: { id: userId } });
                if (!user) {
                    throw new CustomError('No such user found', 404, 'NOT_FOUND');
                }
                const token = jwt.sign({ ...user }, APP_SECRET, {
                    expiresIn: ACCESS_TOKEN_EXPIRY
                });
                return { accessToken: token, user };
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to getNewAccessToken', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        }),
        addBook: authMiddleware(async (parent: any, { title, author, publishedYear }: any, context: { prisma: { book: { create: (arg0: { data: { title: any; author: any; }; }) => any; }; }; } | any) => {
            try {
                const userId = context.userId;
                const { error } = addBookSchema.validate({ title, author, publishedYear });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                return context.prisma.book.create({ data: { title, author, publishedYear } });
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to addBook', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        }),
        addReview: authMiddleware(async (parent: any, { bookId, rating, comment }: any, context: any) => {
            try {
                const { error } = addReviewSchema.validate({ bookId, rating, comment });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const userId = context.userId;
                const review = await context.prisma.review.findUnique({ where: { bookId, userId } });
                if (review) {
                    throw new CustomError('Already review to this book', 400, 'INVALID_REQUEST');
                }
                return context.prisma.review.create({
                    data: { bookId, rating, comment, userId },
                });
            } catch (error) {
                console.log('Error:', error);
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to addReview', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        }),
        updateReview: authMiddleware(async (parent: any, { id, rating, comment }: any, context: { prisma: { review: { update: (arg0: { where: { id: any; }; data: { rating: any; text: any; }; }) => any; }; }; } | any) => {
            try {
                const userId = context.userId;
                const { error } = updateReviewSchema.validate({ id, rating, comment });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const review = await context.prisma.review.findUnique({ where: { id, userId } });
                if (!review) {
                    throw new CustomError('Review not found', 404, 'NOT_FOUND');
                }
                return context.prisma.review.update({
                    where: { id, userId },
                    data: { rating, comment },
                });
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to updateReview', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        }),
        deleteReview: authMiddleware(async (parent: any, { id }: any, context: { prisma: { review: { delete: (arg0: { where: { id: any; }; }) => any; }; }; } | any) => {
            try {
                const userId = context.userId;
                const { error } = deleteReviewSchema.validate({ id });
                if (error) {
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                const review = await context.prisma.review.findUnique({ where: { id, userId } });
                if (!review) {
                    throw new CustomError('Review not found', 404, 'NOT_FOUND');
                }
                return context.prisma.review.delete({ where: { id, userId } });
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to deleteReview', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        }),
    },
    User: {
        reviews: (parent: { id: any; }, args: any, context: { prisma: { review: { findMany: (arg0: { where: { userId: any; }; }) => any; }; }; }) => {
            try {
                return context.prisma.review.findMany({ where: { userId: parent.id } });
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to reviews', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
    },
    Book: {
        reviews: (parent: { id: any; }, args: any, context: { prisma: { review: { findMany: (arg0: { where: { bookId: any; }; }) => any; }; }; }) => {
            try {
                const { error } = getBookSchema.validate({ id: parent.id });
                if (error) {
                    console.log('Validation error:', error.details[0].message);
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                return context.prisma.review.findMany({ where: { bookId: parent.id } });
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to reviews', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
    },
    Review: {
        book: (parent: { bookId: any; }, args: any, context: { prisma: { book: { findUnique: (arg0: { where: { id: any; }; }) => any; }; }; }) => {
            try {
                const { error } = getBookSchema.validate({ id: parent.bookId });
                if (error) {
                    console.log('Validation error:', error.details[0].message);
                    throw new CustomError(error.details[0].message, 400, 'BAD_USER_INPUT');
                }
                return context.prisma.book.findUnique({ where: { id: parent.bookId } });
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to book', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
        user: (parent: { userId: any; }, args: any, context: { prisma: { user: { findUnique: (arg0: { where: { id: any; }; }) => any; }; }; }) => {
            try {
                return context.prisma.user.findUnique({ where: { id: parent.userId } });
            } catch (error) {
                if (error instanceof CustomError) {
                    throw new CustomError(error.message, error.statusCode, error.code ?? '', error.stack ?? '');
                } else {
                    throw new CustomError('Failed to user', 500, 'INTERNAL_SERVER_ERROR');
                }
            }
        },
    },
};

export default resolvers;
