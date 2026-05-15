import db from '../../../models';
import { CreateLoanInput, UpdateLoanInput } from './loan.schema';
import { applyTransaction } from '../automation.service';
import { TransactionType } from '../../../models/BankTransaction';
import { LoanType, LoanStatus } from '../../../models/Loan';

const { Loan, sequelize } = db;

export async function createLoan(data: CreateLoanInput) {
  const transaction = await sequelize.transaction();
  try {
    const loan = await Loan.create({ ...data, status: LoanStatus.ACTIVE }, { transaction });
    // If we are borrowing (type = borrow), we receive money into the bank account
    if (loan.type === LoanType.BORROW) {
      await applyTransaction(
        loan.bankAccountId,
        TransactionType.LOAN_DISBURSEMENT,
        Number(loan.principalAmount),
        `Loan from ${loan.counterpartyName}`,
        loan.id,
        transaction,
      );
    } else if (loan.type === LoanType.LEND) {
      // If we are lending, money leaves our account
      await applyTransaction(
        loan.bankAccountId,
        TransactionType.LOAN_REPAYMENT,   // actually a withdrawal, but we use a specific type for tracking
        Number(loan.principalAmount),
        `Loan given to ${loan.counterpartyName}`,
        loan.id,
        transaction,
      );
    }

    await transaction.commit();
    return loan;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function updateLoan(id: string, data: UpdateLoanInput) {
  const transaction = await sequelize.transaction();
  try {
    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) throw new Error('Loan not found');

    // If principalAmount changes, we need to adjust the bank account?
    // We'll keep it simple: updates only affect non-financial fields. For amount changes, user must delete and recreate.
    await loan.update(data, { transaction });

    await transaction.commit();
    return loan;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function deleteLoan(id: string) {
  const transaction = await sequelize.transaction();
  try {
    const loan = await Loan.findByPk(id, { transaction });
    if (!loan) throw new Error('Loan not found');

    // Reverse the financial impact
    if (loan.type === LoanType.BORROW) {
      // Repay the borrowed amount back (money leaves account)
      await applyTransaction(
        loan.bankAccountId,
        TransactionType.LOAN_REPAYMENT,
        Number(loan.principalAmount),
        `Reversal: Loan from ${loan.counterpartyName} deleted`,
        loan.id,
        transaction,
      );
    } else if (loan.type === LoanType.LEND) {
      // Get back the lent amount
      await applyTransaction(
        loan.bankAccountId,
        TransactionType.LOAN_DISBURSEMENT,
        Number(loan.principalAmount),
        `Reversal: Loan to ${loan.counterpartyName} deleted`,
        loan.id,
        transaction,
      );
    }

    await loan.destroy({ transaction });
    await transaction.commit();
    return { message: 'Loan deleted' };
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}