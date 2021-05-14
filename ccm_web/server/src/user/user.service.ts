import { Injectable } from "@nestjs/common"
import { InjectModel } from "@nestjs/sequelize"
import { CreateUserDto } from "./dto/create-user.dto"
import { User } from "./user.model"
import baseLogger from "../logger"
const logger = baseLogger.child({ filePath: __filename })

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User)
    private userModel: typeof User
  ) {}

  async upsertUser(createUserDto: CreateUserDto): Promise<any> {
    const [record, created] = await User.upsert({
      loginId: createUserDto.loginId,
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: createUserDto.email,
      ltiId: createUserDto.ltiId
    });
    logger.info(
      `User ${createUserDto.loginId} record is ${
        created ? "created" : "updated"
      }`
    );
    return created;
  }
}
