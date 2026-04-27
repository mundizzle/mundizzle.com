import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { marked } from "marked";
import { mdToPdf } from "md-to-pdf";

const __filename = fileURLToPath(import.meta.url);
const scriptsDir = path.dirname(__filename);
const rootDir = path.dirname(scriptsDir);
const srcDir = path.join(rootDir, "src");
const distDir = path.join(rootDir, "dist");
const generatedDir = path.join(srcDir, "generated");
const publicDir = path.join(rootDir, "public");

const RESUME_PATH = path.join(srcDir, "resume.md");
const ENDORSEMENTS_PATH = path.join(srcDir, "endorsements.md");
const RESUME_CSS_PATH = path.join(srcDir, "resume-pdf.css");
const GENERATED_DATA_PATH = path.join(generatedDir, "resume-data.ts");
const PUBLIC_MD_PATH = path.join(publicDir, "resume.md");
const PUBLIC_PDF_PATH = path.join(publicDir, "resume.pdf");
const MD_PATH = path.join(distDir, "resume.md");
const PDF_MD_PATH = path.join(distDir, ".resume-pdf.md");
const PDF_PATH = path.join(distDir, "resume.pdf");
const STALE_ARTIFACTS = [
  path.join(distDir, "mundi-morgado-resume.md"),
  path.join(distDir, "mundi-morgado-resume.pdf"),
];

class ParseError extends Error {
  constructor(message, lineNumber) {
    super(`resume.md:${lineNumber}: ${message}`);
    this.name = "ParseError";
  }
}

function fail(message, lineNumber) {
  throw new ParseError(message, lineNumber);
}

function renderInlineHtml(markdown) {
  return marked.parseInline(markdown.trim());
}

function isBlank(text) {
  return text.trim() === "";
}

function isSeparator(text) {
  return text.trim() === "---";
}

function readLineBlock(raw) {
  return raw
    .replace(/\r\n/g, "\n")
    .split("\n")
    .map((text, index) => ({
      text,
      line: index + 1,
    }));
}

function isHeading(entry, level) {
  return entry.text.startsWith(`${"#".repeat(level)} `);
}

function headingText(entry, level) {
  return entry.text.slice(level + 1).trim();
}

function splitParagraphs(block) {
  const paragraphs = [];
  let current = [];

  for (const entry of block) {
    if (isBlank(entry.text)) {
      if (current.length > 0) {
        paragraphs.push(current);
        current = [];
      }
      continue;
    }

    current.push(entry);
  }

  if (current.length > 0) {
    paragraphs.push(current);
  }

  return paragraphs;
}

function readParagraph(block, startIndex, stopAt = () => false) {
  const entries = [];
  let index = startIndex;

  while (index < block.length) {
    const entry = block[index];
    if (isBlank(entry.text)) {
      if (entries.length > 0) {
        break;
      }
      index += 1;
      continue;
    }
    if (stopAt(entry)) {
      break;
    }

    entries.push(entry);
    index += 1;
  }

  return { entries, nextIndex: index };
}

function parseLinkOnly(markdown) {
  const match = markdown.trim().match(/^\[(.+?)\]\((.+?)\)$/);
  if (!match) {
    return null;
  }

  return { text: match[1], href: match[2] };
}

function parseDocument(lines) {
  let index = 0;

  while (index < lines.length && isBlank(lines[index].text)) {
    index += 1;
  }

  const nameEntry = lines[index];
  if (!nameEntry || !isHeading(nameEntry, 1)) {
    fail("expected '# Name' at the top of the file", nameEntry?.line ?? 1);
  }

  const name = headingText(nameEntry, 1);
  index += 1;

  const sections = new Map();

  while (index < lines.length) {
    while (index < lines.length && (isBlank(lines[index].text) || isSeparator(lines[index].text))) {
      index += 1;
    }

    if (index >= lines.length) {
      break;
    }

    const entry = lines[index];
    if (!isHeading(entry, 2)) {
      fail("expected a level-two heading", entry.line);
    }

    const title = headingText(entry, 2);
    index += 1;

    const block = [];
    while (index < lines.length && !isHeading(lines[index], 2)) {
      if (!isSeparator(lines[index].text)) {
        block.push(lines[index]);
      }
      index += 1;
    }

    if (sections.has(title)) {
      fail(`duplicate section '${title}'`, entry.line);
    }

    sections.set(title, { title, line: entry.line, block });
  }

  return { name, sections };
}

