import { Education } from "./components/Education";
import { Endorsements } from "./components/Endorsements";
import { Experience } from "./components/Experience";
import { Header } from "./components/Header";
import { Skills } from "./components/Skills";
import { Summary } from "./components/Summary";
import resumeData from "./generated/resume-data";

export default function App() {
  return (
    <div className="relative z-[1] mx-auto max-w-[860px] px-5 pb-16 pt-14 md:px-8 md:pb-24 print:max-w-none print:px-0 print:pb-0 print:pt-0">
      <Header
        location={resumeData.location}
        name={resumeData.name}
        contactLinks={resumeData.contactLinks}
      />

      <main>
        <Summary index="00" title={resumeData.summaryTitle} paragraphs={resumeData.summary} />
        <Skills index="01" title={resumeData.skillsTitle} groups={resumeData.skills} />
        <Experience index="02" title={resumeData.experienceTitle} jobs={resumeData.jobs} />
        <Education index="03" title={resumeData.educationTitle} entries={resumeData.education} />
        <Endorsements
          index="04"
          title={resumeData.endorsementsTitle}
          endorsements={resumeData.endorsements}
        />
      </main>

      <footer className="mt-10 flex justify-between border-t border-rule-strong pt-[18px] text-[10.5px] uppercase tracking-[0.2em] text-ink-faint print:[break-inside:avoid]">
        <div className="before:text-accent before:content-['■_']">END OF FILE</div>
      </footer>
    </div>
  );
}
