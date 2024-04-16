/*
Reference(s):
- https://github.com/DefinitelyTyped/DefinitelyTyped/issues/23976#issuecomment-546404481
*/

type UserModel = import('../../src/user/user.model.js').User

declare namespace Express {
  export interface User extends UserModel {}
}
