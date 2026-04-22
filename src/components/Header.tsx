import type { ContactLink } from "../types/resume";
import { RailBaselineRow } from "./RailRow";

interface HeaderProps {
  location: string;
  name: string;
  contactLinks: ContactLink[];
}

export function Header({ location, name, contactLinks }: HeaderProps) {
  const actionLinkClassName =
    "inline-flex h-[28px] w-[42px] items-center justify-center border-r border-accent text-[12px] leading-none uppercase tracking-[0.12em] text-accent no-underline transition-colors hover:bg-accent hover:text-bg focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent last:border-r-0";

  return (
    <header className="mb-7 border-b border-t border-rule py-6 [border-top-color:var(--rule-strong)] print:[break-inside:avoid]">
      <div className="grid gap-y-[18px]">
        <RailBaselineRow
          label={
            <span className="inline-flex items-baseline gap-[10px]">
              <span className="inline-block size-[7px] rounded-full bg-accent"></span>
              <span>CV</span>
            </span>
          }
          aside={
            <span
              className="inline-flex w-fit items-stretch justify-self-start border border-accent print:hidden md:justify-self-end"
              role="group"
              aria-label="Format"
            >
              <a
                className={actionLinkClassName}
                href="mundi-morgado-resume.md"
                title="View in Markdown format"
              >
                MD
              </a>
              <a
                className={actionLinkClassName}
                href="mundi-morgado-resume.pdf"
                title="View in PDF format"
              >
                PDF
              </a>
            </span>
          }
          asideClassName="md:self-center"
          labelClassName="leading-none"
        >
          <h1 className="m-0 text-[28px] leading-[1.05] font-bold tracking-[-0.015em] text-ink md:text-[34px]">
            {name}
          </h1>
        </RailBaselineRow>

        <RailBaselineRow label={location}>
          <address
            className="font-sans text-[15px] text-ink not-italic"
            aria-label="Contact information"
          >
            <ul className="m-0 flex list-none flex-wrap gap-y-[6px] p-0">
              {contactLinks.map((item) => (
                <li
                  className="mr-[18px] flex border-r border-rule pr-[18px] last:mr-0 last:border-r-0 last:pr-0"
                  key={item.href}
                >
                  <a className="leading-[1.2] no-underline hover:text-accent" href={item.href}>
                    {item.text}
                  </a>
                </li>
              ))}
            </ul>
          </address>
        </RailBaselineRow>
      </div>
    </header>
  );
}
