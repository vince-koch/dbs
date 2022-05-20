import "./ExplorerPanel.css";
import { useEffect, useState } from "react";
import { ITableMetaData } from "./ITableMetaData";
import { IProcedureMetaData } from "./IProcedureMetaData";
import ArrayUtil from "./ArrayUtil";
import TreeNode from "./TreeNode";
import SelectableLabel from "./SelectableLabel";

export default function ExplorerPanel() {
    const [ tableMetaData, setTableMetaData ] = useState<ITableMetaData[]>([]);
    const [ procedureMetaData, setProcedureMetaData ] = useState<IProcedureMetaData[]>([]);
    const [ errorMessage, setErrorMessage ] = useState<string>();

    async function refreshTables(schema: string | null, table: string | null): Promise<void> {
        const response = await fetch(`/api/db/tables?schema=${schema ?? ""}&table=${table ?? ""}`, {
            method: "GET",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            }});

        var result = await response.json();
        if (result.error) {
            console.error("tables ==> ", result.error);
            throw new Error(`Error refreshing tables: $(result.error)`);
        }

        const tables = schema === null && table === null
            ? result as ITableMetaData[]
            : ArrayUtil.orderBy(
                tableMetaData
                    .filter(row => schema === null || row.table_schema !== schema)
                    .filter(row => table === null || row.table_name !== table)
                    .concat(result as ITableMetaData[]),
                item => item.table_schema,
                item => item.table_name,
                item => item.ordinal_position);

        console.info("tables ==> ", tables);
        setTableMetaData(tables);
    }

    async function refreshProcedures(schema: string | null, procedure: string | null): Promise<void> {
        const response = await fetch(`/api/db/procedures?schema=${schema ?? ""}&procedure=${procedure ?? ""}`, {
            method: "GET",
            cache: "no-cache",
            headers: {
                "Content-Type": "application/json"
            }});

        var result = await response.json();
        if (result.error) {
            console.error("procedures ==> ", result.error);
            throw new Error(`Error refreshing procedures: $(result.error)`);
        }

        const procedures = schema === null && procedure === null
            ?  result as IProcedureMetaData[]
            : ArrayUtil.orderBy(
                procedureMetaData
                    .filter(row => schema === null || row.routine_schema !== schema)
                    .filter(row => procedure === null || row.routine_name !== procedure)
                    .concat(result as IProcedureMetaData[]),
                item => item.routine_catalog,
                item => item.routine_schema,
                item => item.routine_name,
                item => item.ordinal_position);

        console.info("procedures ==> ", procedures);
        setProcedureMetaData(procedures);
    }

    // initialization
    useEffect(() => {
        console.info("initialization --------------------------");
        Promise.all([
            refreshTables(null, null),
            refreshProcedures(null, null)]);
      }, []);

    function renderTree() {
        const catalogs = ArrayUtil.distinct([
            ...tableMetaData.map(item => item.table_catalog),
            ...procedureMetaData.map(item => item.routine_catalog)
        ]);

        return (
            <div className="tree-node">
                <ul>
                    {catalogs.map(catalog => renderCatalog(catalog))}
                </ul>
            </div>);
    }

    function renderCatalog(catalog: string) {
        const schemas = ArrayUtil.distinct([
            ...tableMetaData
                .filter(item => item.table_catalog === catalog)
                .map(item => item.table_schema),
            ...procedureMetaData
                .filter(item => item.routine_catalog === catalog)
                .map(item => item.routine_schema)
        ]);

        return (
            <TreeNode className="catalog"
            header={<SelectableLabel text={catalog}></SelectableLabel>}>
                {schemas.map(schema => renderSchema(catalog, schema))}
            </TreeNode>);
    }

    function renderSchema(catalog: string, schema: string) {
        return (
            <TreeNode className="schema"
                header={<SelectableLabel text={schema}></SelectableLabel>}>
                <TreeNode className="folder" header={<span>Functions</span>}>
                    {renderFunctions(catalog, schema)}
                </TreeNode>
                <TreeNode className="folder" header={<span>Procedures</span>}>
                    {renderProcedures(catalog, schema)}
                </TreeNode>
                <TreeNode className="folder" header={<span>Tables</span>}>
                    {renderTables(catalog, schema)}
                </TreeNode>
                <TreeNode className="folder" header={<span>Views</span>}>
                    {renderViews(catalog, schema)}
                </TreeNode>
            </TreeNode>);
    }

    function renderFunctions(catalog: string, schema: string) {
        const functions = ArrayUtil.distinct(procedureMetaData
            .filter(item => item.routine_catalog == catalog)
            .filter(item => item.routine_schema == schema)
            .filter(item => item.routine_type === "FUNCTION")
            .map(item => item.routine_name));

        return functions.map(routineName =>
            <TreeNode className="schema" isCollapsed={true}
                header={<SelectableLabel text={routineName}></SelectableLabel>}>
                {renderParameters(catalog, schema, routineName)}
            </TreeNode>);
    }

    function renderProcedures(catalog: string, schema: string) {
        const functions = ArrayUtil.distinct(procedureMetaData
            .filter(item => item.routine_catalog == catalog)
            .filter(item => item.routine_schema == schema)
            .filter(item => item.routine_type === "PROCEDURE")
            .map(item => item.routine_name));

        return functions.map(routineName =>
            <TreeNode className="procedure" isCollapsed={true}
                header={<SelectableLabel text={routineName}></SelectableLabel>}>
                {renderParameters(catalog, schema, routineName)}
            </TreeNode>);
    }

    function renderTables(catalog: string, schema: string) {
        const tables = ArrayUtil.distinct(tableMetaData
            .filter(item => item.table_type === "BASE TABLE")
            .filter(item => item.table_catalog == catalog)
            .filter(item => item.table_schema == schema)
            .map(item => item.table_name));

        return tables.map(tableName =>
            <TreeNode className="table" isCollapsed={true}
                header={<SelectableLabel text={tableName}></SelectableLabel>}>
                {renderColumns(catalog, schema, tableName)}
            </TreeNode>);
    }

    function renderViews(catalog: string, schema: string) {
        const views = ArrayUtil.distinct(tableMetaData
            .filter(item => item.table_type === "VIEW")
            .filter(item => item.table_catalog == catalog)
            .filter(item => item.table_schema == schema)
            .map(item => item.table_name));

        return views.map(tableName =>
            <TreeNode className="table" isCollapsed={true}
                header={<SelectableLabel text={tableName}></SelectableLabel>}>
                {renderColumns(catalog, schema, tableName)}
            </TreeNode>);
    }

    function renderParameters(catalog: string, schema: string, routineName: string) {
        const parameters = ArrayUtil.orderBy(
            procedureMetaData
                .filter(item => item.routine_catalog == catalog)
                .filter(item => item.routine_schema == schema)
                .filter(item => item.routine_name === routineName),
            item => item.ordinal_position);

        return parameters.map(parameter =>
            <TreeNode className="parameter" isCollapsed={true}
                header={
                    <span>
                        <SelectableLabel text={parameter.parameter_name}></SelectableLabel>
                        <span className="parameter-direction">{parameter.parameter_mode}</span>
                        <span className="data-type">{parameter.data_type}</span>
                    </span>
                }>
            </TreeNode>);
    }

    function renderColumns(catalog: string, schema: string, tableName: string) {
        const columns = ArrayUtil.orderBy(
            tableMetaData
                .filter(item => item.table_catalog == catalog)
                .filter(item => item.table_schema == schema)
                .filter(item => item.table_name === tableName),
            item => item.ordinal_position);

        return columns.map(column =>
            <TreeNode className="column" isCollapsed={true}
                header={
                    <span>
                        <SelectableLabel text={column.column_name}></SelectableLabel>
                        <span className="data-type">{column.data_type}</span>                    
                    </span>
                }>
            </TreeNode>);
    }

    return (
        <div className="explorer-panel">
            {renderTree()}
        </div>
    );
}