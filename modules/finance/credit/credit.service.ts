import db from '../../../models';
import { CreateCreditInput, UpdateCreditInput } from './credit.schema';
import { applyTransaction } from '../automation.service';
import { TransactionType } from '../../../models/BankTransaction';
import { Op } from 'sequelize';

const { Credit, Customer, sequelize } = db;

export async function createCredit(data: CreateCreditInput) {
  const transaction = await sequelize.transaction();
  try {
    const credit = await Credit.create(data, { transaction });
    // Update customer's credit used
    await recalcCustomerCreditUsed(data.customerId, transaction);
    await transaction.commit();
    return credit;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateCredit(id: string, data: UpdateCreditInput) {
  const transaction = await sequelize.transaction();
  try {
    const credit = await Credit.findByPk(id, { transaction });
    if (!credit) throw new Error('Credit not found');

    await credit.update(data, { transaction });
    if (data.customerId) {
      await recalcCustomerCreditUsed(data.customerId, transaction);
    } else {
      await recalcCustomerCreditUsed(credit.customerId, transaction);
    }
    await transaction.commit();
    return credit;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteCredit(id: string) {
  const transaction = await sequelize.transaction();
  try {
    const credit = await Credit.findByPk(id, { transaction });
    if (!credit) throw new Error('Credit not found');
    const customerId = credit.customerId;
    await credit.destroy({ transaction });
    await recalcCustomerCreditUsed(customerId, transaction);
    await transaction.commit();
    return { message: 'Credit deleted' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function recalcCustomerCreditUsed(customerId: string, transaction: any) {
  const totalRemaining = await Credit.sum('remainingAmount', {
    where: { customerId, status: { [Op.ne]: 'paid' } },
    transaction,
  });
  await Customer.update({ currentCreditUsed: totalRemaining || 0 }, { where: { id: customerId }, transaction });
}