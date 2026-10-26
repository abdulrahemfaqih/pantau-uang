import { pgTable, text, timestamp, varchar, bigint, boolean, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Tabel users
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 2. Tabel accounts (Rekening Keuangan)
export const accounts = pgTable("accounts", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<"BANK" | "EWALLET" | "CASH" | "CREDIT_CARD">(),
  initialBalance: bigint("initial_balance", { mode: "number" }).default(0).notNull(),
  currentBalance: bigint("current_balance", { mode: "number" }).default(0).notNull(),
  color: varchar("color", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  excludeFromTotal: boolean("exclude_from_total").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 3. Tabel categories (Kategori Transaksi)
export const categories = pgTable("categories", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  type: varchar("type", { length: 20 }).notNull().$type<"INCOME" | "EXPENSE">(),
  color: varchar("color", { length: 20 }).notNull(),
  icon: varchar("icon", { length: 50 }).notNull(),
  isSystem: boolean("is_system").default(false).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

// 4. Tabel transactions (Transaksi Keuangan)
export const transactions = pgTable(
  "transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull().$type<"INCOME" | "EXPENSE" | "TRANSFER">(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    date: timestamp("date", { withTimezone: true }).notNull(),
    note: text("note"),
    accountId: uuid("account_id").notNull().references(() => accounts.id, { onDelete: "cascade" }),
    toAccountId: uuid("to_account_id").references(() => accounts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    parentTransferId: uuid("parent_transfer_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_transactions_user_date").on(table.userId, table.date),
    index("idx_transactions_user_type").on(table.userId, table.type),
  ]
);

// Relasi Drizzle
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  categories: many(categories),
  transactions: many(transactions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions, { relationName: "accountTransactions" }),
  incomingTransfers: many(transactions, { relationName: "transferTargetAccount" }),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  user: one(users, {
    fields: [categories.userId],
    references: [users.id],
  }),
  transactions: many(transactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  user: one(users, {
    fields: [transactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
    relationName: "accountTransactions",
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
    relationName: "transferTargetAccount",
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  parentTransfer: one(transactions, {
    fields: [transactions.parentTransferId],
    references: [transactions.id],
    relationName: "transferAdminExpense",
  }),
}));

// Tipe Data TypeScript
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;

export type Account = typeof accounts.$inferSelect;
export type NewAccount = typeof accounts.$inferInsert;

export type Category = typeof categories.$inferSelect;
export type NewCategory = typeof categories.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
