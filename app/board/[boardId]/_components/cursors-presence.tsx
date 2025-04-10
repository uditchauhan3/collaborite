"use client";

import { memo } from "react";
import { shallow } from "@liveblocks/client";

import { useOthersConnectionIds,useOthersMapped } from "@/liveblocks.config";
import { Cursor } from "./cursor";
import { Path } from "./path";
import { colorsToCss } from "@/lib/utils";



const Cursors = () => {
    const ids = useOthersConnectionIds();

    return (
        <>
            {ids.map((connectionId) => (
                <Cursor
                key={connectionId}
                connectionId={connectionId}
                />
            ))}
        </>
    );
};

const Draft =() =>{
    const others = useOthersMapped((other)=>({
        pencilDraft : other.presence.pencilDraft,
        penColor : other.presence.penColor,
    }),shallow);
return(
    <>
    {others.map(([key,others])=>{
        if(others.pencilDraft){
            return(
                <Path
                key={key}
                x={0}
                y={0}
                points= {others.pencilDraft}
                fill ={others.penColor? colorsToCss(others.penColor): "#000"}
                />
            )
        }
        return null;
    }
    
    )}
    </>
)}

export const CursorsPresence = memo(() => {
    return (
        <>
        <Draft/>
          <Cursors />
        </>
    );
});

CursorsPresence.displayName = "CursorsPresence";