"use client";

import { useCallback, useMemo, useState,useEffect } from "react";
import { nanoid } from "nanoid";
import {
  Camera,
  canvasMode,
  CanvasState,
  LayerType,
  Point,
  Color,
  Side,
  XYWH,
} from "@/types/canvas";
import { Info } from "./info";
import { Participants } from "./participants";
import { Toolbar } from "./toolbar";
import { BoardChat } from "./board-chat";
import {
  useHistory,
  useCanUndo,
  useCanRedo,
  useMutation,
  useStorage,
  useOthersMapped,
  useSelf,
} from "@/liveblocks.config";
import { CursorsPresence } from "./cursors-presence";
import {
  colorsToCss,
     connectionIdToColor,
     findIntersectingLayersWithRectangle,
     penPointsToPathLayer,
     pointerEventToCanvasPoint,
     resizeBounds
     } from "@/lib/utils";
import { LiveObject } from "@liveblocks/client";
import { LayerPreview } from "./layer-preview";
import { SelectionBox } from "./selection-box";
import { SelectionTools } from "./selection-tools";
import { Path } from "./path";
import { useDisableScrollBounce } from "@/hooks/use-disable-scroll-bounce";
import { useDeleteLayers } from "@/hooks/use-delete-layers";
import { on } from "events";

const MAX_LAYERS = 100;

interface CanvasProps {
  boardId: string;
}

