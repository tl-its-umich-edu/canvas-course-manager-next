import Sequelize, { DataTypes } from 'sequelize'
import { Migration } from '../migrator.js'

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().addColumn(
    'canvas_token',
    'expires_at',
    {
      allowNull: false,
      type: DataTypes.DATE,
      field: 'expires_at',
      defaultValue: Sequelize.fn('NOW')
    }
  )
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().removeColumn('canvas_token', 'expires_at')
}
