import { Column, Model, Table, Unique } from 'sequelize-typescript'
import { Optional, DataTypes } from 'sequelize'

// https://www.npmjs.com/package/sequelize-typescript#more-strict

interface UserAttributes {
  id?: number
  loginId: string
  firstName: string
  lastName: string
  email: string
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {
  createdAt?: Date
  updatedAt?: Date
}

// Sequelize Datatypes mapping with Mysql https://sequelize.org/v5/manual/data-types.html
@Table({
  freezeTableName: true
})
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @Column({
    type: DataTypes.STRING
  })
  firstName!: string

  @Column({
    type: DataTypes.STRING
  })
  lastName!: string

  @Column({
    type: DataTypes.STRING
  })
  email!: string

  @Unique
  @Column({
    type: DataTypes.STRING
  })
  loginId!: string
}
