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
  limit: z.coerce.number().min(1).max(1000).optional(),
  offset: z.coerce.number().min(0).optional(),
});

export type TransactionFilterParams = z.infer<typeof transactionFilterSchema>;

// Skema Transaksi Berulang
export const recurringFrequencySchema = z.enum(["DAILY", "WEEKLY", "MONTHLY", "YEARLY"]);
export type RecurringFrequency = z.infer<typeof recurringFrequencySchema>;

export const recurringFormSchema = z
  .object({
    type: transactionTypeSchema,
    amount: z.coerce.number().int("Nominal harus bilangan bulat").positive("Nominal harus lebih dari 0"),
    accountId: z.string().uuid("Rekening asal tidak valid"),
    toAccountId: z.string().uuid("Rekening tujuan tidak valid").optional().nullable(),
    categoryId: z.string().uuid("Kategori tidak valid").optional().nullable(),
    note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
    frequency: recurringFrequencySchema,
    startDate: z.coerce.date(),
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

export type RecurringFormValues = z.infer<typeof recurringFormSchema>;

// Skema Hutang & Piutang
export const debtTypeSchema = z.enum(["DEBT", "LOAN"]);
export type DebtType = z.infer<typeof debtTypeSchema>;

export const debtFormSchema = z.object({
  type: debtTypeSchema,
  personName: z.string().min(1, "Nama orang wajib diisi").max(100, "Nama maksimal 100 karakter"),
  amount: z.coerce.number().int("Nominal harus bilangan bulat").positive("Nominal harus lebih dari 0"),
  dueDate: z.coerce.date().optional().nullable(),
  note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
});

export type DebtFormValues = z.infer<typeof debtFormSchema>;

// Skema Pembayaran / Cicilan Hutang & Piutang
export const debtPaymentFormSchema = z.object({
  amount: z.coerce.number().int("Nominal harus bilangan bulat").positive("Nominal pembayaran harus lebih dari 0"),
  accountId: z.string().uuid("Rekening tidak valid").optional().nullable(),
  date: z.coerce.date(),
  note: z.string().max(255, "Catatan maksimal 255 karakter").optional().nullable(),
});

export type DebtPaymentFormValues = z.infer<typeof debtPaymentFormSchema>;

// Skema Form / API Order Driver (Ojol / COD)
export const driverOrderFormSchema = z
  .object({
    orderNumber: z.string().min(1, "Nomor order atau catatan wajib diisi").max(255, "Catatan maksimal 255 karakter"),
    driverIncome: z.coerce
      .number()
      .int("Nominal pendapatan harus bilangan bulat")
      .positive("Nominal pendapatan harus lebih dari 0"),
    codAmount: z.coerce
      .number()
      .int("Nominal tagihan COD harus bilangan bulat")
      .min(0, "Nominal tagihan COD minimal 0")
      .default(0),
    date: z.coerce.date(),
    appAccountId: z.string().uuid("Rekening aplikasi tidak valid"),
    cashAccountId: z.string().uuid("Rekening tunai tidak valid").optional().nullable(),
    incomeCategoryId: z.string().uuid("Kategori pendapatan tidak valid"),
  })
  .superRefine((data, ctx) => {
    if (data.codAmount > 0) {
      if (!data.cashAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rekening tunai fisik wajib dipilih jika terdapat tagihan COD",
          path: ["cashAccountId"],
        });
      }
      if (data.cashAccountId && data.cashAccountId === data.appAccountId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Rekening tunai tidak boleh sama dengan rekening aplikasi",
          path: ["cashAccountId"],
        });
      }
    }
  });

export type DriverOrderFormValues = z.infer<typeof driverOrderFormSchema>;

// Skema normalisasi payload API Order Driver (mendukung camelCase maupun snake_case)
export const driverOrderApiSchema = z.preprocess((input) => {
  if (typeof input !== "object" || input === null) return input;
  const raw = input as Record<string, unknown>;
  return {
    orderNumber: raw.orderNumber ?? raw.order_number ?? raw.notes ?? raw.note,
    driverIncome: raw.driverIncome ?? raw.driver_income,
    codAmount: raw.codAmount ?? raw.cod_amount ?? 0,
    date: raw.date,
    appAccountId: raw.appAccountId ?? raw.app_account_id,
    cashAccountId: raw.cashAccountId ?? raw.cash_account_id,
    incomeCategoryId: raw.incomeCategoryId ?? raw.income_category_id,
  };
}, driverOrderFormSchema);