function parseContact(section) {
  const items = section.block
    .filter((entry) => !isBlank(entry.text))
    .map((entry) => {
      if (!entry.text.startsWith("- ")) {
        fail("Contact entries must be list items", entry.line);
      }

      const raw = entry.text.slice(2).trim();
      const link = parseLinkOnly(raw);
      return link ? { ...link, raw } : { text: raw, raw };
    });

  if (items.length === 0) {
    fail("Contact section must contain at least one list item", section.line);
  }

  return items;
}

function parseSummary(section) {
  const paragraphs = splitParagraphs(section.block).map((paragraph) =>
    paragraph.map((entry) => entry.text.trim()).join(" "),
  );

  if (paragraphs.length === 0) {
    fail("Summary must contain at least one paragraph", section.line);
  }

  return paragraphs;
}

function parseSkills(section) {
  const rows = [];
  const block = section.block;
  let index = 0;

  while (index < block.length) {
    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    if (index >= block.length) {
      break;
    }

    const heading = block[index];
    if (!isHeading(heading, 3)) {
      fail("Skills must use level-three headings for each category", heading.line);
    }

    const label = headingText(heading, 3);
    index += 1;

    const tokens = [];
    while (index < block.length) {
      const entry = block[index];

      if (isBlank(entry.text)) {
        index += 1;
        continue;
      }

      if (isHeading(entry, 3)) {
        break;
      }

      if (!entry.text.startsWith("- ")) {
        fail("Skills category values must be list items", entry.line);
      }

      tokens.push(entry.text.slice(2).trim());
      index += 1;
    }

    if (tokens.length === 0) {
      fail(`skills category '${label}' has no values`, heading.line);
    }

    rows.push({ label, tokens });
  }

  if (rows.length === 0) {
    fail("Skills must contain at least one category", section.line);
  }

  return rows;
}

function parseDateLine(text, lineNumber) {
  const match = text.trim().match(/^([*_])(.+)\1$/);
  if (!match) {
    fail("expected an italicized date line", lineNumber);
  }

  const [dates, tenure] = match[2].split("·").map((part) => part.trim());
  return { dates, tenure: tenure || null };
}

function parseExperience(section) {
  const jobs = [];
  const block = section.block;
  let index = 0;

  while (index < block.length) {
    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    if (index >= block.length) {
      break;
    }

    const heading = block[index];
    if (!isHeading(heading, 3)) {
      fail("Experience entries must use level-three headings for role titles", heading.line);
    }

    const title = headingText(heading, 3);
    index += 1;

    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    if (index >= block.length) {
      fail("missing company line after role heading", heading.line);
    }

    const companyEntry = block[index];
    if (
      isHeading(companyEntry, 3) ||
      isHeading(companyEntry, 4) ||
      companyEntry.text.startsWith("- ")
    ) {
      fail("expected a company line after role heading", companyEntry.line);
    }

    const company = companyEntry.text.trim();
    index += 1;

    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    if (index >= block.length) {
      fail("missing date line after company line", companyEntry.line);
    }

    const dateInfo = parseDateLine(block[index].text, block[index].line);
    index += 1;

    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    const stopAtContext = (entry) =>
      isHeading(entry, 3) || isHeading(entry, 4) || entry.text.startsWith("- ");
    const contextParagraph = readParagraph(block, index, stopAtContext);
    if (contextParagraph.entries.length === 0) {
      fail(
        "expected a context paragraph after the date line",
        block[index - 1]?.line ?? heading.line,
      );
    }

    index = contextParagraph.nextIndex;
    const job = {
      title,
      company,
      ...dateInfo,
      context: contextParagraph.entries.map((entry) => entry.text.trim()).join(" "),
      bullets: [],
      selectedWork: [],
      selectedClients: [],
    };

    while (index < block.length) {
      while (index < block.length && isBlank(block[index].text)) {
        index += 1;
      }

      if (index >= block.length) {
        break;
      }

      const entry = block[index];
      if (isHeading(entry, 3)) {
        break;
      }

      if (entry.text.startsWith("- ")) {
        job.bullets.push(entry.text.slice(2).trim());
        index += 1;
        continue;
      }

      if (isHeading(entry, 4)) {
        const label = headingText(entry, 4);
        index += 1;

        const items = [];
        while (index < block.length) {
          const nested = block[index];
          if (isBlank(nested.text)) {
            index += 1;
            continue;
          }
          if (isHeading(nested, 3) || isHeading(nested, 4)) {
            break;
          }
          if (!nested.text.startsWith("- ")) {
            fail(`expected list items under '${label}'`, nested.line);
          }
          items.push(nested.text.slice(2).trim());
          index += 1;
        }

        if (items.length === 0) {
          fail(`subsection '${label}' must contain at least one list item`, entry.line);
        }

        if (label === "Selected Work") {
          job.selectedWork = items;
        } else if (label === "Selected Clients") {
          job.selectedClients = items;
        } else {
          fail(`unsupported experience subsection '${label}'`, entry.line);
        }

        continue;
      }

      fail("unexpected content inside experience entry", entry.line);
    }

    jobs.push(job);
  }

  if (jobs.length === 0) {
    fail("Experience must contain at least one role", section.line);
  }

  return jobs;
}

