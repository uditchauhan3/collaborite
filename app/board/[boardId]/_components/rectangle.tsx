import { RectangleLayer } from "@/types/canvas";

interface RectangleProps{
    id:string,
    layer:RectangleLayer;
    onPointerDown:(e:React.PointerEvent,id:string)=>void;
    selectionColor?:string;
};

export const Rectangle =({
    id,
    layer,
    onPointerDown,
    selectionColor,
}:RectangleProps)=>{

}