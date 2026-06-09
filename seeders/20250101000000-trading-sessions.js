'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.bulkInsert('trading_sessions', [
      { id: Sequelize.literal('UUID()'), name: 'Sydney', abbreviation: 'SYD', timezone: 'Australia/Sydney', localOpenHour: 7, localOpenMinute: 0, localCloseHour: 16, localCloseMinute: 0, priority: 1, createdAt: new Date(), updatedAt: new Date() },
      { id: Sequelize.literal('UUID()'), name: 'Tokyo', abbreviation: 'TKY', timezone: 'Asia/Tokyo', localOpenHour: 9, localOpenMinute: 0, localCloseHour: 18, localCloseMinute: 0, priority: 2, createdAt: new Date(), updatedAt: new Date() },
      { id: Sequelize.literal('UUID()'), name: 'London', abbreviation: 'LDN', timezone: 'Europe/London', localOpenHour: 8, localOpenMinute: 0, localCloseHour: 17, localCloseMinute: 0, priority: 3, createdAt: new Date(), updatedAt: new Date() },
      { id: Sequelize.literal('UUID()'), name: 'NewYork', abbreviation: 'NY', timezone: 'America/New_York', localOpenHour: 9, localOpenMinute: 0, localCloseHour: 16, localCloseMinute: 0, priority: 4, createdAt: new Date(), updatedAt: new Date() }
    ]);
  },
  down: async (queryInterface) => {
    await queryInterface.bulkDelete('trading_sessions', null, {});
  }
};