// ITP (Inspection and Test Plan) data models and constants

export const ITP_STEPS = [
  { id: "SP-01", name: "Commence of Piling" },
  { id: "SP-02", name: "Drill bit length and diameter" },
  { id: "SP-03", name: "Check Casing Dimension (Each Casing / Each Batch)" },
  { id: "SP-04", name: "Check Rock Head Samples and Levels (Each Pile)" },
  { id: "SP-05", name: "Check Founding Samples and Levels (Each Pile)" },
  { id: "SP-06", name: "Check Reinforcement Cage Dimension" },
  { id: "SP-07", name: "Check Reinforcement Cover" },
  { id: "SP-08", name: "Check Reinforcement Splicing" },
  { id: "SP-09", name: "Check Concrete Cube Test" },
  { id: "SP-10", name: "Check Concrete Slump Test" },
  { id: "SP-11", name: "Check Pile Cut-off Level" },
  { id: "SP-12", name: "PDA/PIT Test" },
  { id: "SP-13", name: "Check Pile Cap Excavation Level" },
  { id: "SP-14", name: "Check Pile Cap Reinforcement" },
  { id: "SP-15", name: "Check Pile Cap Concrete Pouring" },
  { id: "SP-16", name: "Check Backfill Compaction" },
  { id: "SP-17", name: "Final Inspection" },
] as const;

export type Status = "Ready for Inspection" | "Pass" | "Fail" | "NA";

export interface InspectionRow {
  pk: string; // Primary key: `${projectId}#${stepId}#${modelId}:${expressID}`
  projectId: string;
  stepId: string;
  guid: string; // IFC Global ID (stable identifier)
  status: Status;
  notes?: string;
  inspector?: string;
  inspectedAt: string; // ISO timestamp
  
  // Model reference fields
  modelId: string;
  expressID: number;
}

export interface ElementSelection {
  modelId: string;
  expressID: number;
  guid?: string;
}

export interface StepStatistics {
  stepId: string;
  stepName: string;
  open: number;
  pass: number;
  fail: number;
  na: number;
  total: number;
}

export interface ItpStep {
  stepId: string;
  name: string;
}

// Color scheme for status highlighting
export const STATUS_COLORS = {
  Pass: "#4CAF50",        // Green
  Fail: "#F44336",        // Red
  "Ready for Inspection": "#0080FF",  // Blue
  NA: "#FF8C00",          // Orange
} as const;
