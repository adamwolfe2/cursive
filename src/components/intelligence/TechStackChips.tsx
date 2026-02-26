interface TechStackChipsProps {
  techStack?: { technologies?: string[] }
  max?: number
}

export function TechStackChips({ techStack, max = 5 }: TechStackChipsProps) {
  const techs = techStack?.technologies ?? []
  if (techs.length === 0) return null

  const shown = techs.slice(0, max)
  const remaining = techs.length - max

  return (
    <div className="flex flex-wrap gap-1">
      {shown.map(tech => (
        <span
          key={tech}
          className="text-xs px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-100"
        >
          {tech}
        </span>
      ))}
      {remaining > 0 && (
        <span className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">+{remaining}</span>
      )}
    </div>
  )
}
