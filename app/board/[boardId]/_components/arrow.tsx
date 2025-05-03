import { colorsToCss } from "@/lib/utils";
import { ArrowLayer, ArrowStyle, ArrowPoint } from "@/types/canvas";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowRight, ArrowUp, ArrowDown, ArrowLeft,
  Maximize2, Minimize2, ArrowLeftRight
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useMutation } from "@/liveblocks.config";
import { LiveObject } from "@liveblocks/client";

interface ArrowProps {
  id: string;
  layer: ArrowLayer;
  onPointerDown: (e: React.PointerEvent, id: string) => void;
  selectionColor?: string;
}

export const Arrow = ({ id, layer, onPointerDown, selectionColor }: ArrowProps) => {
  const { points = [], fill, strokeWidth = 2, arrowStyle = ArrowStyle.Right, isDashed = false } = layer;
  const [showStylePanel, setShowStylePanel] = useState(false);

  const updateArrowStyle = useMutation(({ storage }, newStyle: ArrowStyle) => {
    const liveLayer = storage.get("layers").get(id) as LiveObject<ArrowLayer>;
    if (!liveLayer) return;

    const currentPoints = liveLayer.get("points") as ArrowPoint[];
    if (!currentPoints || !currentPoints[0]) return;

    const { x1, y1, x2, y2 } = currentPoints[0];
    const length = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    let newX2 = x2;
    let newY2 = y2;

    switch (newStyle) {
      case ArrowStyle.Up:
        newX2 = x1;
        newY2 = y1 - length;
        break;
      case ArrowStyle.Down:
        newX2 = x1;
        newY2 = y1 + length;
        break;
      case ArrowStyle.Left:
        newX2 = x1 - length;
        newY2 = y1;
        break;
      case ArrowStyle.Right:
        newX2 = x1 + length;
        newY2 = y1;
        break;
      case ArrowStyle.Double:
        // Keep the current points for double arrow
        break;
      case ArrowStyle.Dashed:
        liveLayer.set("isDashed", true);
        liveLayer.set("arrowStyle", newStyle);
        return;
      case ArrowStyle.Thick:
        liveLayer.set("strokeWidth", 4);
        liveLayer.set("arrowStyle", newStyle);
        return;
      case ArrowStyle.Thin:
        liveLayer.set("strokeWidth", 1);
        liveLayer.set("arrowStyle", newStyle);
        return;
      default:
        break;
    }

    const newPoints: ArrowPoint[] = [{ x1, y1, x2: newX2, y2: newY2 }];
    liveLayer.set("points", newPoints);
    liveLayer.set("arrowStyle", newStyle);
    liveLayer.set("isDashed", false);
    liveLayer.set("strokeWidth", 2);
  }, []);

  const updateArrowLength = useMutation(({ storage }, newLength: number) => {
    const liveLayer = storage.get("layers").get(id) as LiveObject<ArrowLayer>;
    if (!liveLayer) return;

    const currentPoints = liveLayer.get("points") as ArrowPoint[];
    if (!currentPoints || !currentPoints[0]) return;

    const { x1, y1, x2, y2 } = currentPoints[0];
    const angle = Math.atan2(y2 - y1, x2 - x1);
    const newX2 = x1 + newLength * Math.cos(angle);
    const newY2 = y1 + newLength * Math.sin(angle);

    const newPoints: ArrowPoint[] = [{ x1, y1, x2: newX2, y2: newY2 }];
    liveLayer.set("points", newPoints);
    
    // Update the layer's width and height
    const width = Math.abs(newX2 - x1);
    const height = Math.abs(newY2 - y1);
    liveLayer.set("width", width);
    liveLayer.set("height", height);
  }, []);

  const { x1 = 0, y1 = 0, x2 = 50, y2 = 0 } = points[0] || {};
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const arrowLength = 10;
  const arrowWidth = 6;

  const createArrowHead = (x: number, y: number) => ({
    x1: x - arrowLength * Math.cos(angle - Math.PI / 6),
    y1: y - arrowLength * Math.sin(angle - Math.PI / 6),
    x2: x - arrowLength * Math.cos(angle + Math.PI / 6),
    y2: y - arrowLength * Math.sin(angle + Math.PI / 6),
  });

  const forwardHead = createArrowHead(x2, y2);
  const backwardHead = createArrowHead(x1, y1);
  const currentLength = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

  // Calculate the bounding box for better selection
  const minX = Math.min(x1, x2);
  const maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2);
  const maxY = Math.max(y1, y2);
  const padding = 10;

  return (
    <g onPointerDown={(e) => onPointerDown(e, id)}>
      {/* Invisible rectangle for better selection */}
      <rect
        x={minX - padding}
        y={minY - padding}
        width={maxX - minX + 2 * padding}
        height={maxY - minY + 2 * padding}
        fill="transparent"
        stroke="transparent"
        pointerEvents="all"
      />

      {/* Selection highlight */}
      {selectionColor && (
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke={selectionColor}
          strokeWidth={strokeWidth + 4}
          strokeLinecap="round"
          strokeDasharray={isDashed ? "5,5" : undefined}
        />
      )}

      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={colorsToCss(fill)}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={isDashed ? "5,5" : undefined}
      />

      {(arrowStyle === ArrowStyle.Right || arrowStyle === ArrowStyle.Double) && (
        <path
          d={`M ${x2} ${y2} L ${forwardHead.x1} ${forwardHead.y1} L ${forwardHead.x2} ${forwardHead.y2} Z`}
          fill={colorsToCss(fill)}
          stroke={colorsToCss(fill)}
          strokeWidth={strokeWidth}
        />
      )}

      {(arrowStyle === ArrowStyle.Left || arrowStyle === ArrowStyle.Double) && (
        <path
          d={`M ${x1} ${y1} L ${backwardHead.x1} ${backwardHead.y1} L ${backwardHead.x2} ${backwardHead.y2} Z`}
          fill={colorsToCss(fill)}
          stroke={colorsToCss(fill)}
          strokeWidth={strokeWidth}
        />
      )}

      {selectionColor && (
        <>
          <foreignObject x={x2 - 20} y={y2 - 20} width={40} height={40}>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="board"
                  size="icon"
                  className="h-8 w-8"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStylePanel(!showStylePanel);
                  }}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Right)}>
                  <ArrowRight className="h-4 w-4 mr-2" />Right Arrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Left)}>
                  <ArrowLeft className="h-4 w-4 mr-2" />Left Arrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Up)}>
                  <ArrowUp className="h-4 w-4 mr-2" />Up Arrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Down)}>
                  <ArrowDown className="h-4 w-4 mr-2" />Down Arrow
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Double)}>
                  <ArrowLeftRight className="h-4 w-4 mr-2" />Double Arrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Dashed)}>
                  <ArrowRight className="h-4 w-4 mr-2" />Dashed Arrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Thick)}>
                  <ArrowRight className="h-4 w-4 mr-2" />Thick Arrow
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => updateArrowStyle(ArrowStyle.Thin)}>
                  <ArrowRight className="h-4 w-4 mr-2" />Thin Arrow
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </foreignObject>

          <foreignObject x={(x1 + x2) / 2 - 20} y={(y1 + y2) / 2 - 20} width={40} height={40}>
            <div className="flex gap-2">
              <Button
                variant="board"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  updateArrowLength(currentLength - 10);
                }}
              >
                <Minimize2 className="h-4 w-4" />
              </Button>
              <Button
                variant="board"
                size="icon"
                className="h-8 w-8"
                onClick={(e) => {
                  e.stopPropagation();
                  updateArrowLength(currentLength + 10);
                }}
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            </div>
          </foreignObject>
        </>
      )}
    </g>
  );
};