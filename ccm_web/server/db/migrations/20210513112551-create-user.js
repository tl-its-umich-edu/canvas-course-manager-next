'use strict';
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        allowNull: true,
        type: Sequelize.STRING
      },
      lastName: {
        allowNull: true,
        type: Sequelize.STRING
      },
      email: {
        allowNull: true,
        type: Sequelize.STRING
      },
      loginId: {
        allowNull: false,
        unique: true,
        type: Sequelize.STRING
      },
      createdAt: {
        allowNull: false,
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('Users');
  }
};