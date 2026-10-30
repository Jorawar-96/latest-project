import { z } from "zod";

export const credentialsSchema = z.object({
  email: z.email("Enter a valid email address.").trim().toLowerCase(),
  password: z.string().min(8, "Password must be at least 8 characters.").max(72),
});

export const adminAccessSchema = credentialsSchema.extend({ secretKey: z.string().min(1, "Secret key is required.") });

export const settingsSchema = z.object({
  paymentId: z.string().trim().min(1, "Payment ID is required.").max(120),
  minDeposit: z.coerce.number().finite().positive("Minimum deposit must be a positive number."),
});

export const qrImageSchema = z.instanceof(File)
  .refine((file) => file.size > 0, "Choose a QR image to upload.")
  .refine((file) => file.type.startsWith("image/"), "Choose a valid image file.")
  .refine((file) => file.size <= 5 * 1024 * 1024, "Image must be under 5 MB.");