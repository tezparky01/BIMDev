import * as OBC from "@thatopen/components"

// Track if interactions have been setup to prevent duplicate event listeners
let isClipperInteractionSetup = false
// Track which clipper instances have had their dispose method wrapped
const wrappedClippers = new WeakSet<OBC.Clipper>()

/**
 * Setup the clipper component with interactive controls
 * 
 * Features:
 * - Double-click on model to create a section plane
 * - Press Delete key to remove the selected plane (global, doesn't require canvas focus)
 * - Automatic cleanup to prevent memory leaks
 * 
 * @param components - The OBC Components instance
 * @param world - The world where the clipper will operate
 */
export const setupClipper = (components: OBC.Components, world: OBC.World) => {
  const clipper = components.get(OBC.Clipper)
  
  try {
    // Setup clipper with the world (always set these, even on subsequent calls)
    clipper.world = world
    clipper.enabled = true

    // Only setup interactions once to prevent duplicate event listeners
    if (isClipperInteractionSetup) {
      return
    }
    // Set flag immediately to prevent race conditions
    isClipperInteractionSetup = true

    // Double-click event handler: Create a new clipping plane
    const onDoubleClick = () => {
      try {
        if (clipper.enabled && clipper.world) {
          clipper.create(clipper.world)
        }
      } catch (error) {
        console.warn("Error creating clipping plane:", error)
      }
    }

    // Keyboard event handler: Delete selected plane with Delete key
    // Attached to window for better UX (works without canvas focus)
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.code === "Delete" || event.key === "Delete") {
        try {
          // Get all planes and delete the most recently created one
          const planes = Array.from(clipper.list.values())
          if (planes.length > 0) {
            const lastPlane = planes[planes.length - 1]
            clipper.delete(lastPlane)
          }
        } catch (error) {
          console.warn("Error deleting clipping plane:", error)
        }
      }
    }

    // Attach event listeners to the renderer's DOM element
    const container = world.renderer?.three.domElement
    if (container) {
      container.addEventListener("dblclick", onDoubleClick)
      window.addEventListener("keydown", onKeyDown)
      
      // Store cleanup function for memory leak prevention
      // Only wrap dispose if not already wrapped
      if (!wrappedClippers.has(clipper)) {
        wrappedClippers.add(clipper)
        const originalDispose = clipper.dispose.bind(clipper)
        clipper.dispose = () => {
          container.removeEventListener("dblclick", onDoubleClick)
          window.removeEventListener("keydown", onKeyDown)
          isClipperInteractionSetup = false
          wrappedClippers.delete(clipper)
          originalDispose()
        }
      }
    }
  } catch (error) {
    console.warn("Error setting up clipper:", error)
  }
}
