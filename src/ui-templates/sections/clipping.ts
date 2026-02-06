import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import { appIcons } from "../../globals";

export interface ClippingPanelState {
  components: OBC.Components;
  world: OBC.World;
}

/**
 * Creates a UI panel for managing clipping planes (section views).
 * Allows users to create, delete, and toggle clipping planes to view internal model structures.
 */
export const clippingPanelTemplate: BUI.StatefullComponent<
  ClippingPanelState
> = (state) => {
  const { components, world } = state;
  
  // Get the clipper component
  const clipper = components.get(OBC.Clipper);

  /**
   * Creates a new clipping plane at the center of the current view
   */
  const createClippingPlane = async () => {
    try {
      const plane = await clipper.create(world);
      if (plane) {
        console.log("Clipping plane created:", plane.id);
        // Trigger UI update by dispatching a custom event
        document.dispatchEvent(new CustomEvent("clipping-plane-created"));
      }
    } catch (error) {
      console.error("Error creating clipping plane:", error);
    }
  };

  /**
   * Deletes all clipping planes
   */
  const deleteAllPlanes = async () => {
    try {
      clipper.deleteAll();
      console.log("All clipping planes deleted");
      // Trigger UI update
      document.dispatchEvent(new CustomEvent("clipping-planes-deleted"));
    } catch (error) {
      console.error("Error deleting clipping planes:", error);
    }
  };

  /**
   * Toggles the clipper enabled state
   */
  const toggleClipper = (e: Event) => {
    const checkbox = e.target as BUI.Checkbox;
    clipper.enabled = checkbox.checked;
  };

  // Get the current number of planes
  const planeCount = clipper.list.size;

  return BUI.html`
    <bim-panel-section fixed label="Clipping Planes" icon="material-symbols:cut">
      <div style="display: flex; flex-direction: column; gap: 0.75rem;">
        
        <!-- Enable/Disable Clipper -->
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <bim-label>Enable Clipping</bim-label>
          <bim-checkbox 
            @change=${toggleClipper} 
            ?checked=${clipper.enabled}>
          </bim-checkbox>
        </div>

        <!-- Action Buttons -->
        <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
          <bim-button 
            @click=${createClippingPlane} 
            label="Create Plane"
            icon="material-symbols:add-box"
            style="flex: 1;">
          </bim-button>
          
          <bim-button 
            @click=${deleteAllPlanes} 
            label="Delete All"
            icon="material-symbols:delete"
            style="flex: 1;">
          </bim-button>
        </div>

        <!-- Plane Count Info -->
        <div style="padding: 0.5rem; background-color: var(--bim-ui_bg-contrast-20); border-radius: 0.25rem;">
          <bim-label>Active Planes: ${planeCount}</bim-label>
        </div>

        <!-- Instructions -->
        <div style="padding: 0.5rem; background-color: var(--bim-ui_bg-contrast-10); border-radius: 0.25rem; font-size: 0.85rem;">
          <p style="margin: 0 0 0.5rem 0;"><strong>How to use:</strong></p>
          <ul style="margin: 0; padding-left: 1.25rem;">
            <li>Click "Create Plane" to add a new section plane</li>
            <li>Drag plane handles to reposition</li>
            <li>Use "Delete All" to remove all planes</li>
          </ul>
        </div>

      </div>
    </bim-panel-section>
  `;
};
