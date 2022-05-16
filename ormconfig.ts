const { env } = process;

const options = {
    type: 'postgres',
    host: env.DB_HOST,
    port: env.DB_PORT,
    username: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    entities: ['./dist/*/entities/*{.ts,.js}', './src/*/entities/*{.ts,.js}'],
    synchronize: true,
    migrations: ['./dist/*/entities/migrations/*{.ts,.js}', './src/*/entities/migrations/*{.ts,.js}'],
    logging: false,
    connectTimeout: 30000,
    cli: { migrationsDir: 'migrations' },
};



module.exports = options;