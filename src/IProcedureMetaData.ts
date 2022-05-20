export interface IProcedureMetaData {
    routine_type: string
    routine_catalog: string
    routine_schema: string
    routine_name: string
    return_data_type: string
    parameter_name: string
    ordinal_position: number
    parameter_mode: string
    is_result: boolean
    data_type: string
    character_maximum_length: number | null
    parameter_default: number | null
}