import { IUser, User } from "./User"
import { deleteDocument } from "../firebase"

export class UsersManager {
  list: User[] = []
  OnUserCreated = (user: User) => {}
  OnUserDeleted = (id: string) => {}

  filterUsers(value: string) {
    const filteredUsers = this.list.filter((user) => {
      return user.name.includes(value) || user.email.includes(value)
    })
    return filteredUsers
  }

  newUser(data: IUser, id?: string) {
    const userEmails = this.list.map((user) => {
      return user.email
    })
    const emailInUse = userEmails.includes(data.email)
    if (emailInUse) {
      throw new Error(`A user with the email "${data.email}" already exists`)
    }
    const user = new User(data, id)
    this.list.push(user)
    this.OnUserCreated(user)
    return user
  }

  getUser(id: string) {
    const user = this.list.find((user) => {
      return user.id === id
    })
    return user
  }
  
  async deleteUser(id: string) {
    const user = this.getUser(id)
    if (!user) { return }
    await deleteDocument("users", id)
    const remaining = this.list.filter((user) => {
      return user.id !== id
    })
    this.list = remaining
    this.OnUserDeleted(id)
  }
  
  exportToJSON(fileName: string = "users") {
    const json = JSON.stringify(this.list, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = fileName
    a.click()
    URL.revokeObjectURL(url)
  }
  
  importFromJSON() {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'application/json'
    const reader = new FileReader()
    reader.addEventListener("load", () => {
      const json = reader.result
      if (!json) { return }
      const users: IUser[] = JSON.parse(json as string)
      for (const user of users) {
        try {
          this.newUser(user)
        } catch (error) {
          
        }
      }
    })
    input.addEventListener('change', () => {
      const filesList = input.files
      if (!filesList) { return }
      reader.readAsText(filesList[0])
    })
    input.click()
  }
}
