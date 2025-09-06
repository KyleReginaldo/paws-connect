// schemas/userSchema.ts
import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string().min(1),
  email: z.email(),
  status: z.string().optional(),
  role: z.number(),
  phone_number: z.string().regex(/^\d{11}$/, 'Phone number must be exactly 11 digits'),
  password: z.string().optional(),
});

export type CreateUserDto = z.infer<typeof createUserSchema>;
