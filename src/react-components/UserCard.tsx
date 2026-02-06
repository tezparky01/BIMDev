import * as React from "react";
import { User } from "../classes/User";
import { appIcons } from "../globals";

interface Props {
  user: User;
  onEdit?: (user: User) => void;
}

export function UserCard(props: Props) {
  const handleEdit = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (props.onEdit) {
      props.onEdit(props.user);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <div className="project-card">
      <div className="card-header">
        <p
          style={{
            backgroundColor: "#3498db",
            padding: 10,
            borderRadius: 8,
            aspectRatio: 1
          }}
        >
          {getInitials(props.user.name)}
        </p>
        <div style={{flex: 1, minWidth: 0, overflow: 'hidden'}}>
          <bim-label style={{color: "white", fontSize: "1rem", whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'}}>{ props.user.name }</bim-label>
          <bim-label style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'}}>{ props.user.email }</bim-label>
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
          <bim-label icon={appIcons.USER} style={{ color: "#969696" }}>Role</bim-label>
          <bim-label style={{ color: "#ffffff" }}>{ props.user.role }</bim-label>
        </div>
        {props.user.company && (
          <div className="card-property">
            <bim-label icon="mdi:office-building" style={{ color: "#969696" }}>Company</bim-label>
            <bim-label style={{ color: "#ffffff" }}>{ props.user.company }</bim-label>
          </div>
        )}
      </div>
    </div>
  )
}
