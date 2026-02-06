import * as OBC from "@thatopen/components"

export const setupClipper = (components: OBC.Components, world: OBC.World) => {
  const clipper = components.get(OBC.Clipper)
  
  // Clipper is now ready to use
  try {
    clipper.enabled = true
  } catch (error) {
    console.warn("Error setting up clipper:", error)
  }
}
