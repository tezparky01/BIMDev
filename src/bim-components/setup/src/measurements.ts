import * as OBC from "@thatopen/components"
import * as OBF from "@thatopen/components-front"

export const setupMeasurements = (components: OBC.Components, world: OBC.World) => {
  const lengthMeasurement = components.get(OBF.LengthMeasurement)
  const areaMeasurement = components.get(OBF.AreaMeasurement)
  
  // Setup measurements with the world
  try {
    lengthMeasurement.world = world
    lengthMeasurement.enabled = false // Start disabled, user will enable via toolbar
    
    areaMeasurement.world = world
    areaMeasurement.enabled = false // Start disabled, user will enable via toolbar
  } catch (error) {
    console.warn("Error setting up measurements:", error)
  }
}
