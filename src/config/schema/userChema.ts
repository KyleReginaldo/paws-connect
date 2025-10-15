// schemas/userSchema.ts
import { z } from 'zod';

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
  phone_number: z.string(),
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
  phone_number: z.string().optional(),
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
