import { BelongsTo, Column, ForeignKey, Model, Table } from 'sequelize-typescript'
import { DataTypes, Optional } from 'sequelize'

import { User } from '../user/user.model.js'

interface CanvasTokenAttributes {
  id: bigint
  userId: bigint
  accessToken: string
  refreshToken: string
  expiresAt: string
}

interface CanvasTokenCreationAttributes extends Optional<CanvasTokenAttributes, 'id'> {}

@Table({
  tableName: 'canvas_token',
  freezeTableName: true,
  timestamps: false
})
export class CanvasToken extends Model<CanvasTokenAttributes, CanvasTokenCreationAttributes> {
  @Column({
    primaryKey: true,
    autoIncrement: true,
    type: DataTypes.BIGINT
  })
  declare id: bigint

  @ForeignKey(() => User)
  @Column({
    type: DataTypes.BIGINT
  })
  declare userId: bigint

  @BelongsTo(() => User)
  user!: User

  @Column({
    type: DataTypes.STRING
  })
  declare accessToken: string

  @Column({
    type: DataTypes.STRING
  })
  declare refreshToken: string

  @Column({
    type: DataTypes.DATE
  })
  declare expiresAt: string

  isExpired (): boolean {
    return new Date() > new Date(this.expiresAt)
  }
}
