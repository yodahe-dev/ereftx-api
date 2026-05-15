import db from '../../../models';
import { CreateCustomerInput, UpdateCustomerInput } from './customer.schema';

const { Customer } = db;

export async function createCustomer(data: CreateCustomerInput) {
  return await Customer.create(data);
}

export async function updateCustomer(id: string, data: UpdateCustomerInput) {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new Error('Customer not found');
  return await customer.update(data);
}

export async function deleteCustomer(id: string) {
  const customer = await Customer.findByPk(id);
  if (!customer) throw new Error('Customer not found');
  await customer.destroy();
  return { message: 'Customer deleted' };
}