import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"

export const setupMeasurements = (components: OBC.Components, world: OBC.World) => {
  // Get measurement components - these are singleton instances managed by the component system
  const lengthMeasurement = components.get(OBF.LengthMeasurement)
  const areaMeasurement = components.get(OBF.AreaMeasurement)
  
  // Setup measurements with the world
  try {
    // Critical: Set the world property for both tools (required before they can be used)
    lengthMeasurement.world = world
    areaMeasurement.world = world
    
    // Start disabled, user will enable via toolbar
    lengthMeasurement.enabled = false
    areaMeasurement.enabled = false
    
    console.log("✓ Measurements initialized successfully")
  } catch (error) {
    console.error("Error setting up measurements:", error)
  }
}
