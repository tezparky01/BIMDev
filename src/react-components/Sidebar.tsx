import * as React from "react";
import * as Router from "react-router-dom";
import { appIcons } from "../globals";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
    document.getElementById('app')?.classList.toggle('sidebar-collapsed', !isCollapsed);
  };

  return (
    <aside id="sidebar" className={isCollapsed ? 'collapsed' : ''}>
      <img id="company-logo" src="./assets/company-logo.svg" alt="Construction Company" />
      <ul id="nav-buttons">
        <Router.Link to="/">
          <bim-button icon={appIcons.PROJECT} label={isCollapsed ? "" : "Projects"}></bim-button>
        </Router.Link>
        <Router.Link to="/users">
          <bim-button icon={appIcons.USER} label={isCollapsed ? "" : "Users"}></bim-button>
        </Router.Link>
      </ul>
      <button 
        id="sidebar-toggle" 
        onClick={toggleSidebar}
        title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span className="material-icons-round">
          {isCollapsed ? 'chevron_right' : 'chevron_left'}
        </span>
      </button>
    </aside>
  )
}