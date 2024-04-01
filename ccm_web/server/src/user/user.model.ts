import { Column, HasOne, Model, Table, Unique } from 'sequelize-typescript'
import { Optional, DataTypes } from 'sequelize'
import { CanvasToken } from '../canvas/canvas.model.js'

// https://www.npmjs.com/package/sequelize-typescript#more-strict

interface UserAttributes {
  id: bigint
  loginId: string
  firstName: string
  lastName: string
  email: string
}

interface UserCreationAttributes extends Optional<UserAttributes, 'id'> {
  createdAt?: Date
  updatedAt?: Date
}

// Sequelize Datatypes mapping with Mysql https://sequelize.org/master/manual/model-basics.html#data-types
@Table({
  tableName: 'user',
  freezeTableName: true
})
export class User extends Model<UserAttributes, UserCreationAttributes> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  })
  declare id: bigint

  @Column({
    type: DataTypes.STRING
  })
  declare firstName: string

  @Column({
    type: DataTypes.STRING
  })
  declare lastName: string

  @Column({
    type: DataTypes.STRING
  })
  declare email: string

  @Unique
  @Column({
    type: DataTypes.STRING
  })
  declare loginId: string

  @HasOne(() => CanvasToken)
  declare canvasToken: CanvasToken | null
}
