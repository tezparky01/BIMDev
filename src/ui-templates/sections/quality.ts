import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { db } from "../../quality/itp-db";
import { ITP_STEPS, STATUS_COLORS, type Status, type ElementSelection } from "../../quality/itp-model";
import {
  linkAndSetStatus,
  unlinkFromStep,
  getStepStatistics,
  getCurrentProjectId,
  exportJSON,
  exportCSV,
  seedItpSteps,
} from "../../quality/itp-service";
import { repaintForStep, clearAllHighlighting, initQualityHighlighterStyles } from "../../quality/itp-painter";
import { appIcons } from "../../globals";

export interface QualityPanelState {
  components: OBC.Components;
}

// Column management state for matrix
let columnSettings = {
  visibleSteps: new Set<string>(),
  stepOrder: [] as string[],
  sortBy: "none" as "none" | "status" | "date" | "alphabetical",
  groupBy: "none" as "none" | "status" | "model",
  statusFilter: "" as string,
};

/**
 * Helper: Extract GUIDs from FragmentsManager for selected elements
 */
async function getElementGuids(
  fragments: OBC.FragmentsManager,
  modelId: string,
  expressIDs: number[]
): Promise<(string | undefined)[]> {
  const model = fragments.list.get(modelId);
  if (!model) return expressIDs.map(() => undefined);

  try {
    const itemsData = await model.getItemsData(expressIDs);
    return itemsData.map(data => {
      const guidData = data._guid;
      return guidData && "value" in guidData ? guidData.value : undefined;
    });
  } catch (error) {
    console.warn("Could not extract GUIDs:", error);
    return expressIDs.map(() => undefined);
  }
}

/**
 * Helper: Get current viewport selection with GUIDs
 */
async function getCurrentSelection(
  components: OBC.Components
): Promise<ElementSelection[]> {
  const highlighter = components.get(OBF.Highlighter);
  const fragments = components.get(OBC.FragmentsManager);

  const selectName = highlighter.config.selectName || "select";
  const selectionMap = highlighter.selection[selectName];

  const arr: ElementSelection[] = [];

  if (selectionMap && typeof selectionMap === "object") {
    for (const [modelId, ids] of Object.entries(selectionMap)) {
      if (ids && ids instanceof Set) {
        const expressIDs = Array.from(ids).map(id => Number(id));
        const guids = await getElementGuids(fragments, modelId, expressIDs);

        expressIDs.forEach((expressID, index) => {
          arr.push({
            modelId,
            expressID,
            guid: guids[index],
          });
        });
      }
    }
  }

  return arr;
}

/**
 * Helper: Get status cell styling for matrix
 */
const getStatusCellStyle = (status: string) => {
  switch (status) {
    case "Pass":
      return "background: #e8f5e8; color: #2d5a2d; border-left: 3px solid #4CAF50;";
    case "Fail":
      return "background: #ffe8e8; color: #8b0000; border-left: 3px solid #F44336;";
    case "Ready for Inspection":
      return "background: #e8f4ff; color: #003d82; border-left: 3px solid #0080FF;";
    case "NA":
      return "background: rgba(255, 165, 0, 0.2); color: #cc6600; border-left: 3px solid #ff8c00;";
    default:
      return "background: #f9f9f9; border-left: 3px solid transparent;";
  }
};

/**
 * Helper: Get status indicator symbol for matrix
 */
const getStatusIndicator = (status: string) => {
  switch (status) {
    case "Pass":
    case "Fail":
    case "Ready for Inspection":
    case "NA":
      return "●";
    default:
      return "";
  }
};

/**
 * Helper: Sort elements by settings
 */
