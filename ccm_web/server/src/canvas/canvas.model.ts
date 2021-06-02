import { BelongsTo, Column, ForeignKey, Model, Table } from 'sequelize-typescript'
import { DataTypes, Optional } from 'sequelize'

import { User } from '../user/user.model'

interface CanvasTokenAttributes {
  id?: bigint
  userId: bigint
  accessToken: string
  refreshToken: string
}

interface CanvasTokenCreationAttributes extends Optional<CanvasTokenAttributes, 'id'> {}

@Table({
  tableName: 'canvas_token',
  freezeTableName: true,
  timestamps: false
})
export class CanvasToken extends Model<CanvasTokenAttributes, CanvasTokenCreationAttributes> {
  @ForeignKey(() => User)
  @Column({
    type: DataTypes.BIGINT
  })
  userId!: bigint

  @BelongsTo(() => User)
  user!: User

  @Column({
    type: DataTypes.STRING
  })
  accessToken!: string

  @Column({
    type: DataTypes.STRING
  })
  refreshToken!: string
}
