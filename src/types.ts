export type Pet = {
  id: number
  name: string
  type: string
  breed?: string
  age?: number
  notes?: string
  user_id?: string
  created_at?: string
}

export type SessionUser = {
  email: string
  name: string
  id?: string
}
