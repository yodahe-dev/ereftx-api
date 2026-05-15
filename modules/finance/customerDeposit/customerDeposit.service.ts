import db from '../../../models';
import { CreateDepositInput, UpdateDepositInput } from './customerDeposit.schema';
import { applyTransaction } from '../automation.service';
import { TransactionType } from '../../../models/BankTransaction';

const { CustomerDeposit, sequelize } = db;

export async function createDeposit(data: CreateDepositInput) {
  const transaction = await sequelize.transaction();
  try {
    if (!data.remainingAmount) data.remainingAmount = data.amount;
    const deposit = await CustomerDeposit.create(data, { transaction });
    // Assuming deposit is collected in cash pocket (bank account of type cash)
    // You need to know which cash account to credit. For simplicity, we'll skip auto bank transaction here,
    // but you could add a parameter for the cash account.
    await transaction.commit();
    return deposit;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateDeposit(id: string, data: UpdateDepositInput) {
  const deposit = await CustomerDeposit.findByPk(id);
  if (!deposit) throw new Error('Deposit not found');
  await deposit.update(data);
  return deposit;
}

export async function deleteDeposit(id: string) {
  const deposit = await CustomerDeposit.findByPk(id);
  if (!deposit) throw new Error('Deposit not found');
  await deposit.destroy();
  return { message: 'Deposit deleted' };
}