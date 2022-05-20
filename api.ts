import express from "express";
import "express-async-errors";
import { Connection, QueryResult } from "postgresql-client";

async function getConnection(): Promise<Connection> {
  const connection = new Connection({
    host: "localhost",
    port: 5432,
    user: "postgres",
    password: "sergtsop",
    database: "hris"
  });

  await connection.connect();

  return connection;
}

function mapRows(result: QueryResult): {}[] {
  const items = result.rows.map(
    row => {
      let item = {};
      for (let f = 0; f < result.fields.length; f++) {
        item[result.fields[f].fieldName] = row[f];
      }

      return item;
    });

  return items;
}

function getValueOrNull(value: any) {
  return value === undefined
    ? null
    : value;
}

function valueOrDefault(value: any, defaultValue: any): any {
  return value === undefined || value === null
    ? defaultValue
    : value;
}

const app = express();
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

app.get("/api/db/tables", async (req, res) => {
  const schema: string = valueOrDefault(req.query.schema, '');
  const table: string = valueOrDefault(req.query.table, '');

  const query = `
    SELECT t.table_type, t.table_catalog, t.table_schema, t.table_name,
      c.column_name, c.ordinal_position, c.data_type, c.column_default, c.character_maximum_length, c.numeric_precision, c.is_nullable,
      tc.constraint_type, tc.constraint_name
    FROM information_schema.tables t
    JOIN information_schema.columns c
      ON t.table_catalog = c.table_catalog
      AND t.table_schema = c.table_schema
      AND t.table_name = c.table_name
    LEFT JOIN information_schema.key_column_usage kcu
      ON c.table_catalog = kcu.table_catalog
      AND c.table_schema = kcu.table_schema
      AND c.table_name = kcu.table_name
      AND c.column_name = kcu.column_name
    LEFT JOIN information_schema.table_constraints AS tc
      ON kcu.constraint_name = tc.constraint_name
    WHERE c.table_schema != 'pg_catalog'
      AND (LENGTH($1) = 0 OR c.table_schema = $1)
      AND (LENGTH($2) = 0 OR c.table_name = $2)
    ORDER BY t.table_catalog, t.table_schema, t.table_name, c.ordinal_position`.trim();

    const connection = await getConnection();

    const result = await connection.query(
      query,
      {
        params: [ schema as string, table as string ],
        fetchCount: 9999
      });

    const mapped = mapRows(result);

    //console.info("query executed", { query, rowCount: result.rows.length, mappedCount: mapped.length });

    res.json(mapped);

    console.info("query executed", { query, rowCount: result.rows.length, mappedCount: mapped.length });
})

app.get("/api/db/procedures", async (req, res) => {
  const schema: string = valueOrDefault(req.query.schema, '');
  const procedure: string = valueOrDefault(req.query.procedure, '');

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

  const connection = await getConnection();

  const result = await connection.query(
    query,
    {
      params: [ schema as string, procedure as string ],
      fetchCount: 9999
    });

  const mapped = mapRows(result);

  res.json(mapped);
});

app.post("/api/db/execute", async (req, res) => {
  if (req.body === null || req.body.query === null || req.body.query.length < 1) {
    throw new Error("No query provided");
  }

  const connection = await getConnection();
  const result = await connection.execute(req.body.query);
  res.json(result);
  await connection.close();
});

// error handler middleware
app.use((err, req, res, next) => {
  if (err !== null) {
    console.error(err);

    if (err.message === 'access denied') {
      res.status(403)
      res.json({ error: err.message })
      res.end()
    }
    else {
      res.status(500)
      res.json({ error: err.message })
      res.end()
    }
  }

  next(err);
});

export const handler = app;