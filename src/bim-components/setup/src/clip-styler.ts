import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"

/**
 * Sets up the ClipStyler component for styling clipped edges and fills.
 * 
 * The ClipStyler enhances section views by rendering edges and fills on clipped
 * geometry, making it easier to understand the internal structure of the model.
 * It works in conjunction with the Clipper component.
 * 
 * @param components - The ThatOpen Components instance
 * @param world - The 3D world where clip styling will be applied
 */
export const setupClipStyler = (components: OBC.Components, world: OBC.World) => {
  const clipStyler = components.get(OBF.ClipStyler)
  
  // The ClipStyler automatically detects clipping planes created by the Clipper
  // and generates visual edges and fills for better visualization
  
  // Optional: Create default styles for clipped edges
  // These can be customized to match project visual standards
  
  return clipStyler
}
