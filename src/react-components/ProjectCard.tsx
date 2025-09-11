import * as React from "react";
import { Project } from "../classes/Project";
import { appIcons } from "../globals";

interface Props {
  project: Project;
}

export function ProjectCard(props: Props) {
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
        <div>
          <bim-label style={{color: "white", fontSize: "1.2rem"}}>{ props.project.name }</bim-label>
          <bim-label>{ props.project.description }</bim-label>
        </div>
      </div>
      <div className="card-content">
        <div className="card-property">
          <bim-label icon={appIcons.STATUS} style={{ color: "#969696" }}>Status</bim-label>
          <p>{ props.project.status }</p>
        </div>
        <div className="card-property">
          <p style={{ color: "#969696" }}>Role</p>
          <p>{ props.project.userRole }</p>
        </div>
        <div className="card-property">
          <p style={{ color: "#969696" }}>Cost</p>
          <p>$ { props.project.cost }</p>
        </div>
        <div className="card-property">
          <p style={{ color: "#969696" }}>Estimated Progress</p>
          <p>{ props.project.progress } %</p>
        </div>
      </div>
    </div>
  )
}