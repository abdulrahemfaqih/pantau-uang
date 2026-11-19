import { pgTable, text, timestamp, varchar, bigint, boolean, uuid, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// 1. Tabel users
export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  isDriver: boolean("is_driver").default(false).notNull(),
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
    excludeFromStats: boolean("exclude_from_stats").default(false).notNull(),
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
  savingsGoals: many(savingsGoals),
  savingsMembers: many(savingsMembers),
  savingsTransactions: many(savingsTransactions),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
  transactions: many(transactions, { relationName: "accountTransactions" }),
  incomingTransfers: many(transactions, { relationName: "transferTargetAccount" }),
  savingsFrom: many(savingsTransactions, { relationName: "savingsAccountFrom" }),
  savingsTo: many(savingsTransactions, { relationName: "savingsAccountTo" }),
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

// 5. Tabel recurring_transactions (Transaksi Berulang)
export const recurringTransactions = pgTable(
  "recurring_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull().$type<"INCOME" | "EXPENSE" | "TRANSFER">(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    accountId: uuid("account_id")
      .notNull()
      .references(() => accounts.id, { onDelete: "cascade" }),
    toAccountId: uuid("to_account_id").references(() => accounts.id, { onDelete: "cascade" }),
    categoryId: uuid("category_id").references(() => categories.id, { onDelete: "set null" }),
    note: text("note"),
    frequency: varchar("frequency", { length: 20 })
      .notNull()
      .$type<"DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY">(),
    startDate: timestamp("start_date", { withTimezone: true }).notNull(),
    nextRunDate: timestamp("next_run_date", { withTimezone: true }).notNull(),
    lastRunDate: timestamp("last_run_date", { withTimezone: true }),
    isActive: boolean("is_active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_recurring_user").on(table.userId),
    index("idx_recurring_active_next").on(table.isActive, table.nextRunDate),
  ]
);

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one }) => ({
  user: one(users, {
    fields: [recurringTransactions.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [recurringTransactions.accountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    fields: [recurringTransactions.toAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [recurringTransactions.categoryId],
    references: [categories.id],
  }),
}));

// 6. Tabel debts (Hutang & Piutang)
export const debts = pgTable(
  "debts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull().$type<"DEBT" | "LOAN">(), // DEBT = Hutang saya, LOAN = Piutang saya
    personName: text("person_name").notNull(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    remainingAmount: bigint("remaining_amount", { mode: "number" }).notNull(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    dueDate: timestamp("due_date", { withTimezone: true }),
    status: varchar("status", { length: 20 })
      .default("UNPAID")
      .notNull()
      .$type<"UNPAID" | "PARTIAL" | "PAID">(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_debts_user").on(table.userId),
    index("idx_debts_user_status").on(table.userId, table.status),
  ]
);

export const debtsRelations = relations(debts, ({ one, many }) => ({
  user: one(users, {
    fields: [debts.userId],
    references: [users.id],
  }),
  account: one(accounts, {
    fields: [debts.accountId],
    references: [accounts.id],
  }),
  payments: many(debtPayments),
}));

// 7. Tabel debt_payments (Riwayat Pembayaran Hutang/Piutang)
export const debtPayments = pgTable(
  "debt_payments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    debtId: uuid("debt_id")
      .notNull()
      .references(() => debts.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: bigint("amount", { mode: "number" }).notNull(),
    accountId: uuid("account_id").references(() => accounts.id, { onDelete: "set null" }),
    date: timestamp("date", { withTimezone: true }).notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_debt_payments_debt").on(table.debtId),
    index("idx_debt_payments_user").on(table.userId),
  ]
);

export const debtPaymentsRelations = relations(debtPayments, ({ one }) => ({
  debt: one(debts, {
    fields: [debtPayments.debtId],
    references: [debts.id],
  }),
  account: one(accounts, {
    fields: [debtPayments.accountId],
    references: [accounts.id],
  }),
  user: one(users, {
    fields: [debtPayments.userId],
    references: [users.id],
  }),
}));

// 8. Tabel savings_goals (Target Tabungan)
export const savingsGoals = pgTable(
  "savings_goals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    targetAmount: bigint("target_amount", { mode: "number" }).notNull(),
    currentAmount: bigint("current_amount", { mode: "number" }).default(0).notNull(),
    targetDate: timestamp("target_date", { withTimezone: true }),
    color: varchar("color", { length: 20 }).default("#09090B").notNull(),
    icon: varchar("icon", { length: 50 }).default("PiggyBank").notNull(),
    isShared: boolean("is_shared").default(false).notNull(),
    inviteCode: varchar("invite_code", { length: 20 }).unique(),
    hasYield: boolean("has_yield").default(false).notNull(),
    yieldNote: text("yield_note"),
    totalYieldEarned: bigint("total_yield_earned", { mode: "number" }).default(0).notNull(),
    status: varchar("status", { length: 20 })
      .default("ACTIVE")
      .notNull()
      .$type<"ACTIVE" | "COMPLETED" | "CANCELLED">(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_savings_goals_user").on(table.userId),
    index("idx_savings_goals_invite").on(table.inviteCode),
  ]
);

export const savingsGoalsRelations = relations(savingsGoals, ({ one, many }) => ({
  owner: one(users, {
    fields: [savingsGoals.userId],
    references: [users.id],
  }),
  members: many(savingsMembers),
  transactions: many(savingsTransactions),
}));

// 9. Tabel savings_members (Anggota Tabungan Bersama)
export const savingsMembers = pgTable(
  "savings_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    savingsGoalId: uuid("savings_goal_id")
      .notNull()
      .references(() => savingsGoals.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 20 }).default("MEMBER").notNull().$type<"OWNER" | "MEMBER">(),
    joinedAt: timestamp("joined_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_savings_members_goal").on(table.savingsGoalId),
    index("idx_savings_members_user").on(table.userId),
  ]
);

export const savingsMembersRelations = relations(savingsMembers, ({ one }) => ({
  goal: one(savingsGoals, {
    fields: [savingsMembers.savingsGoalId],
    references: [savingsGoals.id],
  }),
  user: one(users, {
    fields: [savingsMembers.userId],
    references: [users.id],
  }),
}));

// 10. Tabel savings_transactions (Riwayat Setor & Tarik Tabungan)
export const savingsTransactions = pgTable(
  "savings_transactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    savingsGoalId: uuid("savings_goal_id")
      .notNull()
      .references(() => savingsGoals.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: varchar("type", { length: 20 }).notNull().$type<"DEPOSIT" | "WITHDRAW" | "YIELD">(),
    amount: bigint("amount", { mode: "number" }).notNull(),
    fromAccountId: uuid("from_account_id").references(() => accounts.id, { onDelete: "set null" }),
    toAccountId: uuid("to_account_id").references(() => accounts.id, { onDelete: "set null" }),
    note: text("note"),
    date: timestamp("date", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_savings_tx_goal").on(table.savingsGoalId),
    index("idx_savings_tx_user").on(table.userId),
  ]
);

export const savingsTransactionsRelations = relations(savingsTransactions, ({ one }) => ({
  goal: one(savingsGoals, {
    fields: [savingsTransactions.savingsGoalId],
    references: [savingsGoals.id],
  }),
  user: one(users, {
    fields: [savingsTransactions.userId],
    references: [users.id],
  }),
  fromAccount: one(accounts, {
    fields: [savingsTransactions.fromAccountId],
    references: [accounts.id],
    relationName: "savingsAccountFrom",
  }),
  toAccount: one(accounts, {
    fields: [savingsTransactions.toAccountId],
    references: [accounts.id],
    relationName: "savingsAccountTo",
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

export type RecurringTransaction = typeof recurringTransactions.$inferSelect;
export type NewRecurringTransaction = typeof recurringTransactions.$inferInsert;

export type Debt = typeof debts.$inferSelect;
export type NewDebt = typeof debts.$inferInsert;

export type DebtPayment = typeof debtPayments.$inferSelect;
export type NewDebtPayment = typeof debtPayments.$inferInsert;

export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type NewSavingsGoal = typeof savingsGoals.$inferInsert;

export type SavingsMember = typeof savingsMembers.$inferSelect;
export type NewSavingsMember = typeof savingsMembers.$inferInsert;

export type SavingsTransaction = typeof savingsTransactions.$inferSelect;
export type NewSavingsTransaction = typeof savingsTransactions.$inferInsert;
