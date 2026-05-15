// modules/finance/automation.service.ts
import db from '../../models';
import { TransactionType } from '../../models/BankTransaction';
import { Transaction } from 'sequelize';

const { BankAccount, BankTransaction } = db;

/**
 * Apply a financial change to a BankAccount and record the ledger entry.
 * @param bankAccountId - target account
 * @param type - transaction type
 * @param amount - absolute amount (always positive)
 * @param description - optional note
 * @param referenceId - optional linked entity ID
 * @param externalTransaction - optional Sequelize transaction object
 */
export async function applyTransaction(
  bankAccountId: string,
  type: TransactionType,
  amount: number,
  description?: string,
  referenceId?: string,
  externalTransaction?: Transaction,
) {
  // Use provided transaction or create a new one
  const innerTransaction = externalTransaction ?? await db.sequelize.transaction();
  try {
    // Lock the account row to prevent race conditions
    const account = await BankAccount.findByPk(bankAccountId, {
      lock: innerTransaction.LOCK.UPDATE,
      transaction: innerTransaction,
    });
    if (!account) throw new Error('Bank account not found');

    const balanceBefore = Number(account.balance);
    let balanceAfter: number;

    // Determine direction based on type
    if ([TransactionType.DEPOSIT, TransactionType.TRANSFER_IN, TransactionType.INCOME, TransactionType.LOAN_DISBURSEMENT].includes(type)) {
      balanceAfter = balanceBefore + amount;
    } else if ([TransactionType.WITHDRAWAL, TransactionType.TRANSFER_OUT, TransactionType.EXPENSE, TransactionType.LOAN_REPAYMENT].includes(type)) {
      balanceAfter = balanceBefore - amount;
      if (balanceAfter < 0) throw new Error('Insufficient funds');
    } else {
      // CORRECTION – just set balance as given? Actually for correction we need a different approach, handled separately
      throw new Error('Unsupported transaction type');
    }

    await account.update({ balance: balanceAfter }, { transaction: innerTransaction });

    await BankTransaction.create({
      bankAccountId,
      type,
      amount,
      balanceBefore,
      balanceAfter,
      referenceId,
      description,
    } as any, { transaction: innerTransaction });

    if (!externalTransaction) {
      await innerTransaction.commit();
    }
  } catch (error) {
    if (!externalTransaction) {
      await innerTransaction.rollback();
    }
    throw error;
  }
}