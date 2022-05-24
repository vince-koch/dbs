import { Application } from "express";
import fs from "fs";
import * as Db from "./DbAdapter";
import { PostgresPgDb } from "./PostgresPgAdapter";

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

export function registerDbApiRoutes(app: Application) {
    app.get("/api/db/tables", async (req, res) => {
        const schema: string = valueOrDefault(req.query.schema, '');
        const table: string = valueOrDefault(req.query.table, '');
    
        const connection = await openConnection();
    
        try {
            const tables = await connection.getTableMeta(schema, table);
            res.json(tables);
        }
        finally {
            await connection.close();
        }
    })

    app.get("/api/db/routines", async (req, res) => {
        const schema: string = valueOrDefault(req.query.schema, '');
        const procedure: string = valueOrDefault(req.query.procedure, '');

        const connection = await openConnection();

        try {
            const routines = await connection.getRoutineMeta(schema, procedure);
            res.json(routines);
        }
        finally {
            await connection.close();
        }
    });

    app.post("/api/db/execute", async (req, res) => {
        if (req.body === null || req.body.query === null || req.body.query.length < 1) {
          throw new Error("No query provided");
        }
      
        const connection = await openConnection();
        
        try {
            const query = req.body.query as string;

            const result = await connection.execute({
                query: query } as Db.IDbQueryOptions);

            res.json(result);
        }
        finally {
            await connection.close();
        }
    });
}