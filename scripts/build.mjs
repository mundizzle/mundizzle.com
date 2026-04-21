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

const RESUME_PATH = path.join(srcDir, "resume.md");
const RESUME_CSS_PATH = path.join(srcDir, "resume.css");
const TEMPLATE_PATH = path.join(srcDir, "template.html");
const INDEX_PATH = path.join(distDir, "index.html");
const MD_PATH = path.join(distDir, "resume.md");
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

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function renderInline(markdown) {
  return marked.parseInline(markdown.trim());
}

function isBlank(line) {
  return line.trim() === "";
}

function isSeparator(line) {
  return line.trim() === "---";
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

function readLineBlock(raw) {
  return raw.replace(/\r\n/g, "\n").split("\n").map((text, index) => ({
    text,
    line: index + 1,
  }));
}

function createCursor(lines) {
  let index = 0;

  return {
    current() {
      return lines[index];
    },
    eof() {
      return index >= lines.length;
    },
    advance() {
      index += 1;
    },
    skipBlank() {
      while (!this.eof() && isBlank(this.current().text)) {
        this.advance();
      }
    },
    readUntilSeparator() {
      const block = [];

      while (!this.eof() && !isSeparator(this.current().text)) {
        block.push(this.current());
        this.advance();
      }

      return block;
    },
  };
}

function parseContactLine(entry) {
  const line = entry.text.replace(/<br>\s*$/, "").trim();
  if (line === "") {
    return null;
  }

  const linkMatch = line.match(/^\[(.+?)\]\((.+?)\)$/);
  if (linkMatch) {
    return { text: linkMatch[1], href: linkMatch[2] };
  }

  return { text: line };
}

function parseHeader(cursor) {
  cursor.skipBlank();

  const nameEntry = cursor.current();
  if (!nameEntry || !nameEntry.text.startsWith("# ")) {
    fail("expected '# Name' at the top of the file", nameEntry?.line ?? 1);
  }

  const name = nameEntry.text.slice(2).trim();
  cursor.advance();

  const contactBlock = cursor.readUntilSeparator();
  const entries = contactBlock
    .map(parseContactLine)
    .filter(Boolean);

  if (entries.length === 0) {
    fail("expected at least one contact line under the name", nameEntry.line);
  }

  if (cursor.eof()) {
    fail("expected a section separator after contact info", contactBlock.at(-1)?.line ?? nameEntry.line);
  }

  const locationIndex = entries.findIndex((entry) => !entry.href);
  const location = locationIndex === -1 ? "" : entries[locationIndex].text;
  const contact = entries.filter((entry) => entry.href);

  if (contact.length === 0) {
    fail("expected at least one linked contact line under the name", nameEntry.line);
  }

  return { name, location, contact };
}

function parseSections(cursor) {
  const sections = new Map();

  while (!cursor.eof()) {
    if (!isSeparator(cursor.current().text)) {
      fail("expected '---' before a section", cursor.current().line);
    }

    cursor.advance();
    cursor.skipBlank();

    const heading = cursor.current();
    if (!heading || !heading.text.startsWith("## ")) {
      fail("expected a level-two section heading after '---'", heading?.line ?? 1);
    }

    const title = heading.text.slice(3).trim();
    cursor.advance();

    const block = cursor.readUntilSeparator();
    if (sections.has(title)) {
      fail(`duplicate section '${title}'`, heading.line);
    }

    sections.set(title, { line: heading.line, block });
  }

  return sections;
}

function parseSummary(section) {
  const paragraphs = splitParagraphs(section.block);
  if (paragraphs.length !== 1) {
    fail("Summary must contain exactly one paragraph", section.line);
  }

  return paragraphs[0].map((entry) => entry.text.trim()).join(" ");
}

function parseSkills(section) {
  const paragraphs = splitParagraphs(section.block);
  if (paragraphs.length === 0) {
    fail("Core Skills must contain at least one skill row", section.line);
  }

  const rows = new Map();

  for (const paragraph of paragraphs) {
    const text = paragraph.map((entry) => entry.text.trim()).join(" ");
    const match = text.match(/^\*\*(.+?):\*\*\s+(.+)$/);

    if (!match) {
      fail("Core Skills rows must use '**Label:** value' format", paragraph[0].line);
    }

    const sourceLabel = match[1].trim();
    const tokens = match[2]
      .split(",")
      .map((token) => token.trim())
      .filter(Boolean);

    if (tokens.length === 0) {
      fail(`skills row '${sourceLabel}' has no values`, paragraph[0].line);
    }

    if (rows.has(sourceLabel)) {
      rows.get(sourceLabel).tokens.push(...tokens);
    } else {
      rows.set(sourceLabel, { label: sourceLabel, tokens });
    }
  }

  return [...rows.values()];
}

function splitRoleHeading(text, lineNumber) {
  const heading = text.slice(4).trim();
  const commaIndex = heading.lastIndexOf(",");
  if (commaIndex === -1) {
    fail("job heading must be '### Title, Company'", lineNumber);
  }

  return {
    title: heading.slice(0, commaIndex).trim(),
    company: heading.slice(commaIndex + 1).trim(),
  };
}

function parseDateLine(text, lineNumber) {
  const match = text.trim().match(/^\*(.+)\*$/);
  if (!match) {
    fail("expected an italic date line after each job heading", lineNumber);
  }

  const [dates, tenure] = match[1].split("·").map((part) => part.trim());
  return { dates, tenure: tenure || null };
}

function parseExperience(section) {
  const lines = section.block;
  const jobs = [];
  let index = 0;

  const readParagraph = () => {
    const entries = [];

    while (index < lines.length && !isBlank(lines[index].text)) {
      const entry = lines[index];

      if (entry.text.startsWith("### ") || entry.text.trim() === "<div class=\"page-break\"></div>") {
        break;
      }

      entries.push(entry);
      index += 1;
    }

    return entries;
  };

  while (index < lines.length) {
    while (index < lines.length && isBlank(lines[index].text)) {
      index += 1;
    }

    if (index >= lines.length) {
      break;
    }

    if (lines[index].text.trim() === "<div class=\"page-break\"></div>") {
      index += 1;
      continue;
    }

    const headingEntry = lines[index];
    if (!headingEntry.text.startsWith("### ")) {
      fail("expected a job heading inside Experience", headingEntry.line);
    }

    const role = splitRoleHeading(headingEntry.text, headingEntry.line);
    index += 1;

    while (index < lines.length && isBlank(lines[index].text)) {
      index += 1;
    }

    if (index >= lines.length) {
      fail("missing date line after job heading", headingEntry.line);
    }

    const dateInfo = parseDateLine(lines[index].text, lines[index].line);
    index += 1;

    while (index < lines.length && isBlank(lines[index].text)) {
      index += 1;
    }

    const contextEntries = readParagraph();
    if (contextEntries.length === 0) {
      fail("expected a context paragraph after the date line", lines[index - 1]?.line ?? headingEntry.line);
    }

    const job = {
      ...role,
      ...dateInfo,
      context: contextEntries.map((entry) => entry.text.trim()).join(" "),
      bullets: [],
      signatureEngagements: [],
      flagshipClients: [],
    };

    while (index < lines.length) {
      while (index < lines.length && isBlank(lines[index].text)) {
        index += 1;
      }

      if (index >= lines.length) {
        break;
      }

      const entry = lines[index];
      if (entry.text.startsWith("### ") || entry.text.trim() === "<div class=\"page-break\"></div>") {
        break;
      }

      if (!entry.text.startsWith("- ")) {
        fail("expected a top-level bullet or the next job heading", entry.line);
      }

      const bulletText = entry.text.slice(2).trim();

      const signatureMatch = bulletText.match(/^\*\*(Selected work|Signature engagements):\*\*$/);
      if (signatureMatch) {
        index += 1;
        let nestedCount = 0;

        while (index < lines.length) {
          const nested = lines[index];
          if (nested.text.startsWith("    - ")) {
            job.signatureEngagements.push(nested.text.slice(6).trim());
            nestedCount += 1;
            index += 1;
            continue;
          }

          if (isBlank(nested.text)) {
            index += 1;
            continue;
          }

          break;
        }

        if (nestedCount === 0) {
          fail("signature engagements list is empty", entry.line);
        }

        continue;
      }

      const flagshipMatch = bulletText.match(/^\*\*(Selected clients|Flagship clients led)\*\*:\s+(.+)$/);
      if (flagshipMatch) {
        job.flagshipClients = flagshipMatch[2]
          .split(",")
          .map((client) => client.trim().replace(/\.$/, ""))
          .filter(Boolean);

        if (job.flagshipClients.length === 0) {
          fail("flagship clients row has no values", entry.line);
        }

        index += 1;
        continue;
      }

      job.bullets.push(bulletText);
      index += 1;
    }

    jobs.push(job);
  }

  if (jobs.length === 0) {
    fail("Experience must contain at least one job", section.line);
  }

  return jobs;
}

function parseEducation(section) {
  const rows = section.block.filter((entry) => !isBlank(entry.text));
  if (rows.length !== 2) {
    fail("Education must contain exactly one school line and one date line", section.line);
  }

  const schoolLine = rows[0].text.trim();
  const schoolMatch = schoolLine.match(/^\*\*(.+?)\*\*,\s+(.+)$/);
  if (!schoolMatch) {
    fail("Education school line must use '**School**, degree' format", rows[0].line);
  }

  const dateLine = rows[1].text.trim();
  const dateMatch = dateLine.match(/^\*(.+)\*$/);
  if (!dateMatch) {
    fail("Education date line must be italicized", rows[1].line);
  }

  return {
    school: schoolMatch[1].trim(),
    degree: schoolMatch[2].trim(),
    dates: dateMatch[1].trim(),
  };
}

function renderMeta(contact) {
  return contact
    .map((entry) => `        <a href="${escapeHtml(entry.href)}">${escapeHtml(entry.text)}</a>`)
    .join("\n");
}

function renderSummary(summary) {
  return `    <p class="summary">\n      ${escapeHtml(summary)}\n    </p>`;
}

function renderJobs(jobs) {
  return jobs
    .map((job) => {
      const bulletHtml = job.bullets.length
        ? [
            "        <ul class=\"bullets\">",
            ...job.bullets.map((bullet) => `          <li>${renderInline(bullet)}</li>`),
            "        </ul>",
          ].join("\n")
        : "";

      const signatureHtml = job.signatureEngagements.length
        ? [
            "        <div class=\"sub-head\">Signature Engagements</div>",
            "        <ul class=\"sig\">",
            ...job.signatureEngagements.map((item) => `          <li>${renderInline(item)}</li>`),
            "        </ul>",
          ].join("\n")
        : "";

      const flagshipHtml = job.flagshipClients.length
        ? [
            "        <p class=\"flagship\">",
            "          <span class=\"tag\">Flagship Clients</span>",
            `          ${job.flagshipClients.map(escapeHtml).join(" · ")}.`,
            "        </p>",
          ].join("\n")
        : "";

      const metaLines = [
        "      <div class=\"job-meta\">",
        `        <span class="dates">${escapeHtml(job.dates)}</span>`,
      ];

      if (job.tenure) {
        metaLines.push(`        <span class="tenure">${escapeHtml(job.tenure)}</span>`);
      }

      metaLines.push("      </div>");

      return [
        "    <article class=\"job\">",
        ...metaLines,
        "      <div class=\"job-body\">",
        `        <h3>${escapeHtml(job.title)} <span class="at">//</span> <span class="co">${escapeHtml(job.company)}</span></h3>`,
        `        <p class="context">${escapeHtml(job.context)}</p>`,
        bulletHtml,
        signatureHtml,
        flagshipHtml,
        "      </div>",
        "    </article>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n");
}

function renderSkills(skills) {
  const rows = skills
    .map((row) => {
      const tokens = row.tokens
        .map((token) => `            <span class="tok">${escapeHtml(token)}</span>`)
        .join("\n");

      return [
        "        <div class=\"skill-row\">",
        `          <dt>${escapeHtml(row.label)}</dt>`,
        "          <dd>",
        tokens,
        "          </dd>",
        "        </div>",
      ].join("\n");
    })
    .join("\n");

  return [
    "    <div class=\"skills\">",
    "      <div></div>",
    "      <dl class=\"skills-body\">",
    rows,
    "      </dl>",
    "    </div>",
  ].join("\n");
}

function renderEducation(education) {
  return [
    "    <div class=\"edu\">",
    "      <div></div>",
    "      <div class=\"edu-body\">",
    `        <strong>${escapeHtml(education.school)}</strong> — ${escapeHtml(education.degree)}`,
    `        <span class="dates">${escapeHtml(education.dates)}</span>`,
    "      </div>",
    "    </div>",
  ].join("\n");
}

function buildHtml(template, data) {
  const replacements = new Map([
    ["{{CV_VERSION}}", data.cvVersion],
    ["{{NAME}}", escapeHtml(data.name)],
    ["{{LOCATION}}", escapeHtml(data.location)],
    ["{{META}}", renderMeta(data.contact)],
    ["{{SUMMARY}}", renderSummary(data.summary)],
    ["{{EXPERIENCE}}", renderJobs(data.jobs)],
    ["{{SKILLS}}", renderSkills(data.skills)],
    ["{{EDUCATION}}", renderEducation(data.education)],
  ]);

  let output = template;

  for (const [marker, replacement] of replacements) {
    output = output.split(marker).join(replacement);
  }

  const leftover = output.match(/{{[A-Z_]+}}/);
  if (leftover) {
    throw new Error(`template marker '${leftover[0]}' was not replaced`);
  }

  return output;
}

function formatVersion(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `v.${year}.${month}`;
}

async function removeStaleArtifacts() {
  await Promise.all(
    STALE_ARTIFACTS.map(async (artifactPath) => {
      await fs.rm(artifactPath, { force: true }).catch(() => {});
    })
  );
}

async function prepareDist() {
  await fs.rm(distDir, { recursive: true, force: true });
  await fs.mkdir(distDir, { recursive: true });
}

async function main() {
  const [resumeRaw, template] = await Promise.all([
    fs.readFile(RESUME_PATH, "utf8"),
    fs.readFile(TEMPLATE_PATH, "utf8"),
  ]);

  const cursor = createCursor(readLineBlock(resumeRaw));
  const header = parseHeader(cursor);
  const sections = parseSections(cursor);

  const expectedSections = ["Summary", "Core Skills", "Experience", "Education"];
  for (const sectionName of expectedSections) {
    if (!sections.has(sectionName)) {
      throw new Error(`resume.md is missing the '${sectionName}' section`);
    }
  }

  if (sections.size !== expectedSections.length) {
    const unknown = [...sections.keys()].filter((name) => !expectedSections.includes(name));
    throw new Error(`resume.md contains unsupported sections: ${unknown.join(", ")}`);
  }

  const data = {
    ...header,
    cvVersion: formatVersion(),
    summary: parseSummary(sections.get("Summary")),
    skills: parseSkills(sections.get("Core Skills")),
    jobs: parseExperience(sections.get("Experience")),
    education: parseEducation(sections.get("Education")),
  };

  const html = buildHtml(template, data);
  await prepareDist();
  await removeStaleArtifacts();
  await Promise.all([
    fs.writeFile(INDEX_PATH, html),
    fs.copyFile(RESUME_PATH, MD_PATH),
  ]);

  const pdfResult = await mdToPdf(
    { path: RESUME_PATH },
    { stylesheet: [RESUME_CSS_PATH], dest: PDF_PATH }
  );

  if (!pdfResult || !pdfResult.filename) {
    throw new Error("md-to-pdf did not produce a PDF output");
  }

  const [indexStats, mdStats, pdfStats] = await Promise.all([
    fs.stat(INDEX_PATH),
    fs.stat(MD_PATH),
    fs.stat(PDF_PATH),
  ]);

  console.log(`Wrote ${path.basename(INDEX_PATH)} (${indexStats.size} bytes)`);
  console.log(`Wrote ${path.basename(MD_PATH)} (${mdStats.size} bytes)`);
  console.log(`Wrote ${path.basename(PDF_PATH)} (${pdfStats.size} bytes)`);
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
