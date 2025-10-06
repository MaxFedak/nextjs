// automation/feature-docs/generate-feature-doc.js
import { Octokit } from "@octokit/rest";
import OpenAI from "openai";
import { Client as Notion } from "@notionhq/client";
import slugify from "slugify";

const {
    OPENAI_API_KEY,
    NOTION_TOKEN,
    NOTION_DB_ID,
    GITHUB_TOKEN,
    REPO_FULL,
    PR_NUMBER
} = process.env;

for (const k of [
    "OPENAI_API_KEY", "NOTION_TOKEN", "NOTION_DB_ID",
    "GITHUB_TOKEN", "REPO_FULL", "PR_NUMBER"
]) {
    if (!process.env[k]) {
        console.error(`❌ Missing env: ${k}`);
        process.exit(1);
    }
}

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const notion = new Notion({ auth: NOTION_TOKEN });
const octokit = new Octokit({ auth: GITHUB_TOKEN });

/* -------------------------- tiny helpers -------------------------- */
const yymm = (d = new Date()) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;

const toSlug = (txt, words = 6) =>
    slugify(
        (txt || "feature")
            .toLowerCase()
            .replace(/[^a-z0-9\s-]/g, " ")
            .split(/\s+/)
            .slice(0, words)
            .join(" "),
        { lower: true, strict: true }
    );

const extractTaskId = (s = "") => {
    const m = s.match(/\b([A-Z]{2,}-\d+)\b/);
    return m ? m[1] : "N/A";
};

const inferAppArea = (labels = [], files = []) => {
    // Prefer label like "app:billing" or "area:dashboard"
    const byLabel = labels.find(l => /^app:|^area:/.test(l.name));
    if (byLabel) return byLabel.name.split(":")[1] || byLabel.name;

    // fallback: top-level folder of most changed files
    const buckets = {};
    for (const f of files) {
        const top = (f.filename || "").split("/")[0];
        if (!top) continue;
        buckets[top] = (buckets[top] || 0) + 1;
    }
    const top = Object.entries(buckets).sort((a,b) => b[1]-a[1])[0]?.[0];
    return top || "general";
};

/* --------------------- Notion block builders ---------------------- */
const txt = (content) => [{ type: "text", text: { content } }];

const paragraph = (content) => ({
    object: "block",
    type: "paragraph",
    paragraph: { rich_text: txt(content) }
});

const heading = (level, content) => {
    const type = level === 1 ? "heading_1" : level === 2 ? "heading_2" : "heading_3";
    return { object: "block", type, [type]: { rich_text: txt(content) } };
};

const bullet = (content) => ({
    object: "block",
    type: "bulleted_list_item",
    bulleted_list_item: { rich_text: txt(content) }
});

/** Very small Markdown→Notion mapper for headings/bullets/paragraphs */
function mdToBlocks(md) {
    const lines = md.split(/\r?\n/);
    const blocks = [];
    let inList = false;

    for (const line of lines) {
        if (!line.trim()) { inList = false; continue; }

        if (line.startsWith("### ")) {
            inList = false; blocks.push(heading(3, line.slice(4))); continue;
        }
        if (line.startsWith("## ")) {
            inList = false; blocks.push(heading(2, line.slice(3))); continue;
        }
        if (line.startsWith("# ")) {
            inList = false; blocks.push(heading(1, line.slice(2))); continue;
        }
        if (/^\s*-\s+/.test(line)) {
            blocks.push(bullet(line.replace(/^\s*-\s+/, ""))); inList = true; continue;
        }
        blocks.push(paragraph(line));
    }
    return blocks;
}

