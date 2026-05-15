import db from '../../../models';
import { CreateIncomeInput, UpdateIncomeInput } from './income.schema';
import { applyTransaction } from '../automation.service';
import { TransactionType } from '../../../models/BankTransaction';

const { Income, sequelize } = db;

export async function createIncome(data: CreateIncomeInput) {
  const transaction = await sequelize.transaction();
  try {
    const income = await Income.create(data, { transaction });
    await applyTransaction(
      income.bankAccountId,
      TransactionType.INCOME,
      Number(income.amount),
      income.description || 'Income received',
      income.id,
      transaction,
    );
    await transaction.commit();
    return income;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateIncome(id: string, data: UpdateIncomeInput) {
  const transaction = await sequelize.transaction();
  try {
    const income = await Income.findByPk(id, { transaction });
    if (!income) throw new Error('Income not found');

    const oldAmount = Number(income.amount);
    const oldAccountId = income.bankAccountId;

    await income.update(data, { transaction });

    if (data.amount !== undefined || data.bankAccountId !== undefined) {
      await applyTransaction(
        oldAccountId,
        TransactionType.WITHDRAWAL,
        oldAmount,
        `Reversal: ${income.description} (update)`,
        income.id,
        transaction,
      );
      await applyTransaction(
        income.bankAccountId,
        TransactionType.INCOME,
        Number(income.amount),
        income.description || 'Income received',
        income.id,
        transaction,
      );
    }
    await transaction.commit();
    return income;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteIncome(id: string) {
  const transaction = await sequelize.transaction();
  try {
    const income = await Income.findByPk(id, { transaction });
    if (!income) throw new Error('Income not found');

    await applyTransaction(
      income.bankAccountId,
      TransactionType.WITHDRAWAL,
      Number(income.amount),
      `Reversal: Deleted income "${income.description}"`,
      income.id,
      transaction,
    );
    await income.destroy({ transaction });
    await transaction.commit();
    return { message: 'Income deleted' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}