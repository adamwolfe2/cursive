'use client'

import {
  Sparkles, Target, DollarSign, Eye, Zap,
  Calendar, ClipboardList, Leaf,
} from 'lucide-react'

export const ICON_MAP: Record<string, React.ReactNode> = {
  calendar: <Calendar className="h-5 w-5" />,
  dollar: <DollarSign className="h-5 w-5" />,
  clipboard: <ClipboardList className="h-5 w-5" />,
  sprout: <Leaf className="h-5 w-5" />,
  sparkles: <Sparkles className="h-5 w-5" />,
  eye: <Eye className="h-5 w-5" />,
  target: <Target className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
}
