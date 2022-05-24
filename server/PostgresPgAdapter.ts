import * as Pg from "pg";
import * as Db from "./DbAdapter";

export class PostgresPgDb implements Db.IDbClient {
    private _client: Pg.Client;

    public async connect(options: Db.IDbClientOptions): Promise<void> {
        if (this._client) {
            await this.close();
        }

        const config = {
            ... (options.host && { host: options.host }),
            ... (options.port && { port: options.port }),
            ... (options.database && { database: options.database }),
            ... (options.username && { user: options.username }),
            ... (options.password && { password: options.password }),

        } as Pg.ClientConfig;

        this._client = new Pg.Client(config);
        this._client.on("error", err => console.error("client error: ", err));
        this._client.on("notification", msg => console.info("client notification: ", msg));
        this._client.on("notice", msg => console.warn("client notice: ", msg));
        this._client.on("end", () => console.warn("client disconnected"));

        await this._client.connect();
    }

    public async execute(options: Db.IDbQueryOptions): Promise<Db.IDbQueryResult[]> {
        const config = {
            ... (options.query && { text: options.query }),
            ... (options.values && { values: options.values })
        } as Pg.QueryConfig;

        const result = await this._client.query(config);
        const array = Array.isArray(result) ? result : [ result ];
        const mapped = array.map(item => this.mapResult(item));

        return mapped;;
    }

    public async getTableMeta(schemaName: string = null, tableName: string = null): Promise<Db.IDbTableMeta[]> {
        const query = `
                WITH key_constraints AS (
                    SELECT kcu.constraint_catalog, kcu.constraint_schema, kcu.constraint_name, kcu.table_catalog, kcu.table_schema, kcu.table_name, kcu.column_name, kcu.ordinal_position,
                        tc.constraint_type
                    FROM information_schema.key_column_usage kcu
                    LEFT JOIN information_schema.table_constraints tc
                        ON kcu.table_catalog = tc.table_catalog
                        AND kcu.table_schema = tc.table_schema
                        AND kcu.table_name = tc.table_name
                        AND kcu.constraint_name = tc.constraint_name
                )
                SELECT t.table_catalog, t.table_schema, t.table_name, t.table_type,
                    c.column_name, c.ordinal_position, c.data_type, c.column_default, c.character_maximum_length, c.numeric_precision, c.is_nullable,
                    CASE WHEN EXISTS (
                        SELECT kc.constraint_type
                            FROM key_constraints kc
                            WHERE kc.table_catalog = c.table_catalog
                            AND kc.table_schema = c.table_schema
                            AND kc.table_name = c.table_name
                            AND kc.column_name = c.column_name
                                        AND kc.constraint_type = 'PRIMARY KEY'
                    ) THEN 1 ELSE 0 END is_pk,
                    CASE WHEN EXISTS (
                        SELECT kc.constraint_type
                            FROM key_constraints kc
                            WHERE kc.table_catalog = c.table_catalog
                            AND kc.table_schema = c.table_schema
                            AND kc.table_name = c.table_name
                            AND kc.column_name = c.column_name
                                        AND kc.constraint_type = 'FOREIGN KEY'
                    ) THEN 1 ELSE 0 END is_fk
                FROM information_schema.tables t
                JOIN information_schema.columns c
                    ON t.table_catalog = c.table_catalog
                    AND t.table_schema = c.table_schema
                    AND t.table_name = c.table_name
                WHERE c.table_schema != 'pg_catalog'
                    AND (LENGTH($1) = 0 OR c.table_schema = $1)
                    AND (LENGTH($2) = 0 OR c.table_name = $2)
                ORDER BY t.table_catalog, t.table_schema, t.table_name, c.ordinal_position
            `.trim();
        
        const config = {
            text: query,
            values: [ schemaName, tableName ],
        } as Pg.QueryConfig;
        
        const result = await this._client.query<Db.IDbTableMeta>(config);

        return result.rows;
    }

    public async getRoutineMeta(schemaName: string = null, routineName: string = null): Promise<Db.IDbRoutineMeta[]> {
        const query = `
            SELECT r.routine_type, r.routine_catalog, r.routine_schema, r.routine_name, r.data_type as return_data_type,
                p.parameter_name, p.ordinal_position, p.parameter_mode, p.is_result, p.data_type, p.character_maximum_length, p.parameter_default
            FROM information_schema.routines r
            LEFT JOIN information_schema.parameters p
                ON r.specific_catalog = p.specific_catalog
                AND r.specific_schema = p.specific_schema
                AND r.specific_name = p.specific_name
            WHERE r.specific_schema NOT IN ('pg_catalog', 'information_schema')
                AND (LENGTH($1) = 0 OR r.routine_schema = $1)
                AND (LENGTH($2) = 0 OR r.routine_name = $2)
            ORDER BY r.routine_catalog, r.routine_schema, r.routine_name, p.ordinal_position`.trim();

        const config = {
            text: query,
            values: [ schemaName, routineName ],
        } as Pg.QueryConfig;

        const result = await this._client.query<Db.IDbRoutineMeta>(config);

        return result.rows;
    }

    public async close(): Promise<void> {
        if (this._client) {
            await this._client.end();
        }
    }

    private mapResult(result: Pg.QueryResult): Db.IDbQueryResult {
        const dbResult = {
            fields: result.fields.map(item => this.mapField(item)),
            rows: result.rows,
            rowCount: result.rowCount
        } as Db.IDbQueryResult;

        return dbResult;
    }

    private mapField(field: Pg.FieldDef): Db.IDbField {
        const dbField = {
            name: field.name
        } as Db.IDbField;

        return dbField;
    }
}