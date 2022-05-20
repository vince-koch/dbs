import "./EditorPanel.css"
import React, { useState } from "react";
import { CommandResult, ScriptResult } from "postgresql-client";

export default function EditorPanel() {
    const [ cursorPosition, setCursorPosition ] = useState({ x: 0, y: 0 });
    const [ scriptError, setScriptError ] = useState<string>();
    const [ scriptResult, setScriptResult ] = useState<ScriptResult>();

    function getCursorPosition(textarea: HTMLTextAreaElement) {
        const textLines = textarea.value.substring(0, textarea.selectionStart).split("\n");
        const y = textLines.length;
        const x = textLines[textLines.length - 1].length + 1;
        const position = { x, y };

        return position;
    }

    async function onExecute(query: string) {
        try {
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
    }

    function onKeyDown(e: React.KeyboardEvent) {
        const target = e.target as HTMLTextAreaElement;

        if (e.key === "F5") {
            e.preventDefault();

            const start = Math.max(0, target.selectionStart);
            const end = Math.min(target.value.length, target.selectionEnd);
            const selectedText = end - start !== 0
                ? target.value.substring(target.selectionStart, target.selectionEnd)
                : target.value;

            // todo: execute the query and add a tab for the results
            console.info("selected text = ", { start, end, text: selectedText });
            if (selectedText.length > 0) {
                onExecute(selectedText);
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

    function renderCommandResult(result: CommandResult) {
        return (
            <table>
                <thead>
                    <tr>
                        {result.fields.map(field => <td>{field.fieldName}</td>)}
                    </tr>
                </thead>
                <tbody>
                    {result.rows.map(row => <tr>{row.map(cell => <td>{cell}</td>)}</tr>)}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan={result.rows.length}>{result.rowsAffected ?? result.rows?.length} rows affected in {result.executeTime} ms</td>
                    </tr>
                </tfoot>
            </table>
        );
    }

    function renderScriptResult() {
        if (scriptResult === null || scriptResult === undefined) {
            return null;
        }

        return scriptResult.results.map(result => renderCommandResult(result));
    }

    function renderScriptError() {
        if (scriptError === null || scriptError === undefined) {
            return null;
        }

        return <div className="error">{scriptError}</div>;
    }

    return (
        <div className="editor-panel">
            <div className="editor-footer">
                {cursorPosition.x}, {cursorPosition.y}
            </div>
            <textarea className="editor-text" onKeyDown={e => onKeyDown(e)} onKeyUp={e => onKeyUp(e)}></textarea>
            {renderScriptError()}
            {renderScriptResult()}
        </div>
    );
}