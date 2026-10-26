import { z } from "zod";

export const accountTypeSchema = z.enum(["BANK", "EWALLET", "CASH", "CREDIT_CARD"]);
export const transactionTypeSchema = z.enum(["INCOME", "EXPENSE", "TRANSFER"]);
export const categoryTypeSchema = z.enum(["INCOME", "EXPENSE"]);

// Skema Form / API Rekening
export const accountFormSchema = z.object({
  name: z.string().min(1, "Nama rekening wajib diisi").max(50, "Nama rekening maksimal 50 karakter"),
  type: accountTypeSchema,
  initialBalance: z.coerce.number().int("Nominal harus bilangan bulat").min(0, "Saldo awal tidak boleh negatif"),
  color: z.string().min(1, "Warna wajib dipilih"),
  icon: z.string().min(1, "Ikon wajib dipilih"),
  excludeFromTotal: z.boolean().default(false),
});

export type AccountFormValues = z.infer<typeof accountFormSchema>;

// Skema Form / API Kategori
export const categoryFormSchema = z.object({
  name: z.string().min(1, "Nama kategori wajib diisi").max(50, "Nama kategori maksimal 50 karakter"),
  type: categoryTypeSchema,
  color: z.string().min(1, "Warna wajib dipilih"),
  icon: z.string().min(1, "Ikon wajib dipilih"),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

// Skema Form / API Transaksi
export const transactionFormSchema = z
  .object({
    type: transactionTypeSchema,
    amount: z.coerce.number().int("Nominal harus bilangan bulat").positive("Nominal harus lebih dari 0"),
    date: z.coerce.date(),
    note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
    accountId: z.string().uuid("Rekening asal tidak valid"),
    toAccountId: z.string().uuid("Rekening tujuan tidak valid").optional().nullable(),
    categoryId: z.string().uuid("Kategori tidak valid").optional().nullable(),
    adminFee: z.coerce.number().int("Biaya admin harus bilangan bulat").min(0, "Biaya admin minimal 0").default(0),
  })
  .superRefine((data, ctx) => {
    if (data.type === "TRANSFER") {
      if (!data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rekening tujuan wajib dipilih untuk transfer",
          path: ["toAccountId"],
        });
      }
      if (data.accountId && data.toAccountId && data.accountId === data.toAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rekening tujuan tidak boleh sama dengan rekening asal",
          path: ["toAccountId"],
        });
      }
    } else {
      if (!data.categoryId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Kategori wajib dipilih",
          path: ["categoryId"],
        });
      }
    }
  });

export type TransactionFormValues = z.infer<typeof transactionFormSchema>;

// Skema Filter Transaksi
export const transactionFilterSchema = z.object({
  month: z.coerce.number().min(1).max(12).optional(),
  year: z.coerce.number().min(2000).max(2100).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  accountId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  type: transactionTypeSchema.optional(),
  search: z.string().optional(),
  minAmount: z.coerce.number().optional(),
  maxAmount: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(50).optional(),
  offset: z.coerce.number().min(0).default(0).optional(),
});

export type TransactionFilterParams = z.infer<typeof transactionFilterSchema>;
