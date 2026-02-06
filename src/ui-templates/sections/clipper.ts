import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";

export interface ClipperPanelState {
  components: OBC.Components;
}

export const clipperPanelTemplate: BUI.StatefullComponent<ClipperPanelState> = (state) => {
  const { components } = state;

  const getWorld = (): OBC.World | null => {
    try {
      const worlds = components.get(OBC.Worlds);
      const worldsList = Array.from(worlds.list.values());
      return worldsList.length > 0 ? worldsList[0] : null;
    } catch (error) {
      console.error("Error getting world:", error);
      return null;
    }
  };

  const createPlane = async () => {
    try {
      const clipper = components.get(OBC.Clipper);
      const world = getWorld();
      if (!world) {
        console.warn("World not initialized");
        return;
      }
      
      await clipper.create(world);
    } catch (error) {
      console.error("Error creating plane:", error);
    }
  };

  const deleteAll = () => {
    try {
      const clipper = components.get(OBC.Clipper);
      clipper.deleteAll();
    } catch (error) {
      console.error("Error deleting planes:", error);
    }
  };

  const toggleClipping = (e: Event) => {
    try {
      const clipper = components.get(OBC.Clipper);
      const target = e.target as HTMLInputElement;
      clipper.enabled = target.checked;
    } catch (error) {
      console.error("Error toggling clipping:", error);
    }
  };

  const deletePlane = async (planeId: string) => {
    try {
      const clipper = components.get(OBC.Clipper);
      const world = getWorld();
      if (!world) {
        console.warn("World not initialized");
        return;
      }
      await clipper.delete(world, planeId);
    } catch (error) {
      console.error("Error deleting plane:", error);
    }
  };

  const updatePlanesList = (panel: BUI.Panel) => {
    try {
      const clipper = components.get(OBC.Clipper);
      const planesList = panel.querySelector("[data-planes-list]");
      if (!planesList) return;

      const planes = Array.from(clipper.list.entries());
      
      if (planes.length === 0) {
        planesList.innerHTML = `
          <div style="padding: 1rem; text-align: center; color: #666; font-size: 0.875rem;">
            No section planes created
          </div>
        `;
        return;
      }

      planesList.innerHTML = planes.map(([planeId], index) => `
        <div style="display: flex; align-items: center; padding: 0.5rem; border-bottom: 1px solid #eee;">
          <span style="flex: 1;">Plane ${index + 1}</span>
          <bim-button 
            label="Delete" 
            icon="mdi:delete"
            data-plane-id="${planeId}"
            style="--bim-button--bgc: #f44336; --bim-label--c: white; padding: 0.25rem 0.5rem;">
          </bim-button>
        </div>
      `).join('');

      // Add event listeners to delete buttons
      planesList.querySelectorAll('[data-plane-id]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const planeId = (e.currentTarget as HTMLElement).dataset.planeId;
          if (planeId) {
            deletePlane(planeId);
            updatePlanesList(panel);
          }
        });
      });
    } catch (error) {
      console.error("Error updating planes list:", error);
    }
  };

  const onPanelCreated = (e?: Element) => {
    if (!e) return;
    const panel = e as BUI.Panel;

    try {
      const clipper = components.get(OBC.Clipper);
      
      // Update list when planes change
      clipper.list.onItemSet.add(() => updatePlanesList(panel));
      clipper.list.onItemDeleted.add(() => updatePlanesList(panel));

      // Initial update - use requestAnimationFrame to ensure DOM is ready
      requestAnimationFrame(() => updatePlanesList(panel));
    } catch (error) {
      console.error("Error initializing clipper panel:", error);
    }
  };

  return BUI.html`
    <bim-panel ${BUI.ref(onPanelCreated)} label="Section Planes">
      <bim-panel-section label="Controls" fixed>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;">
          <bim-button 
            @click=${createPlane}
            label="Create Section Plane" 
            icon="mdi:content-cut"
            style="--bim-button--bgc: #4CAF50;">
          </bim-button>
          
          <bim-button 
            @click=${deleteAll}
            label="Delete All Planes" 
            icon="mdi:delete-sweep"
            style="--bim-button--bgc: #FF9800;">
          </bim-button>

          <div style="display: flex; align-items: center; gap: 0.5rem; padding: 0.5rem;">
            <bim-checkbox 
              @change=${toggleClipping}
              checked
              label="Clipping Enabled">
            </bim-checkbox>
          </div>
        </div>
      </bim-panel-section>

      <bim-panel-section label="Active Planes" fixed>
        <div data-planes-list style="max-height: 300px; overflow-y: auto;">
          <div style="padding: 1rem; text-align: center; color: #666; font-size: 0.875rem;">
            No section planes created
          </div>
        </div>
      </bim-panel-section>
    </bim-panel>
  `;
};
