import "./EditorPanel.css"
import "./Loader.css"
import React, { useState } from "react";
import * as Db from "../server/DbAdapter";
import { indent, unindent } from "indent-textarea";

export default function EditorPanel() {
    const [ cursorPosition, setCursorPosition ] = useState({ x: 1, y: 1 });
    const [ isBusy, setIsBusy ] = useState<boolean>(false);
    const [ scriptError, setScriptError ] = useState<string>();
    const [ scriptResult, setScriptResult ] = useState<Db.IDbQueryResult[]>();

    function getCursorPosition(textarea: HTMLTextAreaElement) {
        const textLines = textarea.value.substring(0, textarea.selectionStart).split("\n");
        const y = textLines.length;
        const x = textLines[textLines.length - 1].length + 1;
        const position = { x, y };

        return position;
    }

    async function onExecute(query: string): Promise<void> {
        try {
            setIsBusy(true);
            setScriptError(undefined);
            setScriptResult(undefined);

            const response = await fetch("/api/db/execute", {
                method: "POST",
                cache: "no-cache",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ query: query })
            });

            var result = await response.json();
            if (result.error) {
                setScriptError(result.error);
            }
            else {
                setScriptResult(result);
            }
        }
        catch (thrown) {
            console.error("error caught while doing postgres stuff", thrown);
        }
        finally {
            setIsBusy(false);
        }
    }

    function onKeyDown(e: React.KeyboardEvent): void {
        const target = e.target as HTMLTextAreaElement;

        if (e.key === "F5") {
            e.preventDefault();

            const start = Math.max(0, target.selectionStart);
            const end = Math.min(target.value.length, target.selectionEnd);
            const selectedText = end - start !== 0
                ? target.value.substring(target.selectionStart, target.selectionEnd)
                : target.value;

            // todo: execute the query and add a tab for the results
            if (selectedText.length > 0) {
                onExecute(selectedText);
            }
        }

        if (e.key === "Tab") {
            e.preventDefault();
            if (!e.shiftKey) {
                indent(target);
            }
            else {
                unindent(target);
            }
        }
    }

    function onKeyUp(e: React.KeyboardEvent) {
        const target = e.target as HTMLTextAreaElement;
        const position = getCursorPosition(target);
        setCursorPosition(position);
    }

    function onMouseClicked(e: React.MouseEvent) {
        const target = e.target as HTMLTextAreaElement;
        const position = getCursorPosition(target);
        setCursorPosition(position);
    }

    function renderQueryResult(result: Db.IDbQueryResult) {
        console.info("result ==> ", result);
        return (
            <table>
                <thead>
                    <tr>
                        {result.fields.map(field => <th>{field.name}</th>)}
                    </tr>
                </thead>
                <tbody>
                    {result.rows.map(row => <tr>{Object.values(row).map((cell: any) => <td>{cell}</td>)}</tr>)}
                </tbody>
                <tfoot>
                    <tr>
                        <td colSpan={result.fields.length}>{result.rowCount ?? result.rows?.length} rows affected</td>
                    </tr>
                </tfoot>
            </table>
        );
    }

    function renderScriptResult() {
        if (scriptResult === null || scriptResult === undefined) {
            return null;
        }

        if (Array.isArray(scriptResult)) {
            return scriptResult.map(result => renderQueryResult(result));
        }
        else {
            return renderQueryResult(scriptResult);
        }

    }

    function renderScriptError() {
        if (scriptError === null || scriptError === undefined) {
            return null;
        }

        return <div className="error">{scriptError}</div>;
    }

    return (
        <div className="editor-panel">
            <textarea className="editor-text" onKeyDown={e => onKeyDown(e)} onKeyUp={e => onKeyUp(e)} spellCheck={false}></textarea>
            <div className="editor-status">
                {isBusy ? <i className="loader --4" style={{ width: "10px" }}></i> : null }
                <span>Ln {cursorPosition.y}, Col {cursorPosition.x}</span>
            </div>
            {renderScriptError()}
            {renderScriptResult()}
        </div>
    );
}