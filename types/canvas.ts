// canvas.ts

export enum canvasMode {
    None = "none",
    Select = "select",
    Draw = "draw",
    Text = "text",
    // Add more modes if needed
  }
  
  export type CanvasState = {
    mode: canvasMode; // lowercase 'mode' to match usage
  }
  