const sortElementsBySettings = (elements: Array<[string, any]>) => {
  if (columnSettings.sortBy === "none") return elements;
  
  return elements.sort((a, b) => {
    const [, dataA] = a;
    const [, dataB] = b;
    
    switch (columnSettings.sortBy) {
      case "status": {
        const statusOrder = { "Fail": 0, "Ready for Inspection": 1, "Pass": 2, "NA": 3 };
        const getLowestStatus = (elementData: any) => {
          let lowestPriority = 999;
          for (const inspection of elementData.steps.values()) {
            const priority = statusOrder[inspection.status as keyof typeof statusOrder] ?? 999;
            if (priority < lowestPriority) lowestPriority = priority;
          }
          return lowestPriority;
        };
        return getLowestStatus(dataA) - getLowestStatus(dataB);
      }
      case "date": {
        const getLatestDate = (elementData: any) => {
          let latest = 0;
          for (const inspection of elementData.steps.values()) {
            const timestamp = new Date(inspection.inspectedAt).getTime();
            if (timestamp > latest) latest = timestamp;
          }
          return latest;
        };
        return getLatestDate(dataB) - getLatestDate(dataA);
      }
      case "alphabetical":
        return String(dataA.expressID).localeCompare(String(dataB.expressID));
      default:
        return 0;
    }
  });
};

/**
 * Helper: Group elements by settings
 */
const groupElementsBySettings = (elements: Array<[string, any]>) => {
  if (columnSettings.groupBy === "none") {
    return { "All Elements": elements };
  }
  
  const groups: Record<string, Array<[string, any]>> = {};
  
  for (const element of elements) {
    const [, data] = element;
    let groupName: string;
    
    if (columnSettings.groupBy === "status") {
      groupName = data.steps.size > 0 ? "Started" : "Not Started";
    } else if (columnSettings.groupBy === "model") {
      groupName = `Model: ${data.modelId}`;
    } else {
      groupName = "All Elements";
    }
    
    if (!groups[groupName]) groups[groupName] = [];
    groups[groupName].push(element);
  }
  
  return groups;
};

