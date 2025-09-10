import z from 'zod';

export const createDonationSchema = z.object({
  amount: z
    .number()
    .min(1, 'Donation amount must be at least ₱1')
    .max(1000000, 'Donation amount cannot exceed ₱1,000,000'),
  fundraising: z
    .number()
    .positive('Fundraising ID must be a positive number'),
  donor: z
    .uuid('Donor must be a valid user ID')
    .optional(),
  message: z
    .string()
    .max(500, 'Message must be less than 500 characters')
    .optional(),
});

export const getDonationsQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .default('10')
    .transform((val) => parseInt(val, 10))
    .refine((val) => !isNaN(val) && val > 0 && val <= 100, {
      message: 'Limit must be a number between 1 and 100',
    }),
  fundraising: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .refine((val) => val === undefined || (!isNaN(val) && val > 0), {
      message: 'Fundraising ID must be a positive number',
    }),
});

export type CreateDonationDto = z.infer<typeof createDonationSchema>;
export type GetDonationsQueryDto = z.infer<typeof getDonationsQuerySchema>;
