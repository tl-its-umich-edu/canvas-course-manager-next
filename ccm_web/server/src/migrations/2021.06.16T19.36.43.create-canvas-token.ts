import { DataTypes } from 'sequelize'
import { Migration } from '../migrator'

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().createTable('canvas_token', {
    id: {
      allowNull: false,
      autoIncrement: true,
      primaryKey: true,
      type: DataTypes.BIGINT
    },
    userId: {
      allowNull: false,
      type: DataTypes.BIGINT,
      references: { model: 'user', key: 'id' },
      field: 'user_id'
    },
    accessToken: {
      allowNull: false,
      type: DataTypes.STRING,
      field: 'access_token'
    },
    refreshToken: {
      allowNull: false,
      type: DataTypes.STRING,
      field: 'refresh_token'
    }
  })
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().dropTable('canvas_token')
}
