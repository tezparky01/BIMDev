import Dexie, { Table } from "dexie";
import type { InspectionRow, ItpStep } from "./itp-model";

export class ItpDB extends Dexie {
  itp_steps!: Table<ItpStep, string>;
  inspections!: Table<InspectionRow, string>;

  constructor() {
    super("itp-db");
    this.version(1).stores({
      itp_steps: "&stepId, name",
      inspections:
        "&pk, projectId, stepId, status, guid, inspectedAt, [projectId+stepId], [projectId+stepId+status], [stepId+guid]",
    });
  }
}

export const db = new ItpDB();
