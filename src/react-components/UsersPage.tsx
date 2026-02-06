import * as React from "react";
import * as Firestore from "firebase/firestore";
import { IUser, User, UserRole } from "../classes/User";
import { UserCard } from "./UserCard";
import { SearchBox } from "./SearchBox";
import { UsersManager } from "../classes/UsersManager";
import { getCollection } from "../firebase";
import { appIcons } from "../globals";

interface Props {
  usersManager: UsersManager
}

const usersCollection = getCollection<IUser>("users")

export function UsersPage(props: Props) {

  const [users, setUsers] = React.useState<User[]>(props.usersManager.list)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  props.usersManager.OnUserCreated = () => {setUsers([...props.usersManager.list])}

  const getFirestoreUsers = async () => {
    const firebaseUsers = await Firestore.getDocs(usersCollection)
    for (const doc of firebaseUsers.docs) {
      const data = doc.data()
      const user: IUser = {
        ...data
      }
      try {
        props.usersManager.newUser(user, doc.id)
      } catch (error) {
        
      }
    }
  }

  React.useEffect(() => {
    getFirestoreUsers()
  }, [])

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    const modal = document.getElementById("edit-user-modal");
    if (modal && modal instanceof HTMLDialogElement) {
      modal.showModal();
    }
  };

  const handleDeleteUser = async () => {
    if (!editingUser) return;
    if (confirm(`Are you sure you want to delete "${editingUser.name}"?`)) {
      await props.usersManager.deleteUser(editingUser.id);
      setUsers([...props.usersManager.list]);
      const modal = document.getElementById("edit-user-modal");
      if (modal && modal instanceof HTMLDialogElement) {
        modal.close();
      }
      setEditingUser(null);
    }
  };

  const userCards = users.map((user) => {
    return (
      <div key={user.id}>
        <UserCard user={user} onEdit={handleEditUser} />
      </div>
    )
  })

  React.useEffect(() => {
    console.log("Users state updated", users)
  }, [users])

  const onNewUserClick = () => {
    const modal = document.getElementById("new-user-modal")
    if (!(modal && modal instanceof HTMLDialogElement)) {return}
    modal.showModal()
  }

  const onFormSubmit = (e: React.FormEvent) => {
    const userForm = document.getElementById("new-user-form")
    if (!(userForm && userForm instanceof HTMLFormElement)) {return}
    e.preventDefault()
    const formData = new FormData(userForm)
    const userData: IUser = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as UserRole,
      company: formData.get("company") as string || undefined
    }
    try {
      Firestore.addDoc(usersCollection, userData)
      const user = props.usersManager.newUser(userData)
      userForm.reset()
      const modal = document.getElementById("new-user-modal")
      if (!(modal && modal instanceof HTMLDialogElement)) {return}
      modal.close()
    } catch (err) {
      alert(err)
    }
  }

  const onEditFormSubmit = async (e: React.FormEvent) => {
    const userForm = document.getElementById("edit-user-form");
    if (!(userForm && userForm instanceof HTMLFormElement) || !editingUser) {return}
    e.preventDefault();
    const formData = new FormData(userForm);
    const userData: IUser = {
      name: formData.get("name") as string,
      email: formData.get("email") as string,
      role: formData.get("role") as UserRole,
      company: formData.get("company") as string || undefined
    };
    try {
      // Update user properties
      Object.assign(editingUser, userData);
      // Update in Firestore
      const userDoc = Firestore.doc(usersCollection, editingUser.id);
      await Firestore.updateDoc(userDoc, userData as any);
      setUsers([...props.usersManager.list]);
      const modal = document.getElementById("edit-user-modal");
      if (!(modal && modal instanceof HTMLDialogElement)) {return}
      modal.close();
      setEditingUser(null);
    } catch (err) {
      alert(err);
    }
  }

  const onExportUsers = () => {
    props.usersManager.exportToJSON()
  }

  const onImportUsers = () => {
    props.usersManager.importFromJSON()
  }

  const onUserSearch = (value: string) => {
    setUsers(props.usersManager.filterUsers(value))
  }

  return (
    <div className="page" id="users-page" style={{ display: "flex" }}>
      <dialog id="new-user-modal">
        <form onSubmit={(e) => onFormSubmit(e)} id="new-user-form">
          <h2>New User</h2>
          <div className="input-list">
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">person</span>Name
              </label>
              <input
                name="name"
                type="text"
                placeholder="User's full name"
                required
              />
            </div>
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">email</span>Email
              </label>
              <input
                name="email"
                type="email"
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">work</span>Role
              </label>
              <select name="role" required>
                <option value="architect">Architect</option>
                <option value="engineer">Engineer</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">business</span>Company
              </label>
              <input
                name="company"
                type="text"
                placeholder="Company name (optional)"
              />
            </div>
            <div
              style={{
                display: "flex",
                margin: "10px 0px 10px auto",
                columnGap: 10
              }}
            >
              <button type="button" onClick={() => {
                const modal = document.getElementById("new-user-modal");
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
      <dialog id="edit-user-modal">
        <form onSubmit={(e) => onEditFormSubmit(e)} id="edit-user-form">
          <h2>Edit User</h2>
          <div className="input-list">
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">person</span>Name
              </label>
              <input
                name="name"
                type="text"
                defaultValue={editingUser?.name || ""}
                key={editingUser?.id}
                placeholder="User's full name"
                required
              />
            </div>
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">email</span>Email
              </label>
              <input
                name="email"
                type="email"
                defaultValue={editingUser?.email || ""}
                key={editingUser?.id + "-email"}
                placeholder="user@example.com"
                required
              />
            </div>
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">work</span>Role
              </label>
              <select name="role" defaultValue={editingUser?.role || "architect"} key={editingUser?.id + "-role"} required>
                <option value="architect">Architect</option>
                <option value="engineer">Engineer</option>
                <option value="developer">Developer</option>
              </select>
            </div>
            <div className="form-field-container">
              <label>
                <span className="material-icons-round">business</span>Company
              </label>
              <input
                name="company"
                type="text"
                defaultValue={editingUser?.company || ""}
                key={editingUser?.id + "-company"}
                placeholder="Company name (optional)"
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
              <button type="button" onClick={handleDeleteUser} style={{ backgroundColor: "red" }}>
                Delete User
              </button>
              <div style={{ display: "flex", columnGap: 10 }}>
                <button type="button" onClick={() => {
                  const modal = document.getElementById("edit-user-modal");
                  if (modal && modal instanceof HTMLDialogElement) {
                    modal.close();
                    setEditingUser(null);
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
        <bim-label style={{fontSize: "1.3rem", color: "white"}}>Users List</bim-label>
        <SearchBox onChange={(value) => onUserSearch(value)}/>
        <div style={{ display: "flex", alignItems: "center", columnGap: 15 }}>
          <bim-button onclick={onImportUsers} icon={appIcons.UPLOAD} label="Upload"></bim-button>
          <bim-button onclick={onExportUsers} icon={appIcons.DOWNLOAD} label="Download"></bim-button>
          <bim-button onclick={onNewUserClick} icon={appIcons.ADD} label="New User"></bim-button>
        </div>
      </header>
      {
        users.length > 0 ? <div id="projects-list">{ userCards }</div> : <p>There are no users to display!</p>
      }
    </div>
  )
}
