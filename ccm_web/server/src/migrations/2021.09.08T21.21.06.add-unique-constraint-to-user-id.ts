import { Migration } from '../migrator'

export const up: Migration = async ({ context: sequelize }) => {
  await sequelize.getQueryInterface().addConstraint(
    'canvas_token',
    {
      fields: ['user_id'],
      type: 'unique',
      name: 'unique_user_id_constraint'
    }
  )
}

export const down: Migration = async ({ context: sequelize }) => {
  const queryInterface = sequelize.getQueryInterface()
  // Have to first remove FK constraint, fails otherwise
  await queryInterface.removeConstraint(
    'canvas_token',
    'canvas_token_ibfk_1'
  )
  await queryInterface.removeConstraint(
    'canvas_token',
    'unique_user_id_constraint'
  )
  // Adding back same FK
  await queryInterface.addConstraint(
    'canvas_token',
    {
      fields: ['user_id'],
      type: 'foreign key',
      name: 'canvas_token_ibfk_1',
      references: {
        table: 'user',
        field: 'id'
      },
      onDelete: 'restrict',
      onUpdate: 'restrict'
    }
  )
}
