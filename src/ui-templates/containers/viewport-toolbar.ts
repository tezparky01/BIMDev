import * as BUI from "@thatopen/ui";
import * as OBC from "@thatopen/components";
import * as OBF from "@thatopen/components-front";
import { appIcons } from "../../globals";
import * as THREE from "three"
import * as FRAGS from "@thatopen/fragments"

const originalMaterialsData = new Map<
  FRAGS.BIMMaterial,
  { color: number; transparent: boolean; opacity: number; lodOpacity?: number }
>();

const BUTTON_SELECTOR = 'bim-button';
const TOOL_LENGTH = 'length';
const TOOL_AREA = 'area';

export interface ViewerToolbarState {
  components: OBC.Components;
  world: OBC.World
}

export const viewerToolbarTemplate: BUI.StatefullComponent<
  ViewerToolbarState
> = (state) => {
  const { components, world } = state;

  let colorInput: BUI.ColorInput | undefined;
  let isDragging = false;
  let isFloating = false;
  let dragStartX = 0;
  let dragStartY = 0;
  let toolbarStartLeft = 0;
  let toolbarStartTop = 0;
  
  // Store event listeners for cleanup
  let mouseMoveHandler: ((event: MouseEvent) => void) | null = null;
  let mouseUpHandler: (() => void) | null = null;

  const onInputCreated = (e?: Element) => {
    if (!e) return;
    colorInput = e as BUI.ColorInput;
  };

  const toggleSection = (sectionName: string) => (e: Event) => {
    const button = e.currentTarget as HTMLElement;
    const section = button.closest('bim-toolbar-section') as HTMLElement;
    const toolbar = section?.closest('bim-toolbar') as HTMLElement;
    if (!toolbar) return;
    
    // Get all sections
    const allSections = toolbar.querySelectorAll('bim-toolbar-section');
    
    const isExpanded = section.getAttribute('data-expanded') === 'true';
    
    if (isExpanded) {
      // Collapse current section
      section.removeAttribute('data-expanded');
    } else {
      // Collapse all other sections
      allSections.forEach(s => s.removeAttribute('data-expanded'));
      
      // Expand clicked section
      section.setAttribute('data-expanded', 'true');
    }
  };

  const onToolbarCreated = (e?: Element) => {
    if (!e) return;
    const toolbar = e as HTMLElement;
    
    // Add double-click to toggle floating mode
    toolbar.addEventListener('dblclick', (event) => {
      if ((event.target as HTMLElement).closest(BUTTON_SELECTOR)) return; // Don't toggle if clicking a button
      
      isFloating = !isFloating;
      if (isFloating) {
        toolbar.setAttribute('data-floating', 'true');
        const rect = toolbar.getBoundingClientRect();
        toolbar.style.left = `${rect.left}px`;
        toolbar.style.top = `${rect.top}px`;
      } else {
        toolbar.removeAttribute('data-floating');
        toolbar.style.left = '';
        toolbar.style.top = '';
      }
    });

    // Add drag functionality when floating
    toolbar.addEventListener('mousedown', (event) => {
      if (!isFloating) return;
      if ((event.target as HTMLElement).closest(BUTTON_SELECTOR)) return; // Don't drag if clicking a button
      
      isDragging = true;
      dragStartX = event.clientX;
      dragStartY = event.clientY;
      
      // Get current position using getBoundingClientRect for reliability
      const rect = toolbar.getBoundingClientRect();
      toolbarStartLeft = rect.left;
      toolbarStartTop = rect.top;
      
      toolbar.style.cursor = 'grabbing';
    });

    // Remove existing listeners if any
    if (mouseMoveHandler) {
      document.removeEventListener('mousemove', mouseMoveHandler);
    }
    if (mouseUpHandler) {
      document.removeEventListener('mouseup', mouseUpHandler);
    }

    // Define handlers
    mouseMoveHandler = (event: MouseEvent) => {
      if (!isDragging) return;
      
      const deltaX = event.clientX - dragStartX;
      const deltaY = event.clientY - dragStartY;
      
      toolbar.style.left = `${toolbarStartLeft + deltaX}px`;
      toolbar.style.top = `${toolbarStartTop + deltaY}px`;
    };

    mouseUpHandler = () => {
      if (isDragging) {
        isDragging = false;
        toolbar.style.cursor = 'move';
      }
    };

    // Add listeners
    document.addEventListener('mousemove', mouseMoveHandler);
    document.addEventListener('mouseup', mouseUpHandler);
  };

  const onApplyColor = async ({ target: button }: { target: BUI.Button }) => {
    if (!colorInput) return;
    const { color } = colorInput;
    const highlighter = components.get(OBF.Highlighter)
    const selection = highlighter.selection.select; // this is a ModelIdMap, the engine data type to represent item selections
    if (OBC.ModelIdMapUtils.isEmpty(selection)) return;
    button.loading = true
    if (!highlighter.styles.has(color)) {
      highlighter.styles.set(color, {
        color: new THREE.Color(color),
        renderedFaces: 1,
        opacity: 1,
        transparent: false,
      });
    }

    await Promise.all([highlighter.highlightByID(
      color,
      selection,
      false, // indicates that previous items colorized with the same style will keep the color
      false // indicates the camera to not zoom on the colorized items
    ),
      highlighter.clear("select")])
    
    button.loading = false
    BUI.ContextMenu.removeMenus()
  };

  const onReset = async ({ target }: { target: BUI.Button }) => {
    target.loading = true;
    const highlighter = components.get(OBF.Highlighter)
    await highlighter.clear()
    BUI.ContextMenu.removeMenus()
    target.loading = false;
  };
  
  const onHide = async ({ target }: { target: BUI.Button }) => {
    const highlighter = components.get(OBF.Highlighter);
    const selection = highlighter.selection.select;
    if (OBC.ModelIdMapUtils.isEmpty(selection)) return;
    target.loading = true;
    const hider = components.get(OBC.Hider);
    const promises = [hider.set(false, selection), highlighter.clear("select")];
    await Promise.all(promises);
    target.loading = false;
  }

  const onIsolate = async ({ target }: { target: BUI.Button }) => {
    const highlighter = components.get(OBF.Highlighter);
    const selection = highlighter.selection.select;
    if (OBC.ModelIdMapUtils.isEmpty(selection)) return;
    target.loading = true;
    const hider = components.get(OBC.Hider);
    await hider.isolate(selection);
    target.loading = false;
  };

  const onShowAll = async ({ target }: { target: BUI.Button }) => {
    target.loading = true;
    const hider = components.get(OBC.Hider);
    await hider.set(true);
    target.loading = false;
  };

  const setModelTransparency = (opacity: number) => {
    const fragments = components.get(OBC.FragmentsManager);
    const materials = [...fragments.core.models.materials.list.values()];

    for (const material of materials) {
      if (material.userData.customId) continue;
      let color: number | undefined;
      let lodOpacity: number | undefined
      if ("color" in material) {
        color = material.color.getHex();
      } else {
        color = material.lodColor.getHex();
        lodOpacity = material.uniforms.lodOpacity.value
      }

      originalMaterialsData.set(material, {
        color,
        transparent: material.transparent,
        opacity: material.opacity,
        lodOpacity
      });

      material.transparent = true;
      if ("color" in material) {
        material.opacity = opacity;
        material.color.setColorName("white");
      } else {
        material.uniforms.lodColor.value.setColorName("white")
        material.uniforms.lodOpacity.value = opacity
      }
      material.needsUpdate = true;
    }
  }

  const restoreTransparency = () => {
    for (const [material, data] of originalMaterialsData) {
      const { color, transparent, opacity, lodOpacity } = data;

      material.transparent = transparent;
      if ("color" in material) {
        material.opacity = opacity;
        material.color.setHex(color);
      } else {
        material.uniforms.lodColor.value.setHex(color)
        material.uniforms.lodOpacity.value = lodOpacity
      }
      material.needsUpdate = true;
    }

    originalMaterialsData.clear();
  }

  const onToggleGhost = () => {
    if (originalMaterialsData.size > 0) {
      restoreTransparency();
    }  else {
      setModelTransparency(0.05);
    }
  }

  const onFocus = async ({ target }: { target: BUI.Button }) => {
    if (!(world.camera instanceof OBC.SimpleCamera)) return;
    const highlighter = components.get(OBF.Highlighter)
    const selection = highlighter.selection.select;
    target.loading = true;
    await world.camera.fitToItems(
      OBC.ModelIdMapUtils.isEmpty(selection) ? undefined : selection,
    );
    target.loading = false;
  };

  // Clipping functions
  const onCreateClippingPlane = () => {
    try {
      const clipper = components.get(OBC.Clipper);
      clipper.create(world);
    } catch (error) {
      console.error("Error creating clipping plane:", error);
    }
  };

  const onCreateXPlane = () => {
    try {
      const clipper = components.get(OBC.Clipper);
      const camera = world.camera as OBC.SimpleCamera;
      const center = camera.controls.getTarget(new THREE.Vector3());
      clipper.createFromNormalAndCoplanarPoint(
        world,
        new THREE.Vector3(1, 0, 0), // X-axis normal
        center
      );
    } catch (error) {
      console.error("Error creating X-plane:", error);
    }
  };

  const onCreateYPlane = () => {
    try {
      const clipper = components.get(OBC.Clipper);
      const camera = world.camera as OBC.SimpleCamera;
      const center = camera.controls.getTarget(new THREE.Vector3());
      clipper.createFromNormalAndCoplanarPoint(
        world,
        new THREE.Vector3(0, 0, 1), // Z-axis normal (vertical in BIM/IFC convention)
        center
      );
    } catch (error) {
      console.error("Error creating Y-plane:", error);
    }
  };

  const onCreateZPlane = () => {
    try {
      const clipper = components.get(OBC.Clipper);
      const camera = world.camera as OBC.SimpleCamera;
      const center = camera.controls.getTarget(new THREE.Vector3());
      clipper.createFromNormalAndCoplanarPoint(
        world,
        new THREE.Vector3(0, 1, 0), // Y-axis normal (horizontal in BIM/IFC convention)
        center
      );
    } catch (error) {
      console.error("Error creating Z-plane:", error);
    }
  };

  const onDeleteAllClippingPlanes = () => {
    try {
      const clipper = components.get(OBC.Clipper);
      clipper.deleteAll();
    } catch (error) {
      console.error("Error deleting clipping planes:", error);
    }
  };

  const onTogglePlanesVisibility = () => {
    try {
      const clipper = components.get(OBC.Clipper);
      clipper.visible = !clipper.visible;
    } catch (error) {
      console.error("Error toggling planes visibility:", error);
    }
  };

  // Measurement functions
  const onToggleLengthMeasurement = (e: Event) => {
    try {
      const button = e.currentTarget as BUI.Button;
      const lengthMeasurement = components.get(OBF.LengthMeasurement);
      const areaMeasurement = components.get(OBF.AreaMeasurement);
      
      // Verify world is set
      if (!lengthMeasurement.world) {
        console.error("Length measurement world is not set!");
        return;
      }
      
      // Toggle length measurement
      lengthMeasurement.enabled = !lengthMeasurement.enabled;
      
      // Update button state and disable other tool if this one is being enabled
      if (lengthMeasurement.enabled) {
        button.setAttribute('data-active', 'true');
        areaMeasurement.enabled = false;
        // Clear area button state
        const areaButton = button.parentElement?.querySelector(`[data-tool="${TOOL_AREA}"]`) as BUI.Button;
        if (areaButton) areaButton.removeAttribute('data-active');
        console.log("✓ Length measurement enabled - Click points to measure distance");
      } else {
        button.removeAttribute('data-active');
        console.log("✓ Length measurement disabled");
      }
    } catch (error) {
      console.error("Error toggling length measurement:", error);
    }
  };

  const onToggleAreaMeasurement = (e: Event) => {
    try {
      const button = e.currentTarget as BUI.Button;
      const lengthMeasurement = components.get(OBF.LengthMeasurement);
      const areaMeasurement = components.get(OBF.AreaMeasurement);
      
      // Verify world is set
      if (!areaMeasurement.world) {
        console.error("Area measurement world is not set!");
        return;
      }
      
      // Toggle area measurement
      areaMeasurement.enabled = !areaMeasurement.enabled;
      
      // Update button state and disable other tool if this one is being enabled
      if (areaMeasurement.enabled) {
        button.setAttribute('data-active', 'true');
        lengthMeasurement.enabled = false;
        // Clear length button state
        const lengthButton = button.parentElement?.querySelector(`[data-tool="${TOOL_LENGTH}"]`) as BUI.Button;
        if (lengthButton) lengthButton.removeAttribute('data-active');
        console.log("✓ Area measurement enabled - Click points to define area boundary");
      } else {
        button.removeAttribute('data-active');
        console.log("✓ Area measurement disabled");
      }
    } catch (error) {
      console.error("Error toggling area measurement:", error);
    }
  };

  const onDeleteAllMeasurements = () => {
    try {
      const lengthMeasurement = components.get(OBF.LengthMeasurement);
      const areaMeasurement = components.get(OBF.AreaMeasurement);
      
      // Delete all measurements
      lengthMeasurement.delete();
      areaMeasurement.delete();
      
      // Clear button states
      const toolbar = document.querySelector('bim-toolbar');
      if (toolbar) {
        const lengthButton = toolbar.querySelector(`[data-tool="${TOOL_LENGTH}"]`) as BUI.Button;
        const areaButton = toolbar.querySelector(`[data-tool="${TOOL_AREA}"]`) as BUI.Button;
        if (lengthButton) lengthButton.removeAttribute('data-active');
        if (areaButton) areaButton.removeAttribute('data-active');
      }
      
      console.log("✓ All measurements deleted");
    } catch (error) {
      console.error("Error deleting measurements:", error);
    }
  };

  return BUI.html`
    <bim-toolbar data-dockable="true" style="position: relative;" ${BUI.ref(onToolbarCreated)}>
      <bim-toolbar-section label="Visibility" icon=${appIcons.SHOW} data-section-name="visibility">
        <bim-button icon="mdi:chevron-down" @click=${toggleSection('visibility')} data-toggle-btn="true" label=""></bim-button>
        <bim-button icon=${appIcons.SHOW} label="Show All" @click=${onShowAll} data-section-tool="true"></bim-button> 
        <bim-button icon=${appIcons.TRANSPARENT} label="Toggle Ghost" @click=${onToggleGhost} data-section-tool="true"></bim-button>
        <bim-button icon="mdi:content-cut" label="New Plane" @click=${onCreateClippingPlane} data-section-tool="true"></bim-button>
        <bim-button icon="mdi:axis-x-arrow" label="X Plane" @click=${onCreateXPlane} data-section-tool="true"></bim-button>
        <bim-button icon="mdi:axis-y-arrow" label="Y Plane" @click=${onCreateYPlane} data-section-tool="true"></bim-button>
        <bim-button icon="mdi:axis-z-arrow" label="Z Plane" @click=${onCreateZPlane} data-section-tool="true"></bim-button>
        <bim-button icon="mdi:eye-off" label="Toggle Planes" @click=${onTogglePlanesVisibility} data-section-tool="true"></bim-button>
        <bim-button icon="mdi:delete-sweep" label="Clear Planes" @click=${onDeleteAllClippingPlanes} data-section-tool="true"></bim-button>
      </bim-toolbar-section>
      <bim-toolbar-section label="Selection" icon=${appIcons.SELECT} data-section-name="selection">
        <bim-button icon="mdi:chevron-down" @click=${toggleSection('selection')} data-toggle-btn="true" label=""></bim-button>
        <bim-button icon=${appIcons.FOCUS} label="Focus" @click=${onFocus} data-section-tool="true"></bim-button>
        <bim-button icon=${appIcons.HIDE} label="Hide" @click=${onHide} data-section-tool="true"></bim-button> 
        <bim-button icon=${appIcons.ISOLATE} label="Isolate" @click=${onIsolate} data-section-tool="true"></bim-button>
        <bim-button icon=${appIcons.COLORIZE} label="Colorize" data-section-tool="true">
          <bim-context-menu>
            <div style="display: flex; flex-direction: column; gap: 0.5rem;">
              <bim-color-input ${BUI.ref(onInputCreated)}></bim-color-input>
              <div style="display: flex; gap: 0.5rem">
                <bim-button @click=${onApplyColor} icon=${appIcons.APPLY} label="Apply"></bim-button>
                <bim-button icon=${appIcons.CLEAR} label="Reset" @click=${onReset}></bim-button>
              </div>
            </div>
          </bim-context-menu>
        </bim-button>
      </bim-toolbar-section>
      <bim-toolbar-section label="Measurement" icon="mdi:ruler" data-section-name="measures">
        <bim-button icon="mdi:chevron-down" @click=${toggleSection('measures')} data-toggle-btn="true" label=""></bim-button>
        <bim-button icon="mdi:ruler" label="Length Measurement" @click=${onToggleLengthMeasurement} data-section-tool="true" data-tool="${TOOL_LENGTH}"></bim-button>
        <bim-button icon="mdi:vector-square" label="Area Measurement" @click=${onToggleAreaMeasurement} data-section-tool="true" data-tool="${TOOL_AREA}"></bim-button>
        <bim-button icon="mdi:delete" label="Delete All Measurements" @click=${onDeleteAllMeasurements} data-section-tool="true"></bim-button>
      </bim-toolbar-section>
    </bim-toolbar>
  `;
};