function parseEducation(section) {
  const block = section.block;
  let index = 0;
  const entries = [];

  while (index < block.length) {
    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    if (index >= block.length) {
      break;
    }

    const heading = block[index];
    if (!isHeading(heading, 3)) {
      fail("Education entries must use level-three headings", heading.line);
    }

    const school = headingText(heading, 3);
    index += 1;

    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    if (index >= block.length) {
      fail("missing degree line in Education", heading.line);
    }

    const degree = block[index].text.trim();
    index += 1;

    while (index < block.length && isBlank(block[index].text)) {
      index += 1;
    }

    if (index >= block.length) {
      fail("missing date line in Education", heading.line);
    }

    const dateInfo = parseDateLine(block[index].text, block[index].line);
    index += 1;

    entries.push({ school, degree, dates: dateInfo.dates });
  }

  if (entries.length === 0) {
    fail("Education must contain at least one entry", section.line);
  }

  return entries;
}

function parseEndorsements(raw) {
  const lines = readLineBlock(raw);
  let index = 0;

  while (index < lines.length && isBlank(lines[index].text)) {
    index += 1;
  }

  const section = lines[index];
  if (!section || !isHeading(section, 2) || headingText(section, 2) !== "Endorsements") {
    throw new Error("endorsements.md must begin with '## Endorsements'");
  }

  index += 1;
  const endorsements = [];

  while (index < lines.length) {
    while (index < lines.length && isBlank(lines[index].text)) {
      index += 1;
    }

    if (index >= lines.length) {
      break;
    }

    const heading = lines[index];
    if (!isHeading(heading, 3)) {
      throw new Error(
        `endorsements.md:${heading.line}: expected a level-three heading for each endorsement`,
      );
    }

    const author = headingText(heading, 3);
    index += 1;

    while (index < lines.length && isBlank(lines[index].text)) {
      index += 1;
    }

    const fields = new Map();
    while (index < lines.length && lines[index].text.startsWith("- ")) {
      const entry = lines[index];
      const match = entry.text.slice(2).match(/^([^:]+):\s*(.+)$/);
      if (!match) {
        throw new Error(
          `endorsements.md:${entry.line}: expected metadata in '- Label: Value' format`,
        );
      }

      const label = match[1].trim();
      const value = match[2].trim();
      fields.set(label, value);
      index += 1;
    }

    while (index < lines.length && isBlank(lines[index].text)) {
      index += 1;
    }

    const quoteParagraph = readParagraph(lines, index, (entry) => isHeading(entry, 3));
    const quote = quoteParagraph.entries
      .map((entry) => entry.text.trim())
      .join(" ")
      .trim();
    if (!quote) {
      throw new Error(`endorsements.md:${heading.line}: endorsement is missing quote text`);
    }

    index = quoteParagraph.nextIndex;

    endorsements.push({
      author,
      sourceUrl: fields.get("URL") || null,
      authorTitle: fields.get("Title") || null,
      company: fields.get("Company") || null,
      date: fields.get("Date") || null,
      quote,
      sortIndex: endorsements.length,
    });
  }

  endorsements.sort((left, right) => {
    const leftDate = left.date ?? "";
    const rightDate = right.date ?? "";

    if (leftDate !== rightDate) {
      return rightDate.localeCompare(leftDate);
    }

    return left.sortIndex - right.sortIndex;
  });

  return endorsements;
}

