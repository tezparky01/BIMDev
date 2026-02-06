import * as OBC from "@thatopen/components";
import { createWorld, setupDataEnhancer, setupFragmentsManager, setupHighlighter, setupIfcLoader, setupItemsFinder, setupClipper, setupClipStyler, setupMeasurements } from "./src";

export const setupComponents = async () => {
  const components = new OBC.Components();
  const { world, viewport } = createWorld(components)

  setupIfcLoader(components)
  setupFragmentsManager(components, world)
  setupHighlighter(components, world)
  setupItemsFinder(components)
  setupDataEnhancer(components)
  setupClipper(components, world)
  setupClipStyler(components, world)
  setupMeasurements(components, world)

  components.init()

  return { components, viewport }
}