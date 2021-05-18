import { DataTypes } from 'sequelize'
import { Migration } from '../migrator'

export const up: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().createTable('user', {
		id: {
			allowNull: false,
			autoIncrement: true,
			primaryKey: true,
			type: DataTypes.INTEGER
		  },
		  firstName: {
			allowNull: true,
			type: DataTypes.STRING
		  },
		  lastName: {
			allowNull: true,
			type: DataTypes.STRING
		  },
		  email: {
			allowNull: true,
			type: DataTypes.STRING
		  },
		  loginId: {
			allowNull: false,
			unique: true,
			type: DataTypes.STRING
		  },
		  ltiId: {
			allowNull: false,
			type: DataTypes.STRING
		  },
		  createdAt: {
			allowNull: false,
			type: DataTypes.DATE
		  },
		  updatedAt: {
			allowNull: false,
			type: DataTypes.DATE
		  }
	})
}

export const down: Migration = async ({ context: sequelize }) => {
	await sequelize.getQueryInterface().dropTable('user');
};