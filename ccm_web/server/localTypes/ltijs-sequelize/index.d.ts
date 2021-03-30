declare type SequelizeOptions = import('sequelize').Options

declare module 'ltijs-sequelize' {

  class Database {
    constructor (
      database: string,
      user: string,
      pass: string,
      options: SequelizeOptions
    )

    setup (): Promise<true>

    Close (): Promise<true>

    Get (
      ENCRYPTIONKEY: string | false,
      table: string,
      info?: Record<string, unknown>
    ): Promise<Record<string, unknown> | false>

    Insert (
      ENCRYPTIONKEY: string | false,
      table: string,
      item: Record<string, unknown>,
      index?: Record<string, unknown>
    ): Promise<true>

    Modify (
      ENCRYPTIONKEY: string | false,
      table: string,
      info: Record<string, unknown>,
      modification: Record<string, unknown>
    ): Promise<true>

    Replace (
      ENCRYPTIONKEY: string | false,
      table: string,
      info: Record<string, unknown>,
      item: Record<string, unknown>,
      index?: Record<string, unknown>
    ): Promise<true>

    Delete (
      table: string,
      info: Record<string, unknown>
    ): Promise<true>

    Encrypt (
      data: string,
      secret: string
    ): Promise<{ iv: string, data: string }>

    Decrypt (
      data: string,
      _iv: string,
      secret: string
    ): Promise<string>
  }
  export = Database
}
