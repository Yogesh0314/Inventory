const { z } = require('zod');

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

const registerSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['admin', 'staff']).optional(),
});

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  description: z.string().optional(),
  category: z.string().optional(),
  price: z.number().min(0, 'Price must be 0 or greater'),
  quantity: z.number().int().min(0, 'Quantity must be 0 or greater').optional(),
  minLimit: z.number().int().min(0, 'Minimum limit must be 0 or greater').optional(),
  supplierId: z.string().optional(),
});

const supplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactName: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  address: z.string().optional(),
});

const transactionSchema = z.object({
  type: z.enum(['purchase', 'sale']),
  productId: z.string().min(1, 'Product ID is required'),
  quantity: z.number().int().positive('Quantity must be greater than 0'),
  price: z.number().min(0, 'Price must be 0 or greater'),
  notes: z.string().optional(),
});

module.exports = {
  loginSchema,
  registerSchema,
  productSchema,
  supplierSchema,
  transactionSchema,
};
