// modules/finance/expense/expense.service.ts
import db from '../../../models';
import { CreateExpenseInput, UpdateExpenseInput } from './expense.schema';
import { applyTransaction } from '../automation.service';
import { TransactionType } from '../../../models/BankTransaction';

const { Expense, sequelize } = db;

export async function createExpense(data: CreateExpenseInput) {
  const transaction = await sequelize.transaction();
  try {
    const expense = await Expense.create(data, { transaction });

    // If marked as paid, deduct from bank account
    if (expense.isPaid) {
      await applyTransaction(
        expense.bankAccountId,
        TransactionType.EXPENSE,
        Number(expense.amount),
        `Expense: ${expense.description}`,
        expense.id,
        transaction,
      );
    }

    await transaction.commit();
    return expense;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateExpense(id: string, data: UpdateExpenseInput) {
  const transaction = await sequelize.transaction();
  try {
    const expense = await Expense.findByPk(id, { transaction });
    if (!expense) throw new Error('Expense not found');

    const wasPaid = expense.isPaid;
    const oldAmount = Number(expense.amount);
    const oldAccountId = expense.bankAccountId;

    await expense.update(data, { transaction });

    // Handle payment status changes
    if (data.isPaid !== undefined || data.amount !== undefined || data.bankAccountId !== undefined) {
      // If it was already paid, we need to reverse the old deduction first
      if (wasPaid) {
        await applyTransaction(
          oldAccountId,
          TransactionType.DEPOSIT,       // reverse expense: deposit the old amount back
          oldAmount,
          `Reversal: ${expense.description} (update)`,
          expense.id,
          transaction,
        );
      }

      // If now paid, apply new deduction
      if (expense.isPaid) {
        await applyTransaction(
          expense.bankAccountId,
          TransactionType.EXPENSE,
          Number(expense.amount),
          `Expense: ${expense.description}`,
          expense.id,
          transaction,
        );
      }
    }

    await transaction.commit();
    return expense;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteExpense(id: string) {
  const transaction = await sequelize.transaction();
  try {
    const expense = await Expense.findByPk(id, { transaction });
    if (!expense) throw new Error('Expense not found');

    if (expense.isPaid) {
      // Reverse the deduction
      await applyTransaction(
        expense.bankAccountId,
        TransactionType.DEPOSIT,
        Number(expense.amount),
        `Reversal: Deleted expense "${expense.description}"`,
        expense.id,
        transaction,
      );
    }

    await expense.destroy({ transaction });
    await transaction.commit();
    return { message: 'Expense deleted' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}