import { SectionHeader } from "./SectionHeader";

interface SummaryProps {
  index: string;
  title: string;
  paragraphs: string[];
}

export function Summary({ index, title, paragraphs }: SummaryProps) {
  return (
    <section
      className="relative pt-6 pb-6 print:[break-inside:avoid]"
      id="summary"
      aria-labelledby="summary-title"
    >
      <SectionHeader index={index} title={title} />
      <div className="max-w-[68ch] font-sans text-[15px] leading-[1.7] md:ml-[var(--rail-offset)]">
        {paragraphs.map((paragraph, indexValue) => (
          <p className={indexValue === 0 ? "m-0" : "mt-3"} key={`${indexValue}-${paragraph}`}>
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
