import Sequelize, { DataTypes } from 'sequelize'
import { Migration } from '../migrator'

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().addColumn(
    'canvasToken',
    'expiresAt',
    {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: Sequelize.fn('NOW')
    }
  )
}

export const down: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().removeColumn('canvasToken', 'expiresAt')
}