async function buildParsedContent() {
  const [resumeRaw, endorsementsRaw] = await Promise.all([
    fs.readFile(RESUME_PATH, "utf8"),
    fs.readFile(ENDORSEMENTS_PATH, "utf8"),
  ]);

  const { name, sections } = parseDocument(readLineBlock(resumeRaw));
  const requiredSections = ["Contact", "Summary", "Skills", "Experience", "Education"];

  for (const sectionName of requiredSections) {
    if (!sections.has(sectionName)) {
      throw new Error(`resume.md is missing the '${sectionName}' section`);
    }
  }

  const unknown = [...sections.keys()].filter((nameValue) => !requiredSections.includes(nameValue));
  if (unknown.length > 0) {
    throw new Error(`resume.md contains unsupported sections: ${unknown.join(", ")}`);
  }

  const contact = parseContact(sections.get("Contact"));

  return {
    resumeRaw,
    data: {
      name,
      location: contact.find((entry) => !entry.href)?.text ?? "",
      contact,
      summaryTitle: sections.get("Summary").title,
      skillsTitle: sections.get("Skills").title,
      experienceTitle: sections.get("Experience").title,
      educationTitle: sections.get("Education").title,
      endorsementsTitle: "Endorsements",
      summary: parseSummary(sections.get("Summary")),
      skills: parseSkills(sections.get("Skills")),
      jobs: parseExperience(sections.get("Experience")),
      education: parseEducation(sections.get("Education")),
      endorsements: parseEndorsements(endorsementsRaw),
    },
  };
}

function createSiteData(parsed) {
  return {
    name: parsed.name,
    location: parsed.location,
    summaryTitle: parsed.summaryTitle,
    skillsTitle: parsed.skillsTitle,
    experienceTitle: parsed.experienceTitle,
    educationTitle: parsed.educationTitle,
    endorsementsTitle: parsed.endorsementsTitle,
    contactLinks: parsed.contact
      .filter((entry) => entry.href)
      .map((entry) => ({ text: entry.text, href: entry.href })),
    summary: parsed.summary,
    skills: parsed.skills,
    jobs: parsed.jobs.map((job) => ({
      title: job.title,
      companyHtml: renderInlineHtml(job.company),
      dates: job.dates,
      tenure: job.tenure,
      context: job.context,
      bulletsHtml: job.bullets.map((bullet) => renderInlineHtml(bullet)),
      selectedWorkHtml: job.selectedWork.map((item) => renderInlineHtml(item)),
      selectedClients: job.selectedClients,
    })),
    education: parsed.education,
    endorsements: parsed.endorsements.map((endorsement) => ({
      author: endorsement.author,
      sourceUrl: endorsement.sourceUrl,
      authorTitle: endorsement.authorTitle,
      company: endorsement.company,
      quoteParagraphs: endorsement.quote
        .split(/\n\s*\n/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean),
    })),
  };
}

function renderPdfContact(contact) {
  const pdfContact = contact.filter((entry) => entry.text !== "mundizzle.com");
  const rows = [pdfContact.slice(0, 2), pdfContact.slice(2)].filter((row) => row.length > 0);

  return rows.map((row, index) => {
    const suffix = index < rows.length - 1 ? "<br>" : "";
    return `${row.map((entry) => entry.raw).join(" | ")}${suffix}`;
  });
}

