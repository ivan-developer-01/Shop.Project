import mysql, { Connection } from "mysql2/promise";

export async function initDataBase(): Promise<Connection | null> {
    let connection: Connection | null;
    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: +process.env.DB_PORT,
            user: process.env.DB_USER,
            password: process.env.DB_PASS,
            database: process.env.DB_NAME
        });
    } catch (error) {
        console.error(error.message || error);
        return null;
    }

    console.log(`Connection to DB ${process.env.DB_NAME} established`);
    return connection;
}