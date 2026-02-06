import * as OBC from "@thatopen/components"

/**
 * Sets up the Clipper component for creating and managing section planes.
 * 
 * The Clipper allows users to create clipping planes that cut through the 3D model,
 * revealing internal structures. This is essential for section views and detailed
 * inspections of the BIM model.
 * 
 * @param components - The ThatOpen Components instance
 * @param world - The 3D world where clipping planes will be created
 */
export const setupClipper = (components: OBC.Components, world: OBC.World) => {
  const clipper = components.get(OBC.Clipper)
  
  // Enable the clipper component
  clipper.enabled = true
  
  // Setup with default configuration
  // The clipper will use the world to create and manage clipping planes
  clipper.setup()
  
  // Optional: Configure default settings for new clipping planes
  // These can be customized based on project requirements
  
  return clipper
}