export const qualityPanelTemplate: BUI.StatefullComponent<QualityPanelState> = (
  state,
  update
) => {
  const { components } = state;

  let selectedStep: string | null = null;
  const projectId = getCurrentProjectId();

  // Initialize highlighter styles
  initQualityHighlighterStyles(components);

  // Seed ITP steps
  seedItpSteps(ITP_STEPS.map(s => ({ id: s.id, name: s.name })));

  /**
   * Matrix cell click handler
   */
  const handleMatrixCellClick = async (
    modelId: string,
    expressID: number,
    stepId: string,
    cellElement: HTMLElement,
  ) => {
    try {
      const highlighter = components.get(OBF.Highlighter);
      
      // Clear previous selections
      await highlighter.clear("select");
      
      // Highlight the selected element
      const modelIdMap: Record<string, Set<number>> = {};
      modelIdMap[modelId] = new Set([expressID]);
      await highlighter.highlightByID("select", modelIdMap as any, false);
      
      // Visual feedback on cell
      document.querySelectorAll(".matrix-cell.selected").forEach((cell) => {
        cell.classList.remove("selected");
        (cell as HTMLElement).style.boxShadow = "";
      });
      cellElement.classList.add("selected");
      cellElement.style.boxShadow = "inset 0 0 0 2px #1976d2";
      
      console.log(`Selected element ${expressID} in step ${stepId}`);
    } catch (error) {
      console.error("Error handling matrix cell click:", error);
    }
  };

  // Make handler globally accessible
  (window as any).handleMatrixCellClick = handleMatrixCellClick;

  /**
   * Create inspection matrix
   */
  const createInspectionMatrix = async () => {
    try {
      // Get loaded models
      const fragments = components.get(OBC.FragmentsManager);
      const loadedModelIds = Array.from(fragments.list.keys());
      
      if (loadedModelIds.length === 0) {
        return `
          <div style="padding: 2rem; text-align: center; color: #666;">
            No models currently loaded in the viewer.
          </div>
        `;
      }
      
      // Get all inspections and steps
      const [allInspections, allSteps] = await Promise.all([
        db.inspections.toArray(),
        db.itp_steps.toArray(),
      ]);
      
      // Filter inspections by loaded models and project
      const filteredInspections = allInspections.filter(
        (inspection) => inspection.modelId && loadedModelIds.includes(inspection.modelId) && inspection.projectId === projectId
      );
      
      // Get all elements from loaded models
      const allElementsMap = new Map();
      for (const modelId of loadedModelIds) {
        const model = fragments.list.get(modelId);
        if (model) {
          const itemsData = await model.getItemsIdsWithGeometry();
          for (const expressID of itemsData) {
            const elementKey = `${modelId}:${expressID}`;
            allElementsMap.set(elementKey, {
              expressID,
              modelId,
              steps: new Map(),
            });
          }
        }
      }
      
      // Overlay inspection data
      filteredInspections.forEach((inspection) => {
        if (inspection.expressID !== undefined) {
          const elementKey = `${inspection.modelId}:${inspection.expressID}`;
          if (allElementsMap.has(elementKey)) {
            const element = allElementsMap.get(elementKey);
            element.steps.set(inspection.stepId, inspection);
          }
        }
      });

      // Apply status filter
      let filteredElements = Array.from(allElementsMap.entries());
      if (columnSettings.statusFilter) {
        filteredElements = filteredElements.filter(([, data]) => {
          if (columnSettings.statusFilter === "No Status") {
            return data.steps.size === 0;
          }
          for (const inspection of data.steps.values()) {
            if (inspection.status === columnSettings.statusFilter) {
              return true;
            }
          }
          return false;
        });
      }
      
      // Initialize column settings
      if (columnSettings.visibleSteps.size === 0) {
        columnSettings.visibleSteps = new Set(allSteps.map((s) => s.stepId));
        columnSettings.stepOrder = allSteps.map((s) => s.stepId);
      }
      
      const visibleSteps = allSteps.filter(step => 
        columnSettings.visibleSteps.has(step.stepId)
      );
      
      // Apply filters and sorting
      const sortedElements = sortElementsBySettings(filteredElements);
      const groupedElements = groupElementsBySettings(sortedElements);
      
      // Build HTML (controls + table)
      return `
        <!-- Filter Controls -->
        <div style="margin-bottom: 1rem; padding: 1rem; background: var(--bim-ui_bg-contrast-10); border-radius: 8px;">
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
            
            <!-- Status Filter -->
            <div>
              <label style="font-size: 0.85rem; font-weight: 600; color: var(--bim-ui_main-contrast); margin-bottom: 0.25rem; display: block;">
                Filter by Status
              </label>
              <select id="status-filter" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--bim-ui_bg-contrast-40); background: var(--bim-ui_bg-contrast-20); color: var(--bim-ui_main-contrast);">
                <option value="">All Elements</option>
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Ready for Inspection">Ready for Inspection</option>
                <option value="NA">N/A</option>
                <option value="No Status">No Status</option>
              </select>
            </div>
            
            <!-- Column Selection -->
            <div>
              <label style="font-size: 0.85rem; font-weight: 600; color: var(--bim-ui_main-contrast); margin-bottom: 0.25rem; display: block;">
                Show Columns
              </label>
              <select id="column-selection-dropdown" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--bim-ui_bg-contrast-40); background: var(--bim-ui_bg-contrast-20); color: var(--bim-ui_main-contrast);">
                <option value="">All columns</option>
                ${allSteps.map(step => `
                  <option value="${step.stepId}">${step.stepId}</option>
                `).join("")}
              </select>
            </div>
            
            <!-- Organization -->
            <div>
              <label style="font-size: 0.85rem; font-weight: 600; color: var(--bim-ui_main-contrast); margin-bottom: 0.25rem; display: block;">
                Organization
              </label>
              <select id="organization-select" style="width: 100%; padding: 0.5rem; border-radius: 6px; border: 1px solid var(--bim-ui_bg-contrast-40); background: var(--bim-ui_bg-contrast-20); color: var(--bim-ui_main-contrast);">
                <option value="none">No Organization</option>
                <option value="group-status">Group by Started/Not</option>
                <option value="group-model">Group by Model</option>
                <option value="sort-status">Sort by Status</option>
                <option value="sort-date">Sort by Date</option>
                <option value="sort-alphabetical">Sort by Element ID</option>
              </select>
            </div>
          </div>
        </div>
        
        <!-- Matrix Table -->
        ${Object.entries(groupedElements).map(([groupName, elements]) => `
          ${Object.keys(groupedElements).length > 1 ? `
            <div style="margin: 1rem 0 0.5rem 0; padding: 0.75rem; background: var(--bim-ui_bg-contrast-20); font-weight: bold; border-radius: 4px;">
              ${groupName} (${elements.length} elements)
            </div>
          ` : ''}
          
          <div style="overflow: auto; max-height: 400px; border: 1px solid var(--bim-ui_bg-contrast-40); border-radius: 4px; margin-bottom: 1rem;">
            <table style="width: 100%; border-collapse: collapse; font-size: 0.75rem;">
              <thead style="position: sticky; top: 0; background: var(--bim-ui_bg-contrast-10); z-index: 1;">
                <tr>
                  <th style="padding: 8px; border: 1px solid var(--bim-ui_bg-contrast-40); text-align: left; position: sticky; left: 0; background: var(--bim-ui_bg-contrast-10); z-index: 2;">Express ID</th>
                  ${visibleSteps.map(step => `
                    <th style="padding: 4px; border: 1px solid var(--bim-ui_bg-contrast-40); text-align: center; writing-mode: vertical-rl; min-width: 30px;" 
                        title="${step.name}">
                      ${step.stepId}
                    </th>
                  `).join("")}
                </tr>
              </thead>
              <tbody>
                ${elements.map(([, elementData]) => `
                  <tr>
                    <td style="padding: 6px 8px; border: 1px solid var(--bim-ui_bg-contrast-40); font-family: monospace; position: sticky; left: 0; background: var(--bim-ui_bg-base); z-index: 1;">
                      ${elementData.expressID}
                    </td>
                    ${visibleSteps.map((step) => {
                      const inspection = elementData.steps.get(step.stepId);
                      const cellStyle = inspection 
                        ? getStatusCellStyle(inspection.status) 
                        : "background: var(--bim-ui_bg-contrast-10);";
                      const cellContent = inspection 
                        ? getStatusIndicator(inspection.status) 
                        : "";
                      const cellTitle = inspection 
                        ? `${inspection.status}` 
                        : "Not Inspected";
                      
                      return `
                        <td style="padding: 4px; border: 1px solid var(--bim-ui_bg-contrast-40); text-align: center; ${cellStyle} cursor: pointer;" 
                            title="${cellTitle}"
                            class="matrix-cell"
                            onclick="window.handleMatrixCellClick('${elementData.modelId}', ${elementData.expressID}, '${step.stepId}', this)">
                          ${cellContent}
                        </td>
                      `;
                    }).join("")}
                  </tr>
                `).join("")}
              </tbody>
            </table>
          </div>
        `).join("")}
      `;
    } catch (error) {
      console.error("Error creating inspection matrix:", error);
      return `<div style="color: red; padding: 1rem;">Error loading matrix: ${error}</div>`;
    }
  };

  /**
   * Update inspection matrix
   */
  const updateInspectionMatrix = async () => {
    const newContent = await createInspectionMatrix();
    const container = document.getElementById("inspection-matrix-container");
    if (container) {
      container.innerHTML = newContent;
      
      // Attach event handlers for filters
      const statusFilter = document.getElementById("status-filter") as HTMLSelectElement;
      const columnDropdown = document.getElementById("column-selection-dropdown") as HTMLSelectElement;
      const orgSelect = document.getElementById("organization-select") as HTMLSelectElement;
      
      if (statusFilter) {
        statusFilter.value = columnSettings.statusFilter;
        statusFilter.addEventListener("change", (e) => {
          columnSettings.statusFilter = (e.target as HTMLSelectElement).value;
          updateInspectionMatrix();
        });
      }
      if (columnDropdown) {
        columnDropdown.addEventListener("change", async (e) => {
          const value = (e.target as HTMLSelectElement).value;
          const allSteps = await db.itp_steps.toArray();
          if (value === "") {
            columnSettings.visibleSteps = new Set(allSteps.map(s => s.stepId));
          } else if (value) {
            columnSettings.visibleSteps = new Set([value]);
          }
          updateInspectionMatrix();
        });
      }
      if (orgSelect) {
        orgSelect.addEventListener("change", (e) => {
          const value = (e.target as HTMLSelectElement).value;
          if (value.startsWith("group-")) {
            columnSettings.groupBy = value.replace("group-", "") as any;
            columnSettings.sortBy = "none";
          } else if (value.startsWith("sort-")) {
            columnSettings.sortBy = value.replace("sort-", "") as any;
            columnSettings.groupBy = "none";
          } else {
            columnSettings.groupBy = "none";
            columnSettings.sortBy = "none";
          }
          updateInspectionMatrix();
        });
      }
    }
  };

  /**
   * Update step statistics display
   */
  const updateStepStats = async (stepId: string) => {
    const statsDiv = document.getElementById("quality-step-stats");
    if (!statsDiv || !projectId) return;

    const fragments = components.get(OBC.FragmentsManager);
    const loadedModelIds = Array.from(fragments.list.keys());

    const step = await db.itp_steps.where({ stepId }).first();
    const stats = await getStepStatistics(projectId, stepId, loadedModelIds);

    if (step) {
      statsDiv.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.35rem;">
          <div style="text-align: center; padding: 0.4rem; background: ${STATUS_COLORS.Pass}33; border-radius: 4px; border: 1px solid ${STATUS_COLORS.Pass};">
            <div style="font-weight: 600; font-size: 0.9rem; color: ${STATUS_COLORS.Pass};">${stats.pass}</div>
            <div style="font-size: 0.6rem; color: ${STATUS_COLORS.Pass}; margin-top: 0.1rem;">Pass</div>
          </div>
          <div style="text-align: center; padding: 0.4rem; background: ${STATUS_COLORS.Fail}33; border-radius: 4px; border: 1px solid ${STATUS_COLORS.Fail};">
            <div style="font-weight: 600; font-size: 0.9rem; color: ${STATUS_COLORS.Fail};">${stats.fail}</div>
            <div style="font-size: 0.6rem; color: ${STATUS_COLORS.Fail}; margin-top: 0.1rem;">Fail</div>
          </div>
          <div style="text-align: center; padding: 0.4rem; background: ${STATUS_COLORS["Ready for Inspection"]}33; border-radius: 4px; border: 1px solid ${STATUS_COLORS["Ready for Inspection"]};">
            <div style="font-weight: 600; font-size: 0.9rem; color: ${STATUS_COLORS["Ready for Inspection"]};">${stats.open}</div>
            <div style="font-size: 0.6rem; color: ${STATUS_COLORS["Ready for Inspection"]}; margin-top: 0.1rem;">Ready</div>
          </div>
          <div style="text-align: center; padding: 0.4rem; background: ${STATUS_COLORS.NA}33; border-radius: 4px; border: 1px solid ${STATUS_COLORS.NA};">
            <div style="font-weight: 600; font-size: 0.9rem; color: ${STATUS_COLORS.NA};">${stats.na}</div>
            <div style="font-size: 0.6rem; color: ${STATUS_COLORS.NA}; margin-top: 0.1rem;">N/A</div>
          </div>
        </div>
        <div style="margin-top: 0.5rem; padding: 0.35rem; background: var(--bim-ui_bg-contrast-20); border-radius: 4px; text-align: center;">
          <bim-label style="font-size: 0.7rem;">Total: ${stats.total} elements</bim-label>
        </div>
      `;
    }
  };

  /**
   * Update dropdown with steps
   */
  const updateStepsDropdown = async () => {
    const dropdown = document.getElementById("quality-steps-dropdown") as HTMLSelectElement;
    if (!dropdown) return;

    const steps = await db.itp_steps.toArray();
    dropdown.innerHTML = `<option value="">-- Select an ITP step --</option>`;

    for (const step of steps) {
      const option = document.createElement("option");
      option.value = step.stepId;
      option.textContent = `${step.stepId} - ${step.name}`;
      dropdown.appendChild(option);
    }

    if (selectedStep) {
      dropdown.value = selectedStep;
      await updateStepStats(selectedStep);
    }
  };

  /**
   * Handle step selection change
   */
  const onStepChange = async (e: Event) => {
    const dropdown = e.target as HTMLSelectElement;
    const newSelectedStep = dropdown.value;

    if (newSelectedStep && newSelectedStep !== "" && projectId) {
      selectedStep = newSelectedStep;
      await updateStepStats(newSelectedStep);
      await repaintForStep(components, projectId, newSelectedStep);
    } else {
      await clearAllHighlighting(components);
    }
  };

  /**
   * Action handlers
   */
  const handleLinkSelection = async () => {
    if (!selectedStep || !projectId) {
      alert("Please select an ITP step first");
      return;
    }

    const selection = await getCurrentSelection(components);
    if (selection.length === 0) {
      alert("No elements selected in the viewport");
      return;
    }

    await linkAndSetStatus(projectId, selectedStep, selection, "Ready for Inspection");
    await updateStepStats(selectedStep);
    await updateInspectionMatrix();
    await repaintForStep(components, projectId, selectedStep);
  };

  const handleUnlinkSelection = async () => {
    if (!selectedStep || !projectId) {
      alert("Please select an ITP step first");
      return;
    }

    const selection = await getCurrentSelection(components);
    if (selection.length === 0) {
      alert("No elements selected in the viewport");
      return;
    }

    await unlinkFromStep(projectId, selectedStep, selection);
    await updateStepStats(selectedStep);
    await updateInspectionMatrix();
    await repaintForStep(components, projectId, selectedStep);
  };

  const handleMarkStatus = async (status: Status) => {
    if (!selectedStep || !projectId) {
      alert("Please select an ITP step first");
      return;
    }

    const selection = await getCurrentSelection(components);
    if (selection.length === 0) {
      alert("No elements selected in the viewport");
      return;
    }

    await linkAndSetStatus(projectId, selectedStep, selection, status);
    await updateStepStats(selectedStep);
    await updateInspectionMatrix();
    await repaintForStep(components, projectId, selectedStep);
  };

  const handleCSVImport = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".csv";
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const text = await file.text();
        const lines = text.split("\n").filter((line) => line.trim());
        
        if (lines.length === 0) {
          alert("CSV file is empty.");
          return;
        }

        const header = lines[0].toLowerCase();

        if (!header.includes("stepid") || !header.includes("name")) {
          alert("CSV must have 'stepId' and 'name' columns.");
          console.error("Invalid CSV format. Found header:", header);
          return;
        }

        const steps = [];
        for (let i = 1; i < lines.length; i++) {
          const parts = lines[i].split(",");
          if (parts.length >= 2) {
            const stepId = parts[0].replace(/"/g, "").trim();
            const name = parts.slice(1).join(",").replace(/"/g, "").trim();
            if (stepId && name) {
              steps.push({ stepId, name });
            }
          }
        }

        if (steps.length > 0) {
          await db.itp_steps.bulkPut(steps);
          await updateStepsDropdown();
          await updateInspectionMatrix();
          alert(`Successfully imported ${steps.length} ITP steps!`);
          console.log(`Imported ${steps.length} ITP steps from CSV`);
        } else {
          alert("No valid steps found in CSV file.");
        }
      } catch (error) {
        console.error("Error importing CSV:", error);
        alert(`Error importing CSV: ${error}`);
      }
    };
    input.click();
  };

  const handleExportJSON = async () => {
    if (!projectId) {
      alert("No project context found");
      return;
    }

    const data = await exportJSON(projectId);
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quality-inspections-${projectId}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    if (!projectId) {
      alert("No project context found");
      return;
    }

    const { inspectionsCsv } = await exportCSV(projectId);
    const blob = new Blob([inspectionsCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `quality-inspections-${projectId}-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClearHighlights = async () => {
    await clearAllHighlighting(components);
  };

  const handleShowHighlights = async () => {
    if (!selectedStep || !projectId) {
      alert("Please select an ITP step first");
      return;
    }
    await repaintForStep(components, projectId, selectedStep);
  };

  /**
   * Component creation hook
   */
  const onCreated = (e?: Element) => {
    if (!e) return;
    updateStepsDropdown();
    // Initialize matrix after a short delay to ensure DOM is ready
    setTimeout(() => {
      updateInspectionMatrix();
    }, 500);
  };

  if (!projectId) {
    return BUI.html`
      <bim-panel-section fixed label="Quality Inspection">
        <div style="padding: 1rem; text-align: center;">
          <bim-label style="color: #e3874c;">No project context found. Please open a project first.</bim-label>
        </div>
      </bim-panel-section>
    `;
  }

  return BUI.html`
    <bim-panel-section ${BUI.ref(onCreated)} fixed label="Quality Inspection" icon="mdi:clipboard-check">
      <div style="display: flex; flex-direction: column; gap: 1rem;">
        
        <!-- Step Selection -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <bim-label>ITP Step</bim-label>
          <select 
            id="quality-steps-dropdown" 
            @change=${onStepChange}
            style="
              width: 100%;
              padding: 0.5rem;
              background: var(--bim-ui_bg-contrast-20);
              color: var(--bim-ui_main-contrast);
              border: 1px solid var(--bim-ui_bg-contrast-40);
              border-radius: 0.25rem;
              cursor: pointer;
            "
          >
            <option value="">-- Select an ITP step --</option>
          </select>
        </div>

        <!-- Statistics Display -->
        <div id="quality-step-stats" style="min-height: 6rem; display: flex; flex-direction: column; align-items: stretch; justify-content: center;">
          <bim-label style="color: #969696; font-size: 0.875rem;">Select a step to view statistics</bim-label>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <bim-label style="font-weight: 600; margin-bottom: 0.25rem;">Actions</bim-label>
          
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <bim-button 
              @click=${handleLinkSelection} 
              label="Link"
              icon="material-symbols:link"
            ></bim-button>

            <bim-button 
              @click=${handleUnlinkSelection} 
              label="Un-link"
              icon="material-symbols:link-off"
            ></bim-button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <bim-button 
              @click=${() => handleMarkStatus("Pass")} 
              label="Mark Pass"
              style="--bim-button--bgc: ${STATUS_COLORS.Pass};"
            ></bim-button>

            <bim-button 
              @click=${() => handleMarkStatus("Fail")} 
              label="Mark Fail"
              style="--bim-button--bgc: ${STATUS_COLORS.Fail};"
            ></bim-button>

            <bim-button 
              @click=${() => handleMarkStatus("Ready for Inspection")} 
              label="Mark Ready"
              style="--bim-button--bgc: ${STATUS_COLORS["Ready for Inspection"]};"
            ></bim-button>

            <bim-button 
              @click=${() => handleMarkStatus("NA")} 
              label="Mark N/A"
              style="--bim-button--bgc: ${STATUS_COLORS.NA};"
            ></bim-button>
          </div>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <bim-button 
              @click=${handleShowHighlights} 
              label="Show"
              icon="material-symbols:visibility"
            ></bim-button>

            <bim-button 
              @click=${handleClearHighlights} 
              label="Clear"
              icon=${appIcons.CLEAR}
            ></bim-button>
          </div>
        </div>

        <!-- Export Buttons -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--bim-ui_bg-contrast-40); padding-top: 1rem;">
          <bim-label style="font-weight: 600; margin-bottom: 0.25rem;">Import / Export</bim-label>
          
          <bim-button 
            @click=${handleCSVImport} 
            label="Import CSV Steps"
            icon=${appIcons.UPLOAD}
          ></bim-button>

          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
            <bim-button 
              @click=${handleExportJSON} 
              label="JSON"
              icon=${appIcons.DOWNLOAD}
            ></bim-button>

            <bim-button 
              @click=${handleExportCSV} 
              label="CSV"
              icon=${appIcons.DOWNLOAD}
            ></bim-button>
          </div>
        </div>

        <!-- Inspection Matrix -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--bim-ui_bg-contrast-40); padding-top: 1rem;">
          <bim-label style="font-weight: 600; margin-bottom: 0.25rem;">Inspection Progress Matrix</bim-label>
          <div id="inspection-matrix-container" style="font-size: 0.875rem;">
            <div style="padding: 1rem; text-align: center; color: var(--bim-ui_bg-contrast-80);">
              Loading matrix...
            </div>
          </div>
        </div>

        <!-- Legend -->
        <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--bim-ui_bg-contrast-40); padding-top: 1rem;">
          <bim-label style="font-weight: 600; margin-bottom: 0.25rem;">Status Legend</bim-label>
          <div style="display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.875rem;">
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 1rem; height: 1rem; background: ${STATUS_COLORS.Pass}; border-radius: 2px;"></div>
              <bim-label>Pass</bim-label>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 1rem; height: 1rem; background: ${STATUS_COLORS.Fail}; border-radius: 2px;"></div>
              <bim-label>Fail</bim-label>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 1rem; height: 1rem; background: ${STATUS_COLORS["Ready for Inspection"]}; border-radius: 2px;"></div>
              <bim-label>Ready for Inspection</bim-label>
            </div>
            <div style="display: flex; align-items: center; gap: 0.5rem;">
              <div style="width: 1rem; height: 1rem; background: ${STATUS_COLORS.NA}; border-radius: 2px;"></div>
              <bim-label>N/A</bim-label>
            </div>
          </div>
        </div>

      </div>
    </bim-panel-section>
  `;
};
