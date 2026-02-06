import * as React from "react";
import { Project } from "../classes/Project";
import { appIcons } from "../globals";

interface Props {
  project: Project;
  onEdit?: (project: Project) => void;
}

export function ProjectCard(props: Props) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (props.onEdit) {
      props.onEdit(props.project);
    }
  };

  return (
    <div className="project-card">
      <div className="card-header">
        <p
          style={{
            backgroundColor: "#ca8134",
            padding: 10,
            borderRadius: 8,
            aspectRatio: 1
          }}
        >
          HC
        </p>
        <div style={{flex: 1}}>
          <bim-label style={{color: "white", fontSize: "1rem"}}>{ props.project.name }</bim-label>
          <bim-label>{ props.project.description }</bim-label>
        </div>
        {props.onEdit && (
          <button 
            onClick={handleEdit}
            style={{
              backgroundColor: "#129121",
              color: "white",
              border: "none",
              padding: "8px 12px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "0.85rem",
              marginLeft: "10px"
            }}
          >
            Edit
          </button>
        )}
      </div>
      <div className="card-content">
        <div className="card-property">
          <bim-label icon={appIcons.STATUS} style={{ color: "#969696" }}>Status</bim-label>
          <bim-label style={{ color: "#ffffff" }}>{ props.project.status }</bim-label>
        </div>
        <div className="card-property">
          <bim-label icon={appIcons.USER} style={{ color: "#969696" }}>Role</bim-label>
          <bim-label style={{ color: "#ffffff" }}>{ props.project.userRole }</bim-label>
        </div>
        <div className="card-property">
          <bim-label icon={appIcons.MONEY} style={{ color: "#969696" }}>Cost</bim-label>
          <bim-label style={{ color: "#ffffff" }}>$ { props.project.cost }</bim-label>
        </div>
        <div className="card-property">
          <bim-label icon={appIcons.PROGRESS} style={{ color: "#969696" }}>Estimated Progress</bim-label>
          <bim-label style={{ color: "#ffffff" }}>{ props.project.progress } %</bim-label>
        </div>
      </div>
    </div>
  )
}