/* ------------------------------- main ----------------------------- */
async function main() {
    const [owner, repo] = REPO_FULL.split("/");

    // 1) Pull PR, commits, files
    const { data: pr } = await octokit.pulls.get({ owner, repo, pull_number: PR_NUMBER });
    const { data: commits } = await octokit.pulls.listCommits({ owner, repo, pull_number: PR_NUMBER });
    const { data: files } = await octokit.pulls.listFiles({ owner, repo, pull_number: PR_NUMBER });

    const commitLines = commits.map(c => `- ${c.commit.message.split("\n")[0]} (${c.sha.slice(0,7)})`).join("\n");
    const changedFiles = files.map(f => `- ${f.filename}${f.status !== "modified" ? ` (${f.status})` : ""}`).join("\n");

    // 2) Compute metadata for file name + Notion properties
    const short = toSlug(pr.title, 6);
    const fileName = `feature-${yymm()}-${short}.md`;
    const author = pr.user?.login || "unknown";
    const taskId = extractTaskId(`${pr.title} ${pr.body || ""}`);
    const appArea = inferAppArea(pr.labels || [], files || []);
    const project = repo;
    const prUrl = pr.html_url;

    // 3) Build strict prompt per your spec
    const prompt = `
You are a senior engineer documenting a merged PR. Output MUST follow this exact shape and tone.
Write concise, accurate, **Markdown**. Avoid hype; do not fabricate metrics. If "Previous State" is not useful, write "N/A".

Top matter (do NOT number):
File name: ${fileName}
Author: ${author}
Task ID: ${taskId}
App Area: ${appArea}
Project: ${project}

Now the 6 sections exactly:

1. Previous State
   - Summarize what existed before these changes — only if context is useful. Otherwise "N/A".
2. Why This Change Was Needed
   - Based on commit messages and PR description, clearly state the problem/motivation.
3. Decision and Reasoning
   - Explain why this solution was chosen. Mention any obvious alternatives and why they were rejected.
4. What Was Done
   - Summarize the core of the implementation: new components, hooks, APIs, major refactors; add the PR URL (${prUrl}).
5. Results
   - State what was achieved: performance, UX, or reliability improvements, new capabilities, or downstream effects. No fake numbers.
6. Follow-ups / Next Steps
   - List remaining TODOs, known limitations, or future improvements.

Useful context:
PR Title: ${pr.title}
PR Body:
${(pr.body || "(no PR description)")}

Commits:
${commitLines || "(no commits listed)"}

Changed Files:
${changedFiles || "(no file list)"} 
`.trim();

    // 4) Ask the hosted LLM
    const ai = await openai.chat.completions.create({
        model: "gpt-4o",
        temperature: 0.2,
        messages: [
            { role: "system", content: "You generate precise, audit-friendly engineering documentation in Markdown." },
            { role: "user", content: prompt }
        ]
    });

    const md = ai.choices?.[0]?.message?.content?.trim();
    if (!md) throw new Error("Empty LLM response.");

    // 5) Prepare Notion payload
    //    - Fill properties if they exist; always set Title to fileName
    const db = await notion.databases.retrieve({ database_id: NOTION_DB_ID });
    const props = db.properties || {};
    const titleKey = Object.keys(props).find(k => props[k]?.type === "title");
    if (!titleKey) throw new Error("Could not find Title property in Notion database.");

    const maybe = (name, valueBuilder) => (props[name] ? { [name]: valueBuilder() } : {});
    const properties = {
        [titleKey]: { title: [{ text: { content: fileName } }] },
        ...maybe("Author", () => ({ rich_text: [{ type: "text", text: { content: author } }] })),
        ...maybe("Task ID", () => ({ rich_text: [{ type: "text", text: { content: taskId } }] })),
        ...maybe("App Area", () => ({ rich_text: [{ type: "text", text: { content: appArea } }] })),
        ...maybe("Project", () => ({ rich_text: [{ type: "text", text: { content: project } }] })),
        ...maybe("PR URL", () => ({ url: prUrl })),
        ...maybe("Created At", () => ({ date: { start: new Date().toISOString() } }))
    };

    const children = mdToBlocks(md);

    // 6) Create Notion page
    const created = await notion.pages.create({
        parent: { database_id: NOTION_DB_ID },
        properties,
        children
    });

    console.log("✅ Notion page created:", created.id);
    console.log("🔗 Open:", `https://www.notion.so/${created.id.replace(/-/g, "")}`);
}

main().catch(err => {
    console.error("❌ Generation failed:", err);
    process.exit(1);
});