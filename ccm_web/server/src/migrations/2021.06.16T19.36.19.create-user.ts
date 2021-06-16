import { DataTypes } from 'sequelize'
import { Migration } from '../migrator'

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().createTable('user', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT
    },
    firstName: {
      allowNull: true,
      type: DataTypes.STRING,
      field: 'first_name'
    },
    lastName: {
      allowNull: true,
      type: DataTypes.STRING,
      field: 'last_name'
    },
    email: {
      allowNull: true,
      type: DataTypes.STRING
    },
    loginId: {
      allowNull: false,
      unique: true,
      type: DataTypes.STRING,
      field: 'login_id'
    },
    createdAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  })
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable('user')
}
