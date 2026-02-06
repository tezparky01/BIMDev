import * as OBC from "@thatopen/components"

export const setupClipper = (components: OBC.Components) => {
  const clipper = components.get(OBC.Clipper);
  clipper.enabled = true;
  
  // Configure default clipper settings
  clipper.config.enabled = true;
  clipper.config.visible = true;
}