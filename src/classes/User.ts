import { v4 as uuidv4 } from 'uuid'

export type UserRole = "architect" | "engineer" | "developer"

export interface IUser {
  name: string
  email: string
  role: UserRole
  company?: string
}

export class User implements IUser {
  // To satisfy IUser
  name: string
  email: string
  role: UserRole
  company?: string
  
  // Class internals
  id: string

  constructor(data: IUser, id = uuidv4()) {
    for (const key in data) {
      (this as any)[key] = data[key as keyof IUser]
    }
    this.id = id
  }
}
