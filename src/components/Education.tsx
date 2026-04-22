import type { EducationEntry } from "../types/resume";
import { RailBaselineRow } from "./RailRow";
import { SectionHeader } from "./SectionHeader";

interface EducationProps {
  index: string;
  title: string;
  entries: EducationEntry[];
}

export function Education({ index, title, entries }: EducationProps) {
  return (
    <section
      className="relative border-t border-rule pt-6 pb-6 print:[break-inside:avoid]"
      id="education"
      aria-labelledby="education-title"
    >
      <SectionHeader index={index} title={title} />
      <div className="grid gap-[16px]">
        {entries.map((entry) => (
          <RailBaselineRow
            key={`${entry.school}-${entry.dates}`}
            label={entry.dates}
            labelClassName="[font-variant-numeric:tabular-nums]"
          >
            <section>
              <h3 className="m-0 text-[16px] leading-[1.3] font-semibold text-ink">
                {entry.school}
              </h3>
              <p className="mt-0.5 font-sans text-[15px] leading-[1.5] text-ink-dim">
                {entry.degree}
              </p>
            </section>
          </RailBaselineRow>
        ))}
      </div>
    </section>
  );
}
