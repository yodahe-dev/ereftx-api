// modules/finance/bankaccounts/bankAccount.service.ts
import db from '../../../models';
import { CreateBankAccountInput, UpdateBankAccountInput, DepositInput, WithdrawInput } from './bankAccount.schema';
import { applyTransaction } from '../automation.service';
import { TransactionType } from '../../../models/BankTransaction';

const { BankAccount, BankTransaction, sequelize } = db;

export async function createBankAccount(data: CreateBankAccountInput) {
  const transaction = await sequelize.transaction();
  try {
    const account = await BankAccount.create(data, { transaction });
    if (Number(account.balance) > 0) {
      await BankTransaction.create({
        bankAccountId: account.id,
        type: TransactionType.DEPOSIT,
        amount: account.balance,
        balanceBefore: 0,
        balanceAfter: account.balance,
        description: 'Initial balance',
      }, { transaction });
    }
    await transaction.commit();
    return account;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function getBankAccountById(id: string) {
  const account = await BankAccount.findByPk(id);
  if (!account) throw new Error('Bank account not found');
  return account;
}

export async function updateBankAccount(id: string, data: UpdateBankAccountInput) {
  const transaction = await sequelize.transaction();
  try {
    const account = await BankAccount.findByPk(id, { transaction });
    if (!account) throw new Error('Bank account not found');

    if (data.balance !== undefined && data.balance !== Number(account.balance)) {
      const diff = Number(data.balance) - Number(account.balance);
      await BankTransaction.create({
        bankAccountId: id,
        type: diff > 0 ? TransactionType.DEPOSIT : TransactionType.WITHDRAWAL,
        amount: Math.abs(diff),
        balanceBefore: account.balance,
        balanceAfter: data.balance,
        description: 'Manual correction',
      }, { transaction });
    }

    await account.update(data, { transaction });
    await transaction.commit();
    return account;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteBankAccount(id: string) {
  const account = await BankAccount.findByPk(id);
  if (!account) throw new Error('Bank account not found');
  await account.destroy();
  return { message: 'Deleted successfully' };
}

// ---- NEW deposit / withdraw functions ----
export async function depositToAccount(id: string, input: DepositInput) {
  const transaction = await sequelize.transaction();
  try {
    const account = await BankAccount.findByPk(id, { transaction });
    if (!account) throw new Error('Bank account not found');

    await applyTransaction(
      id,
      TransactionType.DEPOSIT,
      input.amount,
      input.description || 'Manual deposit',
      undefined,
      transaction
    );

    await transaction.commit();
    // reload to get updated balance
    return await BankAccount.findByPk(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function withdrawFromAccount(id: string, input: WithdrawInput) {
  const transaction = await sequelize.transaction();
  try {
    const account = await BankAccount.findByPk(id, { transaction });
    if (!account) throw new Error('Bank account not found');

    if (Number(account.balance) < input.amount) {
      throw new Error('Insufficient funds');
    }

    await applyTransaction(
      id,
      TransactionType.WITHDRAWAL,
      input.amount,
      input.description || 'Manual withdrawal',
      undefined,
      transaction
    );

    await transaction.commit();
    return await BankAccount.findByPk(id);
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}