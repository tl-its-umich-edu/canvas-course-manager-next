import { Column, Model, Table } from 'sequelize-typescript'
import { DataTypes, Optional } from 'sequelize'

interface SessionAttributes {
  id?: bigint
  sid: string
  expires: string
  data: string
}

interface SessionCreationAttributes extends Optional<SessionAttributes, 'id'> {}

@Table({
  freezeTableName: true,
  timestamps: false
})
export class Session extends Model<SessionAttributes, SessionCreationAttributes> {
  @Column({
    type: DataTypes.STRING
  })
  sid!: string

  @Column({
    type: DataTypes.DATE
  })
  expires!: string

  @Column({
    type: DataTypes.TEXT
  })
  data!: string
}
