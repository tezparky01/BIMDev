import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"

export const setupClipper = (components: OBC.Components, world: OBC.World) => {
  const clipper = components.get(OBF.Clipper)
  clipper.enabled = true
  
  // Setup clipper with the world
  clipper.setup({ world })
}
