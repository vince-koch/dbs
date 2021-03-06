import "./App.css"
import { useEffect, useRef, useState } from "react"
import * as FlexLayout from "flexlayout-react";
import ExplorerPanel from "./ExplorerPanel";
import EditorPanel from "./EditorPanel";
import OptionsPanel from "./OptionsPanel";
import ResultsPanel from "./ResultsPanel";
import layout from './App.layout.json';

export default function App() {
  const layoutRef = useRef<FlexLayout.Layout>(null);
  const [resultCount, setResultCount] = useState<number>(0);
  const [layoutModel, setLayoutModel] = useState(FlexLayout.Model.fromJson(layout as any));

  const layoutFactory = (node: FlexLayout.TabNode) => {
    var component = node.getComponent();

    switch (component) {
      case "EditorPanel":
        return <EditorPanel></EditorPanel>;

      case "ExplorerPanel":
        return <ExplorerPanel></ExplorerPanel>;

      case "OptionsPanel":
        return <OptionsPanel></OptionsPanel>;

      case "ResultsPanel":
        return <ResultsPanel></ResultsPanel>;

      case "button":
        return <button>{node.getName()}</button>;
    }
  }

  function addResult() {
    if (layoutRef.current === null) {
      throw new Error("layoutRef.current is null!")
    }

    const resultId = resultCount + 1;

    console.info(`add Result ${resultId}`);

    layoutRef.current?.addTabToActiveTabSet({
        type: "tab",
        name: `Result ${resultId}`,
        altName: "Result",
        component: "ResultsPanel",
        /*icon: "images/folder.svg"*/
    });

    setResultCount(resultId);
  }

  useEffect(() => {
    fetch("/api")
      .then((res) => res.json())
      .then((data) => console.info("received: ", data.message));
  }, []);

  return (
    <div className="app">
      <div className="toolbar">
        <button>Connect</button>
        <button onClick={() => addResult()}>Add Result</button>
      </div>

      <div className="contents">
        <FlexLayout.Layout ref={layoutRef} model={layoutModel} factory={layoutFactory} />
      </div>
    </div>
  )
}