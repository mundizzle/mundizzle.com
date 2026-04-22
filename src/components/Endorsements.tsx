import type { Endorsement } from "../types/resume";
import { SectionHeader } from "./SectionHeader";

interface EndorsementsProps {
  index: string;
  title: string;
  endorsements: Endorsement[];
}

export function Endorsements({ index, title, endorsements }: EndorsementsProps) {
  return (
    <section
      className="relative border-t border-rule pt-6 pb-6 print:[break-inside:avoid]"
      id="endorsements"
      aria-labelledby="endorsements-title"
    >
      <SectionHeader index={index} title={title} />
      <div className="grid gap-[10px] md:[grid-template-columns:var(--rail-width)_1fr] md:gap-[var(--rail-gap)]">
        <div></div>
        {endorsements.length === 0 ? (
          <p className="font-sans text-[12px] leading-[1.6] text-ink-dim">
            Endorsements available upon request.
          </p>
        ) : (
          <ul className="m-0 grid list-none gap-[14px] p-0 [&>li]:break-inside-avoid">
            {endorsements.map((endorsement) => (
              <li key={`${endorsement.author}-${endorsement.company ?? "none"}`}>
                <figure className="m-0 border-l-2 border-accent bg-surface px-[14px] py-3">
                  <figcaption>
                    <p className="m-0 font-sans text-[15px] leading-[1.5] font-semibold text-ink">
                      {endorsement.sourceUrl ? (
                        <a
                          className="text-ink no-underline hover:underline"
                          href={endorsement.sourceUrl}
                        >
                          {endorsement.author}
                        </a>
                      ) : (
                        endorsement.author
                      )}
                    </p>
                    {endorsement.authorTitle || endorsement.company ? (
                      <p className="mt-1 mb-0 font-sans text-[12px] leading-[1.6] text-ink-dim">
                        {endorsement.authorTitle}
                        {endorsement.company ? (
                          <>
                            <span className="mx-[6px] font-normal text-ink-faint">//</span>
                            <span className="font-semibold text-accent">{endorsement.company}</span>
                          </>
                        ) : null}
                      </p>
                    ) : null}
                  </figcaption>
                  <blockquote className="mt-[10px] mb-0 mx-0 p-0 font-sans text-[15px] leading-[1.65] text-ink-dim [&_p]:mt-0 [&_p]:mb-[10px] [&_p:last-child]:mb-0">
                    {endorsement.quoteParagraphs.map((paragraph) => (
                      <p key={paragraph}>{paragraph}</p>
                    ))}
                  </blockquote>
                </figure>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
