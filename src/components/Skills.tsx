import type { SkillGroup } from "../types/resume";
import { RailBaselineRow, RailDividerRow } from "./RailRow";
import { SectionHeader } from "./SectionHeader";

interface SkillsProps {
  index: string;
  title: string;
  groups: SkillGroup[];
}

export function Skills({ index, title, groups }: SkillsProps) {
  return (
    <section
      className="relative border-t border-rule pt-6 pb-6 print:[break-inside:avoid]"
      id="skills"
      aria-labelledby="skills-title"
    >
      <SectionHeader index={index} title={title} />
      {groups.map((group, groupIndex) =>
        groupIndex === 0 ? (
          <RailBaselineRow
            contentClassName="font-sans text-[15px] leading-[1.7]"
            key={group.label}
            label={
              <h3 className="m-0 text-inherit" id={`skill-${group.label}`}>
                {group.label}
              </h3>
            }
          >
            <ul
              aria-labelledby={`skill-${group.label}`}
              className="m-0 flex list-none flex-wrap gap-x-[8px] gap-y-[2px] p-0"
            >
              {group.tokens.map((token) => (
                <li
                  className="inline-flex items-center gap-[8px] whitespace-nowrap before:font-medium before:text-accent before:content-['—']"
                  key={token}
                >
                  {token}
                </li>
              ))}
            </ul>
          </RailBaselineRow>
        ) : (
          <RailDividerRow
            className="mt-[18px]"
            contentClassName="font-sans text-[15px] leading-[1.7]"
            key={group.label}
            label={
              <h3 className="m-0 text-inherit" id={`skill-${group.label}`}>
                {group.label}
              </h3>
            }
          >
            <ul
              aria-labelledby={`skill-${group.label}`}
              className="m-0 flex list-none flex-wrap gap-x-[8px] gap-y-[2px] p-0"
            >
              {group.tokens.map((token) => (
                <li
                  className="inline-flex items-center gap-[8px] whitespace-nowrap before:font-medium before:text-accent before:content-['—']"
                  key={token}
                >
                  {token}
                </li>
              ))}
            </ul>
          </RailDividerRow>
        ),
      )}
    </section>
  );
}
