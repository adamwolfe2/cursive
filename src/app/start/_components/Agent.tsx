/**
 * The Cursive mark as the agent doing the work (the same mark the Audience Builder chat floats), and a sentence
 * written out word by word. Motion lives in start.css (fl-orb, fl-halo, fl-float, fl-word); both are still under
 * reduced motion. The homepage demo (HeroDemo.tsx) keeps its own copies so it stays a twin of the marketing file.
 */
export function AgentOrb({ size, working }: { size: number; working: boolean }) {
  return (
    <span
      className="fl-orb relative inline-grid shrink-0 place-items-center"
      style={{ width: size, height: size }}
      data-working={working || undefined}
      aria-hidden="true"
    >
      <span className="fl-halo absolute -inset-[45%] rounded-full" />
      {/* eslint-disable-next-line @next/next/no-img-element -- tiny static mark, already loaded by the header */}
      <img src="/cursive-logo.png" alt="" width={size} height={size} className="fl-float relative h-full w-full object-contain" />
    </span>
  )
}

/** Visual only; the full sentence is in an sr-only twin so screen readers get it once, whole. */
export function Words({ text, step = 38 }: { text: string; step?: number }) {
  return (
    <>
      <span aria-hidden="true">
        {text.split(' ').map((w, i) => (
          <span key={i}>
            <span className="fl-word" style={{ animationDelay: `${i * step}ms` }}>
              {w}
            </span>{' '}
          </span>
        ))}
      </span>
      <span className="sr-only">{text}</span>
    </>
  )
}
