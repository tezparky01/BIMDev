import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";
import { db } from "./itp-db";
import { STATUS_COLORS } from "./itp-model";
import type { Status } from "./itp-model";

/**
 * Initialize highlighter styles for quality inspection
 */
export async function initQualityHighlighterStyles(components: OBC.Components) {
  const highlighter = components.get(OBF.Highlighter);

  highlighter.styles.set("quality-pass", {
    color: new THREE.Color(STATUS_COLORS.Pass),
    opacity: 0.8,
    transparent: true,
    renderedFaces: 1,
  });

  highlighter.styles.set("quality-fail", {
    color: new THREE.Color(STATUS_COLORS.Fail),
    opacity: 0.8,
    transparent: true,
    renderedFaces: 1,
  });

  highlighter.styles.set("quality-open", {
    color: new THREE.Color(STATUS_COLORS["Ready for Inspection"]),
    opacity: 0.8,
    transparent: true,
    renderedFaces: 1,
  });

  highlighter.styles.set("quality-na", {
    color: new THREE.Color(STATUS_COLORS.NA),
    opacity: 0.8,
    transparent: true,
    renderedFaces: 1,
  });
}

/**
 * Get style name for a status
 */
function getStyleForStatus(status: Status): string {
  switch (status) {
    case "Pass": return "quality-pass";
    case "Fail": return "quality-fail";
    case "Ready for Inspection": return "quality-open";
    case "NA": return "quality-na";
  }
}

/**
 * Repaint all elements for a specific inspection step with their status colors
 */
export async function repaintForStep(
  components: OBC.Components,
  projectId: string,
  stepId: string
) {
  const highlighter = components.get(OBF.Highlighter);
  const fragments = components.get(OBC.FragmentsManager);

  // Clear previous quality highlights
  await clearAllHighlighting(components);

  // Get all inspections for this step
  const inspections = await db.inspections
    .where(["projectId", "stepId"])
    .equals([projectId, stepId])
    .toArray();

  // Group by status
  const byStatus: Record<Status, OBC.ModelIdMap> = {
    "Pass": {},
    "Fail": {},
    "Ready for Inspection": {},
    "NA": {},
  };

  for (const inspection of inspections) {
    const { modelId, expressID, status } = inspection;
    
    if (!byStatus[status][modelId]) {
      byStatus[status][modelId] = new Set();
    }
    byStatus[status][modelId].add(expressID);
  }

  // Apply highlights for each status
  for (const [status, modelIdMap] of Object.entries(byStatus) as [Status, OBC.ModelIdMap][]) {
    if (Object.keys(modelIdMap).length > 0) {
      const style = getStyleForStatus(status);
      await highlighter.highlightByID(style, modelIdMap, false, false);
    }
  }
}

/**
 * Clear all quality-related highlighting
 */
export async function clearAllHighlighting(components: OBC.Components) {
  const highlighter = components.get(OBF.Highlighter);
  
  await Promise.all([
    highlighter.clear("quality-pass"),
    highlighter.clear("quality-fail"),
    highlighter.clear("quality-open"),
    highlighter.clear("quality-na"),
  ]);
}
