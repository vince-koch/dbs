export interface ITableMetaData {
    table_type: string
    table_catalog: string
    table_schema: string
    table_name: string
    column_name: string
    ordinal_position: number
    data_type: string
    column_default: string
    character_maximum_length: number | null
    numeric_precision: number | null
    is_nullable: boolean
    constraint_type: string | null
    constraint_name: string | null
}