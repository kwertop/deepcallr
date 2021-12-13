import { Connection, createConnection } from "typeorm";
const ormconfig = require("../ormconfig.js");

export default class DBConnection {

  public static async getDBConnection() {
    if (this.connection === null || this.connection === undefined) {
      this.connection = await createConnection(ormconfig);
    }
    return this.connection;
  }
  private static connection: Connection;
}
