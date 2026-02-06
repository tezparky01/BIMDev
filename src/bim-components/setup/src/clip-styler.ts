import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"

export const setupClipStyler = (components: OBC.Components, world: OBC.World) => {
  const clipStyler = components.get(OBF.ClipStyler)
  
  // Setup clip styler with the world
  try {
    clipStyler.world = world
    clipStyler.enabled = true
  } catch (error) {
    console.warn("Error setting up clip styler:", error)
  }
}