function renderPdfMarkdown(data) {
  const lines = [
    `# ${data.name}`,
    "",
    ...renderPdfContact(data.contact),
    "",
    "---",
    "",
    "## Summary",
    "",
    data.summary.join(" "),
    "",
    "---",
    "",
    "## Skills",
    "",
  ];

  for (const row of data.skills) {
    lines.push(`**${row.label}:** ${row.tokens.join(", ")}`);
    lines.push("");
  }

  lines.push("---", "", "## Experience", "");

  for (const job of data.jobs) {
    lines.push(`### ${job.title}, ${job.company}`);
    lines.push(`*${job.dates}${job.tenure ? ` · ${job.tenure}` : ""}*`);
    lines.push("");
    lines.push(job.context);
    lines.push("");

    for (const bullet of job.bullets) {
      lines.push(`- ${bullet}`);
    }

    if (job.selectedWork.length > 0) {
      lines.push("- **Selected work:**");
      for (const item of job.selectedWork) {
        lines.push(`    - ${item}`);
      }
    }

    if (job.selectedClients.length > 0) {
      lines.push(`- **Selected clients:** ${job.selectedClients.join(", ")}.`);
    }

    lines.push("");
  }

  lines.push("---", "", "## Education", "");

  for (const entry of data.education) {
    lines.push(`**${entry.school}**, ${entry.degree}`);
    lines.push(`*${entry.dates}*`);
    lines.push("");
  }

  return `${lines.join("\n").trimEnd()}\n`;
}

function renderDataModule(siteData) {
  return [
    'import type { ResumeData } from "../types/resume";',
    "",
    `const resumeData = ${JSON.stringify(siteData, null, 2)} satisfies ResumeData;`,
    "",
    "export default resumeData;",
    "",
  ].join("\n");
}

async function writeAppData(siteData) {
  await fs.mkdir(generatedDir, { recursive: true });
  await fs.writeFile(GENERATED_DATA_PATH, renderDataModule(siteData));
}

async function removeStaleArtifacts() {
  await Promise.all(
    STALE_ARTIFACTS.map(async (artifactPath) => {
      await fs.rm(artifactPath, { force: true }).catch(() => {});
    }),
  );
}

async function writeArtifacts(resumeRaw, parsedData) {
  await fs.mkdir(distDir, { recursive: true });
  await removeStaleArtifacts();
  await fs.writeFile(MD_PATH, resumeRaw);

  const pdfMarkdown = renderPdfMarkdown(parsedData);
  await fs.writeFile(PDF_MD_PATH, pdfMarkdown);

  const pdfResult = await mdToPdf(
    { path: PDF_MD_PATH },
    { stylesheet: [RESUME_CSS_PATH], dest: PDF_PATH },
  );

  if (!pdfResult || !pdfResult.filename) {
    throw new Error("md-to-pdf did not produce a PDF output");
  }

  await fs.rm(PDF_MD_PATH, { force: true }).catch(() => {});
}

async function writePublicArtifacts(resumeRaw, parsedData) {
  await fs.mkdir(publicDir, { recursive: true });
  await fs.writeFile(PUBLIC_MD_PATH, resumeRaw);

  const pdfMarkdown = renderPdfMarkdown(parsedData);
  await fs.writeFile(PDF_MD_PATH, pdfMarkdown);

  const pdfResult = await mdToPdf(
    { path: PDF_MD_PATH },
    { stylesheet: [RESUME_CSS_PATH], dest: PUBLIC_PDF_PATH },
  );

  if (!pdfResult || !pdfResult.filename) {
    throw new Error("md-to-pdf did not produce a PDF output");
  }

  await fs.rm(PDF_MD_PATH, { force: true }).catch(() => {});
}

async function main() {
  const mode = process.argv[2] ?? "all";
  const { resumeRaw, data } = await buildParsedContent();
  const siteData = createSiteData(data);

  if (mode === "data") {
    await writeAppData(siteData);
    return;
  }

  if (mode === "dev-assets") {
    await writeAppData(siteData);
    await writePublicArtifacts(resumeRaw, data);
    return;
  }

  if (mode === "artifacts") {
    await writeArtifacts(resumeRaw, data);
    return;
  }

  if (mode === "all") {
    await writeAppData(siteData);
    await writeArtifacts(resumeRaw, data);
    return;
  }

  throw new Error(`unknown mode '${mode}'`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
