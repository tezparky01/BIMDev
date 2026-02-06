import * as OBC from "@thatopen/components"

export const setupClipper = (components: OBC.Components, _world: OBC.World) => {
  const clipper = components.get(OBC.Clipper)
  
  // Initialize clipper - the world parameter is passed to create() method when creating planes
  try {
    clipper.enabled = true
  } catch (error) {
    console.warn("Error setting up clipper:", error)
  }
}
