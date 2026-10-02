/* Where leads go, set as one sentence with each tool's logo inline like a word. Wraps at any width; no card grid. */
const TOOLS: Array<[name: string, logo: string]> = [
  ["Salesforce", "/integrations/salesforce.svg"],
  ["HubSpot", "/integrations/hubspot-svgrepo-com.svg"],
  ["Gmail", "/integrations/gmail.svg"],
  ["Outlook", "/integrations/icons8-microsoft-outlook-2019.svg"],
  ["Slack", "/integrations/slack-svgrepo-com.svg"],
  ["Zapier", "/integrations/zapier.png"],
  ["Instantly", "/integrations/instantly.webp"],
  ["LinkedIn", "/integrations/linkedin.svg"],
]

export function IntegrationsLine() {
  return (
    <section id="integrations" aria-labelledby="integrations-heading" className="scroll-mt-20 px-6 py-20 sm:py-28">
      <div className="mx-auto max-w-6xl">
        <h2 id="integrations-heading" className="text-[15px] font-semibold text-[#0066DD]">
          Works with your stack
        </h2>
        <p className="mt-5 max-w-5xl text-[1.625rem] font-semibold leading-[1.5] tracking-[-0.02em] text-[#0f172a] sm:text-[2.5rem] sm:leading-[1.45]">
          Your leads land in{" "}
          {TOOLS.map(([name, logo], i) => (
            <span key={name} className="whitespace-nowrap">
              <span className="mx-[0.12em] inline-grid h-[1.15em] w-[1.15em] translate-y-[0.12em] place-items-center rounded-[0.28em] border border-[#e2e8f0] bg-white align-baseline shadow-[0_1px_2px_rgb(15_23_42/0.06)]">
                {/* eslint-disable-next-line @next/next/no-img-element -- small static logo */}
                <img src={logo} alt="" width={20} height={20} className="h-[0.62em] w-[0.62em] object-contain" />
              </span>
              {name}
              {i < TOOLS.length - 2 ? "," : i === TOOLS.length - 1 ? "." : ""}
            </span>
          )).flatMap((el, i) => (i === 0 ? [el] : [i === TOOLS.length - 1 ? " or " : " ", el]))}
        </p>
        <p className="mt-6 max-w-[52ch] text-[17px] leading-relaxed text-[#475569]">
          Push every lead to your CRM, inbox or sequencer. Webhooks and an API cover the rest.
        </p>
      </div>
    </section>
  )
}
