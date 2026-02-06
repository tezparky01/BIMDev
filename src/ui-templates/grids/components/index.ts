import * as BUI from "@thatopen/ui";
import { ComponentsGrid } from "./src";
import { viewportContainerTemplate } from "../../containers";
import { dataSourcesPanelTemplate, itemsDataPanelTemplate, modelsPanelTemplate, queriesPanelTemplate, qualityPanelTemplate, clipperPanelTemplate } from "../../sections";
import * as OBC from "@thatopen/components"

interface ComponentsGridState {
  components: OBC.Components
  viewport?: BUI.Viewport
}

export const componentsGridTemplate: BUI.StatefullComponent<ComponentsGridState> = (state) => {
  const { components, viewport } = state
  const onCreated = (e?: Element) => {
    if (!e) return;
    const grid = e as ComponentsGrid;

    grid.elements = {
      viewport: {
        template: viewportContainerTemplate,
        initialState: { viewport },
      },
      itemsData: {
        template: itemsDataPanelTemplate,
        initialState: { components }
      },
      models: {
        template: modelsPanelTemplate,
        initialState: { components }
      },
      queries: {
        template: queriesPanelTemplate,
        initialState: { components }
      },
      datasources: {
        template: dataSourcesPanelTemplate,
        initialState: { components }
      },
      quality: {
        template: qualityPanelTemplate,
        initialState: { components }
      },
      clipper: {
        template: clipperPanelTemplate,
        initialState: { components }
      },
    };

    grid.layouts = {
      Models: {
        template: `
          "models viewport itemsData" 1fr
          "queries viewport datasources" 1fr
          /14.67rem 1fr 14.67rem
        `,
      },
      Queries: {
        template: `
          "viewport queries" 1fr
          /1fr 14.67rem
        `,
      },
      Viewer: {
        template: `
          "viewport" 1fr
          /1fr
        `,
      },
      Quality: {
        template: `
          "viewport quality" 1fr
          /1fr 20rem
        `,
      },
      Clipper: {
        template: `
          "viewport clipper" 1fr
          /1fr 16rem
        `,
      },
    };

    grid.layout = "Models"
    
    // Setup resizable panels with proper cleanup
    const cleanup = setupResizablePanels(grid as unknown as HTMLElement)
    
    // Store cleanup function for later disposal
    ;(grid as any)._resizeCleanup = cleanup
  }
  
  return BUI.html`<bim-grid ${BUI.ref(onCreated)} class="components-grid"></bim-grid>`
}

// Resizable panels implementation with proper event cleanup
function setupResizablePanels(gridElement: HTMLElement): () => void {
  const state = {
    isResizing: false,
    currentHandle: null as HTMLElement | null,
    startX: 0,
    startWidth: 0,
    targetPanel: '' as string,
    observers: [] as MutationObserver[]
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (!state.isResizing || !state.currentHandle || !state.targetPanel) return
    
    const deltaX = e.clientX - state.startX
    const isLeftPanel = state.targetPanel === 'left'
    const adjustedDelta = isLeftPanel ? deltaX : -deltaX
    const newWidth = Math.max(250, Math.min(state.startWidth + adjustedDelta, window.innerWidth * 0.6))
    
    // Get current grid template and parse it
    const currentTemplate = getComputedStyle(gridElement).gridTemplateColumns
    const columns = currentTemplate.split(' ')
    
    // Update the appropriate column while keeping 1fr for viewport
    if (isLeftPanel && columns.length >= 3) {
      // Left panel resize: update first column, keep middle as 1fr, preserve right column
      const rightColumn = columns[2]
      gridElement.style.gridTemplateColumns = `${newWidth}px 1fr ${rightColumn}`
    } else if (!isLeftPanel && columns.length >= 3) {
      // Right panel resize: preserve left column, keep middle as 1fr, update last column
      const leftColumn = columns[0]
      gridElement.style.gridTemplateColumns = `${leftColumn} 1fr ${newWidth}px`
    } else if (!isLeftPanel && columns.length === 2) {
      // Queries layout: viewport queries
      gridElement.style.gridTemplateColumns = `1fr ${newWidth}px`
    }
  }

  const handleMouseUp = () => {
    if (state.isResizing) {
      state.isResizing = false
      state.currentHandle = null
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
      
      gridElement.querySelectorAll('.resize-handle').forEach(handle => {
        handle.classList.remove('resizing')
      })
    }
  }

  const createResizeHandle = (side: 'left' | 'right', panelType: 'left' | 'right'): HTMLElement => {
    const handle = document.createElement('div')
    handle.className = `resize-handle resize-handle-${side}`
    handle.setAttribute('data-panel', panelType)
    
    handle.addEventListener('mousedown', (e: MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      
      state.isResizing = true
      state.currentHandle = handle
      state.startX = e.clientX
      state.targetPanel = panelType
      
      // Get current computed width of the target column
      const currentTemplate = getComputedStyle(gridElement).gridTemplateColumns
      const columns = currentTemplate.split(' ')
      
      if (panelType === 'left' && columns.length >= 3) {
        // First column
        state.startWidth = parseFloat(columns[0])
      } else if (panelType === 'right' && columns.length >= 3) {
        // Last column
        state.startWidth = parseFloat(columns[2])
      } else if (panelType === 'right' && columns.length === 2) {
        // Queries layout - second column
        state.startWidth = parseFloat(columns[1])
      }
      
      document.body.style.cursor = 'ew-resize'
      document.body.style.userSelect = 'none'
      handle.classList.add('resizing')
    })
    
    return handle
  }

  const addHandlesToElements = () => {
    const children = Array.from(gridElement.children) as HTMLElement[]
    
    children.forEach(child => {
      const gridArea = getComputedStyle(child).gridArea
      
      // Left panels: models, queries
      if ((gridArea === 'models' || gridArea === 'queries') && !child.querySelector('.resize-handle-right')) {
        const handle = createResizeHandle('right', 'left')
        child.style.position = 'relative'
        child.appendChild(handle)
      }
      
      // Right panels: itemsData, datasources, or queries when in Queries layout
      if ((gridArea === 'itemsData' || gridArea === 'datasources') && !child.querySelector('.resize-handle-left')) {
        const handle = createResizeHandle('left', 'right')
        child.style.position = 'relative'
        child.appendChild(handle)
      }
      
      // Queries panel when it's on the right side (Queries layout)
      if (gridArea === 'queries' && !child.previousElementSibling && !child.querySelector('.resize-handle-left')) {
        const viewportExists = children.some(c => getComputedStyle(c).gridArea === 'viewport')
        if (viewportExists) {
          const handle = createResizeHandle('left', 'right')
          child.style.position = 'relative'
          child.appendChild(handle)
        }
      }
    })
  }

  // Observe DOM changes to add handles when grid items are added
  const observer = new MutationObserver(() => {
    requestAnimationFrame(() => {
      addHandlesToElements()
    })
  })
  
  observer.observe(gridElement, { childList: true, subtree: false })
  state.observers.push(observer)

  // Initial setup
  setTimeout(() => addHandlesToElements(), 100)
  setTimeout(() => addHandlesToElements(), 500)

  // Attach event listeners
  document.addEventListener('mousemove', handleMouseMove)
  document.addEventListener('mouseup', handleMouseUp)

  // Return cleanup function
  return () => {
    document.removeEventListener('mousemove', handleMouseMove)
    document.removeEventListener('mouseup', handleMouseUp)
    state.observers.forEach(obs => obs.disconnect())
    gridElement.querySelectorAll('.resize-handle').forEach(handle => handle.remove())
  }
}