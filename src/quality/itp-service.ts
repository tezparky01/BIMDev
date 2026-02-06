import { db } from "./itp-db";
import type { Status, InspectionRow, ElementSelection, StepStatistics } from "./itp-model";

/**
 * Get current project ID from URL
 */
export function getCurrentProjectId(): string | null {
  const match = window.location.pathname.match(/\/project\/([^\/]+)/);
  return match ? match[1] : null;
}

/**
 * Link selected elements to an inspection step
 */
export async function linkToStep(
  projectId: string,
  stepId: string,
  selection: ElementSelection[],
) {
  const now = new Date().toISOString();
  await db.transaction("rw", db.inspections, async () => {
    for (const { modelId, expressID, guid } of selection) {
      const pk = `${projectId}#${stepId}#${modelId}:${expressID}`;
      const row: InspectionRow = {
        pk,
        projectId,
        stepId,
        guid: guid || "",
        status: "Ready for Inspection",
        inspectedAt: now,
        modelId,
        expressID,
      };
      await db.inspections.put(row);
    }
  });
}

/**
 * Update status for linked elements
 */
export async function setStatus(
  projectId: string,
  stepId: string,
  selection: ElementSelection[],
  status: Status,
  notes?: string,
) {
  const now = new Date().toISOString();
  await db.transaction("rw", db.inspections, async () => {
    for (const e of selection) {
      const pk = `${projectId}#${stepId}#${e.modelId}:${e.expressID}`;
      await db.inspections.update(pk, {
        status,
        inspectedAt: now,
        notes: notes || undefined,
      });
    }
  });
}

/**
 * Combined link + set status operation
 */
export async function linkAndSetStatus(
  projectId: string,
  stepId: string,
  selection: ElementSelection[],
  status: Status,
  notes?: string,
) {
  const now = new Date().toISOString();
  await db.transaction("rw", db.inspections, async () => {
    for (const { modelId, expressID, guid } of selection) {
      const pk = `${projectId}#${stepId}#${modelId}:${expressID}`;
      const row: InspectionRow = {
        pk,
        projectId,
        stepId,
        guid: guid || "",
        status,
        inspectedAt: now,
        modelId,
        expressID,
        notes: notes || undefined,
      };
      await db.inspections.put(row);
    }
  });
}

/**
 * Unlink selected elements from an inspection step
 */
export async function unlinkFromStep(
  projectId: string,
  stepId: string,
  selection: ElementSelection[],
) {
  await db.transaction("rw", db.inspections, async () => {
    for (const { modelId, expressID } of selection) {
      const pk = `${projectId}#${stepId}#${modelId}:${expressID}`;
      await db.inspections.delete(pk);
    }
  });
}

/**
 * Get statistics for a step (filtered by project and loaded models)
 */
export async function getStepStatistics(
  projectId: string,
  stepId: string,
  loadedModelIds?: string[]
): Promise<StepStatistics> {
  const rows = await db.inspections
    .where(["projectId", "stepId"])
    .equals([projectId, stepId])
    .toArray();

  const filteredRows = loadedModelIds 
    ? rows.filter(row => loadedModelIds.includes(row.modelId))
    : rows;

  const stats: StepStatistics = {
    stepId,
    stepName: "",
    open: 0,
    pass: 0,
    fail: 0,
    na: 0,
    total: filteredRows.length
  };

  for (const row of filteredRows) {
    switch (row.status) {
      case "Ready for Inspection": stats.open++; break;
      case "Pass": stats.pass++; break;
      case "Fail": stats.fail++; break;
      case "NA": stats.na++; break;
    }
  }

  return stats;
}

/**
 * Get all inspections for a step
 */
export async function getStepInspections(
  projectId: string,
  stepId: string
): Promise<InspectionRow[]> {
  return await db.inspections
    .where(["projectId", "stepId"])
    .equals([projectId, stepId])
    .toArray();
}

/**
 * Export all inspection data as JSON
 */
export async function exportJSON(projectId: string) {
  const [steps, inspections] = await Promise.all([
    db.itp_steps.toArray(),
    db.inspections.where("projectId").equals(projectId).toArray(),
  ]);

  const inspectionsWithLocalTime = inspections.map(inspection => ({
    ...inspection,
    inspectedAt: new Date(inspection.inspectedAt).toLocaleString()
  }));

  return { steps, inspections: inspectionsWithLocalTime };
}

/**
 * Export inspection data as CSV
 */
export async function exportCSV(projectId: string): Promise<{
  stepsCsv: string;
  inspectionsCsv: string;
}> {
  const [steps, inspections] = await Promise.all([
    db.itp_steps.toArray(),
    db.inspections.where("projectId").equals(projectId).toArray(),
  ]);

  const stepsCsv = [
    "stepId,name",
    ...steps.map((s) => `${s.stepId},"${s.name.replace(/"/g, '""')}"`),
  ].join("\n");

  const head = "projectId,stepId,modelId,expressID,guid,status,inspectedAt,inspector,notes";
  const rows = inspections.map((r) =>
    [
      r.projectId,
      r.stepId,
      r.modelId,
      r.expressID,
      r.guid ?? "",
      r.status,
      new Date(r.inspectedAt).toLocaleString(),
      r.inspector ?? "",
      (r.notes ?? "").replace(/"/g, '""'),
    ].map((v) => (typeof v === "string" ? `"${v}"` : String(v))).join(",")
  );

  return { stepsCsv, inspectionsCsv: [head, ...rows].join("\n") };
}

/**
 * Seed ITP steps into database (only once)
 */
export async function seedItpSteps(steps: { id: string; name: string }[]) {
  const count = await db.itp_steps.count();
  if (count === 0) {
    await db.itp_steps.bulkPut(
      steps.map((s) => ({ stepId: s.id, name: s.name }))
    );
  }
}
