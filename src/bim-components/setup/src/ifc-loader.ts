import * as OBC from "@thatopen/components"

export const setupIfcLoader = (components: OBC.Components) => {
  const ifcLoader = components.get(OBC.IfcLoader);
  ifcLoader.settings.autoSetWasm = false // it tells the component we are going to manually configure it
  // web-ifc@0.0.71 is used to match ThatOpen Components v3.1.0 dependency version
  // For production, consider hosting WASM files locally instead of using unpkg CDN
  ifcLoader.settings.wasm = { absolute: true, path: "https://unpkg.com/web-ifc@0.0.71/" }
}