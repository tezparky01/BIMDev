import * as React from "react";
import * as Router from "react-router-dom";
import { ProjectsManager } from "../classes/ProjectsManager";
import { ThreeViewer } from "./ThreeViewer";
import { deleteDocument } from "../firebase";
import * as BUI from "@thatopen/ui"
import * as TEMPLATES from "../ui-templates"
import { setupComponents } from "../bim-components";
import * as OBC from "@thatopen/components"
import { ComponentsGrid } from "../ui-templates/grids/components/src";

interface Props {
  projectsManager: ProjectsManager
}

export function ProjectDetailsPage(props: Props) {
  const routeParams = Router.useParams<{id: string}>()
  if (!routeParams.id) {return (<p>Project ID is needed to see this page</p>)}
  const project = props.projectsManager.getProject(routeParams.id)
  if (!project) {return (<p>The project with ID {routeParams.id} wasn't found.</p>)}

  const navigateTo = Router.useNavigate()
  props.projectsManager.OnProjectDeleted = async (id) => {
    await deleteDocument("/projects", id)
    navigateTo("/")
  }

  const viewerGrid = React.useRef<BUI.Grid<["Main"]>>(null)
  let engineManager: OBC.Components | null = null

  const setupGrid = async () => {
    const { current: grid } = viewerGrid
    if (!grid) return

    const { components, viewport } = await setupComponents()
    engineManager = components

    grid.elements = {
      sidebar: {
        template: TEMPLATES.gridSidebarTemplate,
        initialState: {}
      },
      componentsGrid: {
        template: TEMPLATES.componentsGridTemplate,
        initialState: { components, viewport }
      }
    };

    grid.layouts = {
      Main: {
        template: `
          "sidebar" auto
          "componentsGrid" 1fr
          /1fr
        `,
      },
    }

    grid.addEventListener("elementcreated", (e: CustomEvent<BUI.ElementCreatedEventDetail<ComponentsGrid>>) => {
      const { name, element: componentsGrid } = e.detail
      if (name !== "componentsGrid") return
      grid.updateComponent.sidebar({ grid: componentsGrid })
    })

    grid.layout = "Main";
  }

  React.useEffect(() => {
    setupGrid()
    return () => {
      engineManager?.dispose()
      engineManager = null
    }
  }, [])

  return (
    <div className="page" id="project-details">
      <bim-grid ref={viewerGrid} className="viewer-grid" style={{height: "100%"}}>
      </bim-grid>
    </div>
  );
}