import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"

export const setupClipper = (components: OBC.Components, world: OBC.World) => {
  const clipper = components.get(OBF.Clipper)
  
  // Setup clipper with the world
  try {
    clipper.world = world
    clipper.enabled = true
  } catch (error) {
    console.warn("Error setting up clipper:", error)
  }
}
