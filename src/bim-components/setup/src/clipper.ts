import * as OBC from "@thatopen/components"

let isClipperInteractionSetup = false;
let cleanupFunctions: Array<() => void> = [];

export const setupClipper = (components: OBC.Components, world: OBC.World) => {
  const clipper = components.get(OBC.Clipper);
  
  // Setup clipper configuration
  clipper.enabled = true;
  clipper.config.enabled = true;
  clipper.config.visible = true;
  
  // Prevent duplicate event listener setup
  if (isClipperInteractionSetup) {
    return;
  }
  isClipperInteractionSetup = true;

  // Double-click to create section plane
  const handleDoubleClick = async () => {
    if (!clipper.enabled) return;
    try {
      await clipper.create(world);
    } catch (error) {
      console.error("Error creating section plane:", error);
    }
  };

  // Delete key to remove the last plane
  const handleKeyDown = async (event: KeyboardEvent) => {
    if (!clipper.enabled) return;
    
    if (event.key === "Delete" || event.key === "Backspace") {
      // Get all planes and delete the most recently created one
      const planes = Array.from(clipper.list.entries());
      if (planes.length > 0) {
        const [lastPlaneId] = planes[planes.length - 1];
        try {
          await clipper.delete(world, lastPlaneId);
        } catch (error) {
          console.error("Error deleting section plane:", error);
        }
      }
    }
  };

  // Add event listeners to the viewport canvas
  const canvas = world.renderer?.three.domElement;
  if (canvas) {
    canvas.addEventListener("dblclick", handleDoubleClick);
    cleanupFunctions.push(() => canvas.removeEventListener("dblclick", handleDoubleClick));
  }

  window.addEventListener("keydown", handleKeyDown);
  cleanupFunctions.push(() => window.removeEventListener("keydown", handleKeyDown));

  // Memory leak prevention - cleanup on disposal
  const originalDispose = clipper.dispose.bind(clipper);
  clipper.dispose = () => {
    // Remove all event listeners
    cleanupFunctions.forEach(cleanup => cleanup());
    cleanupFunctions = [];
    isClipperInteractionSetup = false;
    originalDispose();
  };
}
