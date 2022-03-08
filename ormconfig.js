const SnakeNamingStrategy = require("typeorm-naming-strategies").SnakeNamingStrategy;

const nodeEnvironment = process.env.NODE_ENV || "develop";

module.exports = {
  name: "default",
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT || 5432),
  username: process.env.DB_USERNAME || "scribe",
  password: process.env.DB_PASSWORD || "scribepass",
  database: process.env.DB_NAME || "scribedb",
  migrationsRun: true,
  namingStrategy: new SnakeNamingStrategy(),
  logging: nodeEnvironment !== "production",
  entities: [
    "dist/entity/**/*.js"
  ],
  migrations: [
    "dist/migration/**/*.js"
  ],
  subscribers:
    ["dist/subscriber/**/*.js","node_modules/kafka_publisher/lib/subscriber/*.js"]
  ,
  cli: {
    entitiesDir: "src/entity",
    migrationsDir: "src/migration",
    subscribersDir: "src/subscriber"
  },
  "extra":{
    "poolSize": 25,
    "connectionTimeoutMillis": 2000
  }
};
