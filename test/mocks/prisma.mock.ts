import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

const prisma = new PrismaClient();

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => mockDeep<PrismaClient>())
}));

beforeEach(() => {
    mockReset(prismaMock);
});

export const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;
