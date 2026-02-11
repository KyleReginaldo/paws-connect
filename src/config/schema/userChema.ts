// schemas/userSchema.ts
import { z } from 'zod';

// Phone number regex patterns
const PHONE_REGEX = /^(\+?63|0)?9\d{9}$/; // Philippine: 09XXXXXXXXX or +639XXXXXXXXX or 639XXXXXXXXX
const INTERNATIONAL_PHONE_REGEX = /^\+\d{1,3}\d{6,14}$/; // International: +[country code][6-14 digits]

export const createUserSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .refine((username) => !/\s/.test(username), {
      message: 'Username cannot contain spaces. Use format like "KyleReginaldo" instead of "Kyle Reginaldo"'
    }),
  email: z.email(),
  status: z.string().optional(),
  role: z.number().refine((role) => role === 1 || role === 3, {
    message: 'Role must be either 1 (Admin) or 3 (User)'
  }),
  phone_number: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .refine((phone) => {
      // Remove all non-digit characters except +
      const cleaned = phone.replace(/[^\d+]/g, '');
      // Check if it matches Philippine format or international format
      return PHONE_REGEX.test(cleaned) || INTERNATIONAL_PHONE_REGEX.test(cleaned);
    }, {
      message: 'Invalid phone number format. Use Philippine format (09XXXXXXXXX or +639XXXXXXXXX) or international format (+[country code][number])'
    }),
  password: z.string(),
  created_by: z.uuid().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
export const updateUserSchema = z.object({
  username: z.string()
    .min(1, 'Username is required')
    .refine((username) => !/\s/.test(username), {
      message: 'Username cannot contain spaces. Use format like "KyleReginaldo" instead of "Kyle Reginaldo"'
    })
    .optional(),
  email: z.email().optional(),
  phone_number: z.string()
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number is too long')
    .refine((phone) => {
      // Remove all non-digit characters except +
      const cleaned = phone.replace(/[^\d+]/g, '');
      // Check if it matches Philippine format or international format
      return PHONE_REGEX.test(cleaned) || INTERNATIONAL_PHONE_REGEX.test(cleaned);
    }, {
      message: 'Invalid phone number format. Use Philippine format (09XXXXXXXXX or +639XXXXXXXXX) or international format (+[country code][number])'
    })
    .optional(),
  profile_image_link: z.url('Invalid URL format').or(z.literal('')).optional(),
  house_images: z.array(z.url('Invalid URL format')).max(10, 'Too many house images').optional(),
  payment_method: z.string().max(50, 'Payment method name too long').optional(),
  status: z.enum(['PENDING','SEMI_VERIFIED','FULLY_VERIFIED','INDEFINITE']).optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  role: z.number().refine((role) => role === 1 || role === 3, {
    message: 'Role must be either 1 (Admin) or 3 (User)'
  }).optional(),
  violations: z.array(z.string()).max(200, 'Too many violations').optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: 'At least one field must be provided for update',
});

export type UpdateUserDto = z.infer<typeof updateUserSchema>;
