import { Model, Optional, DataTypes } from 'sequelize'
import baseLogger from './../../logger'
const logger = baseLogger.child({ filePath: __filename })
import { sequelize } from '.'

interface UsersAttributes {
  id?: Number;
  loginId: string;
  firstName: string;
  lastName: string;
  email: string;
}

/*
  We have to declare the UsersCreationAttributes to
  tell Sequelize and TypeScript that the property id,
  in this case, is optional to be passed at creation time
*/
interface UsersCreationAttributes extends Optional<UsersAttributes, "id"> {}

interface UsersInstance
  extends Model<UsersAttributes, UsersCreationAttributes>,
    UsersAttributes {
  createdAt?: Date;
  updatedAt?: Date;
}

const Users = sequelize.define<UsersInstance>("Users", {
  id: {
    allowNull: false,
    autoIncrement: false,
    primaryKey: true,
    type: DataTypes.UUID,
    unique: true,
  },
  loginId: {
    allowNull: false,
    unique: true,
    type: DataTypes.TEXT,
  },
  firstName: {
    allowNull: true,
    type: DataTypes.TEXT,
  },
  lastName: {
    allowNull: true,
    type: DataTypes.TEXT,
  },
  email: {
    allowNull: true,
    type: DataTypes.TEXT,
  },
})

const UpsertUser = async(values: any): Promise<any> => {
  const [record, created] = await Users.upsert({
    loginId: values.loginId,
    firstName: values.firstName,
    lastName: values.lastName,
    email: values.email
  })
  logger.info(record)
  logger.info(created)

}
export {Users, UpsertUser}
