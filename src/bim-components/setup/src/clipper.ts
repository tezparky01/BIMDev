import * as OBC from "@thatopen/components"

/**
 * Track if clipper interaction has been set up to prevent duplicate event listeners.
 */
let isClipperInteractionSetup = false;

/**
 * Initializes the Clipper component for creating sectioning planes in 3D models.
 * 
 * The Clipper allows users to:
 * - Double-click on a model to create a clipping plane at that location
 * - Press Delete key to remove clipping planes
 * - Use toolbar buttons to manage all clipping planes
 */
export const setupClipper = (components: OBC.Components, world: OBC.World) => {
  const clipper = components.get(OBC.Clipper);
  clipper.enabled = true;
  
  // Configure default clipper settings
  clipper.config.enabled = true;
  clipper.config.visible = true;

  // Only setup interaction once to prevent memory leaks
  if (isClipperInteractionSetup) return;
  isClipperInteractionSetup = true;

  // Add double-click handler to create clipping planes
  const setupClipperInteraction = () => {
    const renderer = world.renderer as OBC.SimpleRenderer;
    const canvas = renderer?.three.domElement;
    
    if (canvas) {
      // Double-click to create clipping plane at cursor position
      const handleDoubleClick = () => {
        if (clipper.enabled) {
          clipper.create(world);
        }
      };
      canvas.addEventListener('dblclick', handleDoubleClick);
    }
  };

  // Add keyboard handler to delete clipping planes
  const handleKeyDown = (event: KeyboardEvent) => {
    // Only handle Delete key to avoid navigation conflicts
    if (event.code === 'Delete') {
      if (clipper.enabled) {
        event.preventDefault(); // Prevent default delete behavior
        clipper.delete(world);
      }
    }
  };
  window.addEventListener('keydown', handleKeyDown);

  // Wait for renderer to be ready before setting up canvas interactions
  const RENDERER_READY_DELAY = 100;
  setTimeout(setupClipperInteraction, RENDERER_READY_DELAY);
}
