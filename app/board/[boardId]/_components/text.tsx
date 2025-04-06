import { Kalam } from "next/font/google";
import ContenEditable , {ContentEditableEvent} from "react-contenteditable"

import {TextLayer} from "@/types/canvas"
import { cn,colorsToCss } from "@/lib/utils";
import { useMutation } from "@/liveblocks.config";

const font = Kalam({
    subsets: ["latin"],
    weight:["400"]
});


const calculateFontSize =(width:number,height:number)=>{
    const maxFontSize = 96;
    const scaleFactor= 0.5;
    const fontSizeBasedOnHeight = height* scaleFactor;
    const fontSizeBasedOnWidth = width* scaleFactor;

    return Math.min(fontSizeBasedOnHeight,fontSizeBasedOnWidth,maxFontSize)
}

interface TextProps {

    id:string;
    layer:TextLayer;
    onPointDown:(e: React.PointerEvent,id:string)=> void;
    selectionColor?: string;

};
export const Text=({
    layer,
    onPointDown,
    id,
    selectionColor,

}:TextProps)=>{
    const { x,y,width,value,height,fill}= layer;
    return (
        <foreignObject
        x={x}
        y={y}
        width={width}
        height={height}
        onPointerDown={(e)=>onPointDown(e,id)}
        style={{
            outline: selectionColor ? `1px solid ${selectionColor}` : "none"
        }}
        >
            <ContenEditable
            html={"Text"}
            onChange={() => {}}
            className={cn(
                "h-full w-full flex items-center justify-center text-center drop-shadow-md outline-none",
                font.className
            )}
            style={{
                fontSize : calculateFontSize(width,height),
                color: fill ? colorsToCss(fill) : "#000",

            }}
            />
        </foreignObject>
    )
}