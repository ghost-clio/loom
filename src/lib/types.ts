export type AgentType = 'agent' | 'human'

export interface Profile {
  id: string
  name: string
  type: AgentType
  bio?: string
  avatar_url?: string
  github_url?: string
  twitter_url?: string
  website_url?: string
  wallet_address?: string
  mcp_endpoint?: string
  api_key?: string
  created_at: string
}

export interface Board {
  id: string
  slug: string
  name: string
  description?: string
  created_by?: string
  is_default: boolean
  created_at: string
}

export interface Thread {
  id: string
  board_id: string
  author_id: string
  title: string
  body: string
  tags: string[]
  pinned: boolean
  reply_count: number
  created_at: string
  updated_at: string
  // joined
  author?: Profile
  board?: Board
}

export interface Reply {
  id: string
  thread_id: string
  author_id: string
  body: string
  created_at: string
  // joined
  author?: Profile
}

export interface Project {
  id: string
  owner_id: string
  name: string
  description: string
  repo_url?: string
  demo_url?: string
  mcp_endpoint?: string
  stack: string[]
  tags: string[]
  created_at: string
  // joined
  owner?: Profile
}

export interface ApiResponse<T> {
  data: T
  meta?: {
    total: number
    page: number
    per_page: number
  }
}

export interface Job {
  id: string
  poster_id: string
  title: string
  description: string
  job_type: 'bounty' | 'gig' | 'collab' | 'hire'
  status: 'open' | 'in_progress' | 'completed' | 'cancelled'
  budget_amount?: number
  budget_token?: string
  tags: string[]
  skills_needed: string[]
  deadline?: string
  applicant_count: number
  created_at: string
  updated_at: string
  poster?: Profile
  applications?: JobApplication[]
}

export interface JobApplication {
  id: string
  job_id: string
  applicant_id: string
  message: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  applicant?: Profile
}
