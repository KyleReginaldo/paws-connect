import z from 'zod';

const statusEnum = z.enum(['PENDING', 'ONGOING', 'COMPLETE', 'REJECTED', 'CANCELLED']);

// Schema for bank account and e-wallet objects
const paymentAccountSchema = z.object({
  label: z.string().min(1, 'Label is required').max(50, 'Label must be less than 50 characters'),
  account_number: z.string().min(1, 'Account number is required').max(100, 'Account number must be less than 100 characters'),
  qr_code: z.string().url('QR code must be a valid URL').optional().nullable(),
});

export const createFundraisingSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be less than 100 characters'),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters'),
  purpose: z
    .string()
    .min(5, 'Purpose must be at least 5 characters')
    .max(200, 'Purpose must be less than 200 characters')
    .optional(),
  target_amount: z
    .number()
    .min(100, 'Target amount must be at least ₱100')
    .max(10000000, 'Target amount cannot exceed ₱10,000,000'),
  created_by: z.string().min(1, 'User ID is required'),
  images: z.array(z.string()).optional(),
  status: statusEnum.optional().default('PENDING'),
  end_date: z
    .string()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  facebook_link: z
    .string()
    .optional()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => val === null || val === undefined || z.string().url().safeParse(val).success,
      'Invalid Facebook URL',
    ),
  qr_code: z
    .string()
    .optional()
    .transform((val) => (val === '' ? null : val)),
  bank_accounts: z.array(paymentAccountSchema).max(10, 'Maximum 10 bank accounts allowed').optional(),
  e_wallets: z.array(paymentAccountSchema).max(10, 'Maximum 10 e-wallets allowed').optional(),
  links: z.array(z.string().url('Each link must be a valid URL')).max(10, 'Maximum 10 links allowed').optional(),
  // Note: raised_amount is NOT included in create schema - it starts at 0 and is updated via donations
});

export const updateFundraisingSchema = z.object({
  title: z
    .string()
    .min(2, 'Title must be at least 2 characters')
    .max(100, 'Title must be less than 100 characters')
    .optional(),
  description: z
    .string()
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  purpose: z
    .string()
    .min(5, 'Purpose must be at least 5 characters')
    .max(200, 'Purpose must be less than 200 characters')
    .optional(),
  target_amount: z
    .number()
    .min(100, 'Target amount must be at least ₱100')
    .max(10000000, 'Target amount cannot exceed ₱10,000,000')
    .optional(),
  raised_amount: z.number().min(0, 'Raised amount cannot be negative').optional(),
  status: statusEnum.optional(),
  images: z.array(z.string()).optional(),
  end_date: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .optional(),
  facebook_link: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .refine(
      (val) => val === null || val === undefined || z.string().url().safeParse(val).success,
      'Invalid Facebook URL',
    )
    .optional(),
  qr_code: z
    .string()
    .transform((val) => (val === '' ? null : val))
    .optional(),
  bank_accounts: z.array(paymentAccountSchema).max(10, 'Maximum 10 bank accounts allowed').optional(),
  e_wallets: z.array(paymentAccountSchema).max(10, 'Maximum 10 e-wallets allowed').optional(),
  links: z.array(z.string().url('Each link must be a valid URL')).max(10, 'Maximum 10 links allowed').optional(),
});

export type CreateFundraisingDto = z.infer<typeof createFundraisingSchema>;
export type UpdateFundraisingDto = z.infer<typeof updateFundraisingSchema>;
export type PaymentAccount = z.infer<typeof paymentAccountSchema>;
