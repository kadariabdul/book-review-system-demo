import Joi from 'joi';

const registerSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
});

const getBookSchema = Joi.object({
  id: Joi.number().integer().required(),
});

const getReviewsSchema = Joi.object({
  bookId: Joi.number().integer().required(),
});

const addBookSchema = Joi.object({
  title: Joi.string().required(),
  author: Joi.string().required(),
  publishedYear: Joi.number().required(),
});

const addReviewSchema = Joi.object({
  bookId: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  comment: Joi.string().required(),
});

const updateReviewSchema = Joi.object({
  id: Joi.number().integer().required(),
  rating: Joi.number().integer().min(1).max(5),
  comment: Joi.string(),
}).or('rating', 'text');

const deleteReviewSchema = Joi.object({
  id: Joi.number().integer().required(),
});

const getReviewsSchemaFilter = Joi.object({
  bookId: Joi.number().integer().required(),
  filter: Joi.object({
    rating: Joi.number().integer(),
    text: Joi.string(),
  }),
  skip: Joi.number().integer(),
  take: Joi.number().integer(),
});
const getMyReviewsSchema = Joi.object({
  skip: Joi.number().integer(),
  take: Joi.number().integer(),
});
export {
  getMyReviewsSchema,
  getReviewsSchemaFilter,
  registerSchema,
  loginSchema,
  getBookSchema,
  getReviewsSchema,
  addBookSchema,
  addReviewSchema,
  updateReviewSchema,
  deleteReviewSchema,
};
