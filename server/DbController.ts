import fs from "fs";
import * as Db from "./DbAdapter";
import { PostgresPgDb } from "./PostgresPgAdapter";
import Utilities from "./Utilities";
import { http } from "./ExpressApi";

function valueOrDefault(value: any, defaultValue: any): any {
    return value === undefined || value === null
        ? defaultValue
        : value;
}

async function openConnection(): Promise<Db.IDbClient> {
    const rawData = fs.readFileSync("connection.default.json", "utf8");
    const options = JSON.parse(rawData) as Db.IDbClientOptions;

    const client = new PostgresPgDb();
    await client.connect(options);
    return client;
}

@http.controller("db")
export class DbController {

    @http.get("connection")
    public getConnectionNames(): string[]
    {
        const prefix = "connection.";
        const suffix = ".json";

        const connectionNames = fs
            .readdirSync(".")
            .filter(file => file.startsWith(prefix) && file.endsWith(suffix))
            .map(file => file.substring(prefix.length, file.length - suffix.length));

        return connectionNames;
    }

    @http.get("tables/:schema?.:table?")
    public async getTables(
        @http.fromQuery("schema", v => v) schema: string,
        @http.fromQuery("table", v => v) table: string): Promise<Db.IDbTableMeta[]>
    {
        const connection = await openConnection();

        try {
            const tables = await connection.getTableMeta(schema, table);
            return tables;
        }
        finally {
            await connection.close();
        }
    }

    @http.get("routines/:schema?.:routine?")
    public async getRoutines(
        @http.fromQuery("schema", v => v) schema: string,
        @http.fromQuery("routine", v => v) routine: string): Promise<Db.IDbRoutineMeta[]>
    {
        const connection = await openConnection();

        try {
            const routines = await connection.getRoutineMeta(schema, routine);
            return routines;
        }
        finally {
            await connection.close();
        }
    }

    @http.post("execute")
    public async execute(@http.fromBody(v => v) query: string): Promise<Db.IDbQueryResult[]>
    {
        if (Utilities.string.isNullOrWhiteSpace(query)) {
            throw new Error("No query provided");
        }

        const connection = await openConnection();

        try {
            const options = { query } as Db.IDbQueryOptions;
            const result = await connection.execute(options);
            return result;
        }
        finally {
            await connection.close();
        }
    }
}