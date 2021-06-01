import { DataTypes } from 'sequelize'
import { Migration } from '../migrator'

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().createTable('session', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT
    },
    sid: {
      allowNull: false,
      type: DataTypes.STRING
    },
    expires: {
      allowNull: false,
      type: DataTypes.DATE
    },
    data: {
      allowNull: false,
      type: DataTypes.TEXT
    }
  })
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable('session')
}
