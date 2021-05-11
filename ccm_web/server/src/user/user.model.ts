import { Column, Model, Table, Unique} from 'sequelize-typescript';
import { Optional } from 'sequelize'

// https://www.npmjs.com/package/sequelize-typescript#more-strict

interface UserAttributes {
    id?: Number;
    loginId: string;
    firstName: string;
    lastName: string;
    email: string;
  }

interface UserCreationAttributes extends Optional<UserAttributes, "id"> {
    createdAt?: Date
    updatedAt?: Date
}

@Table
export class User extends Model<UserAttributes, UserCreationAttributes> {

    @Column
    firstName!: string

    @Column
    lastName!: string
    
    @Column
    email!: string 
    
    @Unique
    @Column
    loginId!: string

}