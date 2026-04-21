export type CommentAuthor = 'client' | 'admin'
export type CommentStatus = 'open' | 'resolved'

export interface CopyComment {
  id: string
  client_id: string
  sequence_index: number
  email_step: number
  parent_comment_id: string | null
  author_type: CommentAuthor
  author_name: string | null
  body: string
  quoted_text: string | null
  status: CommentStatus
  resolved_by: CommentAuthor | null
  resolved_at: string | null
  created_at: string
  updated_at: string
}

export interface CopyCommentInsert {
  sequence_index: number
  email_step: number
  body: string
  quoted_text?: string | null
  parent_comment_id?: string | null
  author_name?: string | null
}

export function commentKey(seqIdx: number, emailStep: number): string {
  return `${seqIdx}:${emailStep}`
}

export function groupCommentsByEmail(
  comments: CopyComment[]
): Map<string, CopyComment[]> {
  const map = new Map<string, CopyComment[]>()
  for (const c of comments) {
    const k = commentKey(c.sequence_index, c.email_step)
    const list = map.get(k) ?? []
    list.push(c)
    map.set(k, list)
  }
  for (const list of map.values()) {
    list.sort((a, b) => a.created_at.localeCompare(b.created_at))
  }
  return map
}