export const Canvas = ({ boardId }: CanvasProps) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const layerIds = useStorage((root) => root.layerIds);

  const pencilDraft = useSelf((me) => me.presence.pencilDraft);
  const [canvasState, setCanvasState] = useState<CanvasState>({
    mode: canvasMode.None,
  });

  const [camera, setCamera] = useState<Camera>({ x: 0, y: 0 });

  const [lastUsedColor, setLastUsedColor] = useState<Color>({
    r: 0,
    g: 0,
    b: 0,
  });

  

  useDisableScrollBounce();
  const history = useHistory();
  const canUndo = useCanUndo();
  const canRedo = useCanRedo();

  const insertLayer = useMutation(
    ({ storage, setMyPresence }, layerType: LayerType.Ellipse | LayerType.Rectangle | LayerType.Text | LayerType.Note, position: Point
    ) => {
      const liveLayers = storage.get("layers");
      if (liveLayers.size >= MAX_LAYERS) {return};

      const liveLayerIds = storage.get("layerIds");
      const layerId = nanoid();

      const layer = new LiveObject({
        type: layerType,
        x: position.x,
        y: position.y,
        width: 100,
        height: 100,
        fill: lastUsedColor,
      });

      liveLayerIds.push(layerId);
      liveLayers.set(layerId, layer);

      setMyPresence({ selection: [layerId] }, { addToHistory: true });
      setCanvasState({ mode: canvasMode.None });
    },
    [lastUsedColor]
  );

  const translateSelectedLayers = useMutation(({storage, self},
    point : Point,
  )=>{
    if(canvasState.mode !== canvasMode.Translating){
      return;
    }

    const offset ={
      x:point.x - canvasState.current.x,
      y: point.y - canvasState.current.y,
    };

    const liveLayers = storage.get("layers");

    for(const id of self.presence.selection){
      const layer = liveLayers.get(id);

      if(layer) {
        layer.update({
          x:layer.get("x") + offset.x,
          y:layer.get("y") + offset.y,

        });


      }
    }

    setCanvasState({mode: canvasMode.Translating, current:point});
  },[
    canvasState,
  ]);


  const unSelectedLayers = useMutation((
    {self , setMyPresence}
  )=>{
    if(self.presence.selection.length>0)
    {
      setMyPresence({selection:[]}, {addToHistory: true});
    }
  },[]);

  const updateSelectionNet = useMutation((
    { storage, setMyPresence },
    current: Point,
    origin: Point,
  ) =>{
    const layers = storage.get("layers").toImmutable();
    setCanvasState({
      mode: canvasMode.SelectionNet,
      origin,
      current,
    });

    const ids = findIntersectingLayersWithRectangle(
      layerIds,
      layers,
      origin,
      current,
    );

    setMyPresence({ selection: ids });
  }, [layerIds]);

  const startMultiSelection = useCallback((
    current: Point,
    origin: Point,
  ) => {
    if (
      Math.abs(current.x - origin.x) + Math.abs(current.y - origin.y) > 5
  ) {
    setCanvasState({
      mode: canvasMode.SelectionNet,
      origin,
      current,
    });
  }
  }, []);

  const continueDrawing = useMutation((
    { self, setMyPresence },
    point: Point,
    e: React.PointerEvent,
  ) => {
    const { pencilDraft } = self.presence;

    if(
      canvasState.mode !== canvasMode.Pencil ||
      e.buttons !== 1 ||
      pencilDraft == null
    ) {
      return;
    }

    setMyPresence({
      cursor: point,
      pencilDraft:
      pencilDraft.length === 1 &&
      pencilDraft[0][0] === point.x &&
      pencilDraft[0][1] === point.y
      ? pencilDraft
      : [...pencilDraft, [point.x, point.y, e.pressure]],
    });
  }, [canvasState.mode]);

  const insertPath = useMutation((
    { storage, self, setMyPresence }
  ) => {
    const liveLayers = storage.get("layers");
    const { pencilDraft } = self.presence;

    if(
      pencilDraft == null ||
      pencilDraft.length < 2 ||
      liveLayers.size >= MAX_LAYERS
    ) {
      setMyPresence({ pencilDraft: null });
      return;
    }

    const id = nanoid();
    liveLayers.set(
      id,
      new LiveObject(penPointsToPathLayer(
        pencilDraft,
        lastUsedColor,
      )),
    );

    const liveLayerIds = storage.get("layerIds");
    liveLayerIds.push(id);

    setMyPresence({ pencilDraft: null });
    setCanvasState({ mode: canvasMode.Pencil });

  }, [lastUsedColor]);

  const startDrawing = useMutation((
    { setMyPresence },
    point: Point,
    pressure: number,
  ) => {
    setMyPresence({
      pencilDraft: [[point.x, point.y, pressure]],
      penColor: lastUsedColor,
    })
  }, [lastUsedColor]);

  const resizeSelectedLayer = useMutation((
    {storage, self},
    point :Point,
  ) =>{
    if(canvasState.mode !== canvasMode.Resizing) {
      return;
    }
    const bounds = resizeBounds(
      canvasState.initialBounds,
      canvasState.corner,
      point,  
    );

    const liveLayers = storage.get("layers");
    const layer = liveLayers.get(self.presence.selection[0]);

    if(layer){
      layer.update(bounds);
    };
  },[canvasState])


   const onResizeHandlePointerDown = useCallback((
    corner : Side,
    initialBounds: XYWH,
   ) =>
  {
   history.pause();
   setCanvasState({
    mode:canvasMode.Resizing,
    initialBounds,
    corner,

   });
  },[history])

  const onWheel = useCallback((e: React.WheelEvent) => {
    setCamera((camera) => ({
      x: camera.x - e.deltaX,
      y: camera.y - e.deltaY,
    }));
  }, []);

  const onPointerMove = useMutation(
    ({ setMyPresence }, e: React.PointerEvent) => {
      e.preventDefault();

      const current = pointerEventToCanvasPoint(e, camera);

      if ( canvasState.mode === canvasMode.Pressing){
        startMultiSelection (current, canvasState.origin);
      }
      else if( canvasState.mode === canvasMode.SelectionNet) {
        updateSelectionNet( current, canvasState.origin);
      }
      else if(canvasState.mode === canvasMode.Translating){
          translateSelectedLayers(current);
      }

      else if(canvasState.mode === canvasMode.Resizing) {

        resizeSelectedLayer(current);
      }

      else if (canvasState.mode === canvasMode.Pencil) {
        continueDrawing(current, e);
      }

      setMyPresence({ cursor: current });
    },
    [
      continueDrawing,
      camera,
      canvasState,
      resizeSelectedLayer,
      translateSelectedLayers,
      startMultiSelection,
      updateSelectionNet,
    ]
  );

  const onPointerLeave = useMutation(({ setMyPresence }) => {
    setMyPresence({ cursor: null });
  }, []);

  const onPointerDown = useCallback((
    e: React.PointerEvent,

  )=>{
      const point = pointerEventToCanvasPoint(e, camera);

      if(canvasState.mode === canvasMode.Inserting){
        return;

      }
       
      if (canvasState.mode === canvasMode.Pencil) {
        startDrawing(point , e.pressure);
        return;
      }

        setCanvasState({origin:point, mode: canvasMode.Pressing});

  },[camera, canvasState.mode, setCanvasState, startDrawing]);

  const onPointerUp = useMutation((
    {},
     e
    ) => {
      const point = pointerEventToCanvasPoint(e, camera);
  
      if (
        canvasState.mode === canvasMode.None ||
        canvasState.mode === canvasMode.Pressing
      ) {
        unSelectedLayers();
        setCanvasState({ mode: canvasMode.None, });
      }
        else if (canvasState.mode === canvasMode.Pencil){
          insertPath();
        }
       
       else if (
          canvasState.mode === canvasMode.Inserting) {
          insertLayer(canvasState.layerType, point);
        }
       else {
        setCanvasState({ mode: canvasMode.None });
      }
  
      history.resume();
    },
    [setCanvasState, camera, canvasState, history, insertLayer,unSelectedLayers, insertPath]
  );
  

  const selections = useOthersMapped((other) => other.presence.selection);

  const onLayerPointerDown = useMutation((
    { self, setMyPresence },
    e: React.PointerEvent,
    layerId: string,
  ) => {
    if (
      canvasState.mode === canvasMode.Pencil ||
      canvasState.mode === canvasMode.Inserting
    ) {
      return;
    }

    history.pause();
    e.stopPropagation();

    const point = pointerEventToCanvasPoint(e, camera);

    if(!self.presence.selection.includes(layerId)) {
      setMyPresence({ selection: [layerId] }, { addToHistory: true });
    }
      setCanvasState({ mode: canvasMode.Translating, current: point });
  },
  [
    setCanvasState,
    camera,
    history,
    canvasState.mode,
  ]);

  const layerIdsToColorSelection = useMemo(() => {
    const layerIdsToColorSelection: Record<string, string> = {};

    for(const user of selections) {
      const [connectionId, selection] = user;

      for(const layerId of selection) {
        layerIdsToColorSelection[layerId] = connectionIdToColor(connectionId)
      }
    }

    return layerIdsToColorSelection;
  }, [selections]);

  const deleteLayers = useDeleteLayers();

  useEffect(()=>{
    function onKeyDown(e: KeyboardEvent){
      switch (e.key){
        // case "Backspace":
        //   deleteLayers();
        //   break;
        case "z" : {
          if(e.ctrlKey || e.metaKey){
            if(e.shiftKey){
              history.redo();
            }
            else{
              history.undo();
            }
            break;
          }
        }
        
      }
    }
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown)
    }
  },[deleteLayers, history])

  return (
    <main className="h-full w-full relative bg-neutral-100 touch-none">
      <Info boardId={boardId} />
      <Participants />
      <Toolbar
        CanvasState={canvasState}
        SetCanvasState={setCanvasState}
        canUndo={canUndo}
        canRedo={canRedo}
        undo={history.undo}
        redo={history.redo}
      />

      <SelectionTools
      camera ={camera}
      setLastUsedColor={setLastUsedColor}

      />

      {isChatOpen && <BoardChat onClose={() => setIsChatOpen(false)} />}
      <button
        onClick={() => setIsChatOpen(true)}
        className="absolute bottom-4 right-4 p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6 text-gray-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </button>

      <svg
        className="h-[100vh] w-[100vw]"
        onWheel={onWheel}
        onPointerMove={onPointerMove}
        onPointerLeave={onPointerLeave}
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <g
        style={{ transform: `translate(${camera.x}px, ${camera.y}px)`
        }}
        >
          {layerIds?.map((layerId) => (
            <LayerPreview
              key={layerId}
              id={layerId}
              onLayerPointerDown={onLayerPointerDown}
              selectionColor={layerIdsToColorSelection[layerId]}
            />
          ))}
          <SelectionBox
            onResizeHandlePointerDown= {onResizeHandlePointerDown}
          />
          {canvasState.mode === canvasMode.SelectionNet && canvasState.current != null && (
            <rect  
            className="fill-blue-500/5 stroke-blue-500 stroke-1"
            x={Math.min(canvasState.origin.x, canvasState.current.x)}
            y={Math.min(canvasState.origin.y, canvasState.current.y)}
            width = {Math.abs(canvasState.origin.x- canvasState.current.x)}
            height = {Math.abs(canvasState.origin.y- canvasState.current.y)}
            />
          )}
          <CursorsPresence />

          {pencilDraft != null && pencilDraft.length > 0 && (
            <Path
              points={pencilDraft}
              fill={colorsToCss(lastUsedColor)}
              x={0}
              y={0}
              />
          )}
        </g>
      </svg>
    </main>
  );
};
