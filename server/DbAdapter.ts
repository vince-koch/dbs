export interface IDbTableMeta {
    table_catalog: string;
    table_schema: string;
    table_name: string;
    table_type: string;
    column_name: string;
    ordinal_position: number;
    data_type: string;
    column_default: string;
    character_max_length: number;
    numeric_precision: number;
    is_nullable: boolean;
    is_pk: boolean;
    is_fk: boolean;    
}

export interface IDbRoutineMeta {
    routine_catalog: string;
    routine_schema: string;
    routine_name: string;
    routine_type: string;
    return_data_type: string;
    parameter_name: string;
    ordinal_position: number;
    parameter_mode: string;
    is_result: boolean;
    data_type: string;
    character_maximum_length: number;
    parameter_default: string;
}

export interface IDbClientOptions {
    driver: string;
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
}

export interface IDbQueryOptions {
    query: string;
    values: any[];
}

export interface IDbField {
    name: string;
}

export interface IDbQueryResult {
    fields: IDbField[];
    rows: {}[];
    rowCount: number;
}

export interface IDbClient {
    connect(options: IDbClientOptions): Promise<void>;
    execute(options: IDbQueryOptions): Promise<IDbQueryResult[]>;
    getTableMeta(schema: string, table: string): Promise<IDbTableMeta[]>;
    getRoutineMeta(schema: string, routine: string): Promise<IDbRoutineMeta[]>;
    close(): Promise<void>;
}
