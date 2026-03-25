export const maxDuration = 5

import { NextRequest, NextResponse } from 'next/server'
import { authenticateExtension, extAuthErrorResponse } from '@/lib/middleware/ext-auth'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(req: NextRequest) {
  try {
    const auth = await authenticateExtension(req)
    const supabase = createAdminClient()

    // Get workspace owner's credit balance
    const { data: user } = await supabase
      .from('users')
      .select('credits, plan')
      .eq('id', auth.userId)
      .maybeSingle()

    return NextResponse.json({
      data: {
        remaining: user?.credits ?? 0,
        plan: user?.plan ?? 'free',
        workspace_id: auth.workspaceId,
      },
    })
  } catch (error) {
    return extAuthErrorResponse(error)
  }
}
