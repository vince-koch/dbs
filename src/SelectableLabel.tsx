import { useState } from "react";

export interface ISelectableLabelProps {
    text: string;
}

export default function SelectableLabel(props: ISelectableLabelProps) {
    const [isHover, setIsHover] = useState(false);

    function omTextSelected(text: string) {
        console.info("text selected ==> ", text);
    }

    return (
        <span
            onMouseEnter={()=> setIsHover(true)}
            onMouseLeave={()=> setIsHover(false)}
            onClick={() => omTextSelected(props.text)}
            style={{
                cursor: "pointer",
                textDecoration: isHover ? "underline" : undefined
            }}>
            {props.text}
        </span>);
}
