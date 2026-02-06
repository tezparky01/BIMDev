import * as React from "react";
import * as Router from "react-router-dom";
import * as Firestore from "firebase/firestore";
import { IProject, Project, ProjectStatus, UserRole } from "../classes/Project";
import { ProjectCard } from "./ProjectCard";
import { SearchBox } from "./SearchBox";
import { ProjectsManager } from "../classes/ProjectsManager";
import { getCollection } from "../firebase";
import { appIcons } from "../globals";

interface Props {
  projectsManager: ProjectsManager
}

const projectsCollection = getCollection<IProject>("projects")

export function ProjectsPage(props: Props) {

  const [projects, setProjects] = React.useState<Project[]>(props.projectsManager.list)
  const [editingProject, setEditingProject] = React.useState<Project | null>(null)
  props.projectsManager.OnProjectCreated = () => {setProjects([...props.projectsManager.list])}

  const getFirestoreProjects = async () => {
    const firebaseProjects = await Firestore.getDocs(projectsCollection)
    for (const doc of firebaseProjects.docs) {
      const data = doc.data()
      const project: IProject = {
        ...data,
        finishDate: (data.finishDate as unknown as Firestore.Timestamp).toDate()
      }
      try {
        props.projectsManager.newProject(project, doc.id)
      } catch (error) {
        
      }
    }
  }

  React.useEffect(() => {
    getFirestoreProjects()
  }, [])

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    const modal = document.getElementById("edit-project-modal");
    if (modal && modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  const handleDeleteProject = async () => {
    if (!editingProject) return;
    if (confirm(`Are you sure you want to delete "${editingProject.name}"?`)) {
      await props.projectsManager.deleteProject(editingProject.id);
      setProjects([...props.projectsManager.list]);
      const modal = document.getElementById("edit-project-modal");
      if (modal && modal instanceof HTMLDialogElement) {
        modal.close();
      }
      setEditingProject(null);
    }
  };

  const projectCards = projects.map((project) => {
    return (
      <Router.Link to={`/project/${project.id}`} key={project.id} >
        <ProjectCard project={project} onEdit={handleEditProject} />
      </Router.Link>
    )
  })

  React.useEffect(() => {
    console.log("Projects state updated", projects)
  }, [projects])

  const onNewProjectClick = () => {
    const modal = document.getElementById("new-project-modal")
    if (!(modal && modal instanceof HTMLDialogElement)) {return}
    modal.showModal()
  }

  const onFormSubmit = (e: React.FormEvent) => {
    const projectForm = document.getElementById("new-project-form")
    if (!(projectForm && projectForm instanceof HTMLFormElement)) {return}
    e.preventDefault()
    const formData = new FormData(projectForm)
    const projectData: IProject = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as ProjectStatus,
      userRole: formData.get("userRole") as UserRole,
      finishDate: new Date(formData.get("finishDate") as string)
    }
    try {
      Firestore.addDoc(projectsCollection, projectData)
      const project = props.projectsManager.newProject(projectData)
      projectForm.reset()
      const modal = document.getElementById("new-project-modal")
      if (!(modal && modal instanceof HTMLDialogElement)) {return}
      modal.close()
    } catch (err) {
      alert(err)
    }
  }

  const onEditFormSubmit = async (e: React.FormEvent) => {
    const projectForm = document.getElementById("edit-project-form");
    if (!(projectForm && projectForm instanceof HTMLFormElement) || !editingProject) {return}
    e.preventDefault();
    const formData = new FormData(projectForm);
    const projectData: IProject = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      status: formData.get("status") as ProjectStatus,
      userRole: formData.get("userRole") as UserRole,
      finishDate: new Date(formData.get("finishDate") as string)
    };
    try {
      // Update project properties
      Object.assign(editingProject, projectData);
      // Update in Firestore
      const projectDoc = Firestore.doc(projectsCollection, editingProject.id);
      await Firestore.updateDoc(projectDoc, projectData as any);
      setProjects([...props.projectsManager.list]);
      const modal = document.getElementById("edit-project-modal");
      if (!(modal && modal instanceof HTMLDialogElement)) {return}
      modal.close();
      setEditingProject(null);
    } catch (err) {
      alert(err);
    }
  }

  const onExportProject = () => {
    props.projectsManager.exportToJSON()
  }

  const onImportProject = () => {
    props.projectsManager.importFromJSON()
  }

  const onProjectSearch = (value: string) => {
    setProjects(props.projectsManager.filterProjects(value))
  }

  return (
    <div className="page" id="projects-page">
      <dialog id="new-project-modal">
        <form onSubmit={(e) => onFormSubmit(e)} id="new-project-form">
          <h2>New Project</h2>
          <div className="input-list">
            <div className="form-field-container">
              <label htmlFor="new-project-name">
                <span className="material-icons-round">apartment</span>Name
              </label>
              <input
                id="new-project-name"
                name="name"
                type="text"
                placeholder="What's the name of your project?"
                autoComplete="off"
              />
              <p
                style={{
                  color: "gray",
                  fontSize: "var(--font-sm)",
                  marginTop: 5,
                  fontStyle: "italic"
                }}
              >
                TIP: Give it a short name
              </p>
            </div>
            <div className="form-field-container">
              <label htmlFor="new-project-description">
                <span className="material-icons-round">subject</span>Description
              </label>
              <textarea
                id="new-project-description"
                name="description"
                cols={30}
                rows={5}
                placeholder="Give your MOHUP project a description."
                defaultValue={""}
              />
            </div>
            <div className="form-field-container">
              <label htmlFor="new-project-role">
                <span className="material-icons-round">person</span>Role
              </label>
              <select id="new-project-role" name="userRole">
                <option>Architect</option>
                <option>Engineer</option>
                <option>Developer</option>
              </select>
            </div>
            <div className="form-field-container">
              <label htmlFor="new-project-status">
                <span className="material-icons-round">not_listed_location</span>
                Status
              </label>
              <select id="new-project-status" name="status">
                <option>Pending</option>
                <option>Active</option>
                <option>Finished</option>
              </select>
            </div>
            <div className="form-field-container">
              <label htmlFor="new-project-finishDate">
                <span className="material-icons-round">calendar_month</span>
                Finish Date
              </label>
              <input id="new-project-finishDate" name="finishDate" type="date" />
            </div>
            <div
              style={{
                display: "flex",
                margin: "10px 0px 10px auto",
                columnGap: 10
              }}
            >
              <button type="button" onClick={() => {
                const modal = document.getElementById("new-project-modal");
                if (modal && modal instanceof HTMLDialogElement) {
                  modal.close();
                }
              }} style={{ backgroundColor: "transparent" }}>
                Cancel
              </button>
              <button type="submit" style={{ backgroundColor: "rgb(18, 145, 18)" }}>
                Accept
              </button>
            </div>
          </div>
        </form>
      </dialog>
      <dialog id="edit-project-modal">
        <form onSubmit={(e) => onEditFormSubmit(e)} id="edit-project-form">
          <h2>Edit Project</h2>
          <div className="input-list">
            <div className="form-field-container">
              <label htmlFor="edit-project-name">
                <span className="material-icons-round">apartment</span>Name
              </label>
              <input
                id="edit-project-name"
                name="name"
                type="text"
                defaultValue={editingProject?.name || ""}
                key={editingProject?.id}
                placeholder="What's the name of your project?"
                autoComplete="off"
              />
            </div>
            <div className="form-field-container">
              <label htmlFor="edit-project-description">
                <span className="material-icons-round">subject</span>Description
              </label>
              <textarea
                id="edit-project-description"
                name="description"
                cols={30}
                rows={5}
                defaultValue={editingProject?.description || ""}
                key={editingProject?.id + "-desc"}
                placeholder="Give your project a nice description!"
              />
            </div>
            <div className="form-field-container">
              <label htmlFor="edit-project-role">
                <span className="material-icons-round">person</span>Role
              </label>
              <select id="edit-project-role" name="userRole" defaultValue={editingProject?.userRole || "Architect"} key={editingProject?.id + "-role"}>
                <option>Architect</option>
                <option>Engineer</option>
                <option>Developer</option>
              </select>
            </div>
            <div className="form-field-container">
              <label htmlFor="edit-project-status">
                <span className="material-icons-round">not_listed_location</span>
                Status
              </label>
              <select id="edit-project-status" name="status" defaultValue={editingProject?.status || "Pending"} key={editingProject?.id + "-status"}>
                <option>Pending</option>
                <option>Active</option>
                <option>Finished</option>
              </select>
            </div>
            <div className="form-field-container">
              <label htmlFor="edit-project-finishDate">
                <span className="material-icons-round">calendar_month</span>
                Finish Date
              </label>
              <input 
                id="edit-project-finishDate"
                name="finishDate" 
                type="date" 
                defaultValue={editingProject?.finishDate ? editingProject.finishDate.toISOString().split('T')[0] : ""}
                key={editingProject?.id + "-date"}
              />
            </div>
            <div
              style={{
                display: "flex",
                margin: "10px 0px 10px auto",
                columnGap: 10,
                justifyContent: "space-between"
              }}
            >
              <button type="button" onClick={handleDeleteProject} style={{ backgroundColor: "red" }}>
                Delete Project
              </button>
              <div style={{ display: "flex", columnGap: 10 }}>
                <button type="button" onClick={() => {
                  const modal = document.getElementById("edit-project-modal");
                  if (modal && modal instanceof HTMLDialogElement) {
                    modal.close();
                    setEditingProject(null);
                  }
                }} style={{ backgroundColor: "transparent" }}>
                  Cancel
                </button>
                <button type="submit" style={{ backgroundColor: "rgb(18, 145, 18)" }}>
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </form>
      </dialog>
      <header>
        <bim-label style={{fontSize: "1.3rem", color: "white"}}>Projects List</bim-label>
        <SearchBox onChange={(value) => onProjectSearch(value)}/>
        <div style={{ display: "flex", alignItems: "center", columnGap: 15 }}>
          <bim-button onclick={onImportProject} icon={appIcons.UPLOAD} label="Upload"></bim-button>
          <bim-button onclick={onExportProject} icon={appIcons.DOWNLOAD} label="Download"></bim-button>
          <bim-button onclick={onNewProjectClick} icon={appIcons.ADD} label="New Project"></bim-button>
        </div>
      </header>
      <div style={{ flex: 1, overflow: "auto" }}>
        {
          projects.length > 0 ? <div id="projects-list">{ projectCards }</div> : <p style={{ padding: "20px 40px" }}>There are no projects to display!</p>
        }
      </div>
    </div>
  )
}