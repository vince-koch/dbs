import "./TreeNode.css";
import "./chevron.css";
import { useState } from "react";

export interface ITreeNodeProps {
    children?: JSX.Element[] | JSX.Element;
    className?: string;
    header?: JSX.Element[] | JSX.Element;
    isCollapsed?: boolean;
}

export default function TreeNode(props: ITreeNodeProps) {
    const [ isCollapsed, setIsCollapsed ] = useState<boolean | undefined>(props.isCollapsed);
    
    const chevronClassName = isCollapsed
        ? "chevron chevron-right"
        : "chevron chevron-down";
    
    const childrenStyle = isCollapsed 
        ? { display: "none" }
        : { display: "block" };

    function toggleIsCollapsed() {
        setIsCollapsed(!isCollapsed);
    }

    return (
        <li className={"tree-node " + props.className}>
            <div>
                <i className={chevronClassName} onClick={() => toggleIsCollapsed()}></i>
                &nbsp;
                {props.header}
            </div>
            <ul style={childrenStyle}>
                {props.children}
            </ul>
        </li>);
}