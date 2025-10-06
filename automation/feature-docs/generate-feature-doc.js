// automation/feature-docs/generate-feature-doc.js
import OpenAI from "openai";
import { Client as Notion } from "@notionhq/client";

const {
    OPENAI_API_KEY,
    NOTION_TOKEN,
    NOTION_DB_ID,
    GITHUB_TOKEN,
    REPO_FULL,
    PR_NUMBER,
} = process.env;

function assertEnv(name) {
    if (!process.env[name]) {
        console.error(`❌ Missing env ${name}`);
        process.exit(1);
    }
}
["OPENAI_API_KEY","NOTION_TOKEN","NOTION_DB_ID","GITHUB_TOKEN","REPO_FULL","PR_NUMBER"].forEach(assertEnv);

const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
const notion = new Notion({ auth: NOTION_TOKEN });

// --- helpers ---
async function gh(path) {
    const res = await fetch(`https://api.github.com${path}`, {
        headers: {
            Authorization: `Bearer ${GITHUB_TOKEN}`,
            Accept: "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        },
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error(`GitHub ${path} -> ${res.status}\n${body}`);
    }
    return res.json();
}

function splitParagraphs(md) {
    // Split on blank lines and chunk paragraphs to fit Notion's limits
    const paras = md.split(/\r?\n\r?\n/).map(s => s.trim()).filter(Boolean);
    const chunks = [];
    for (const p of paras) {
        let start = 0;
        const MAX = 1800; // safe under Notion text limits
        while (start < p.length) {
            chunks.push(p.slice(start, start + MAX));
            start += MAX;
        }
    }
    return chunks;
}

function mdToNotionBlocks(md) {
    // Minimal & robust: convert paragraphs (no heavy Markdown parsing yet)
    return splitParagraphs(md).map(text => ({
        object: "block",
        type: "paragraph",
        paragraph: { rich_text: [{ type: "text", text: { content: text } }] }
    }));
}

function extractTicketId(text) {
    const m = text?.match(/\b([A-Z]{2,}-\d+)\b/);
    return m ? m[1] : "";
}

async function main() {
    const [owner, repo] = REPO_FULL.split("/");
    // 1) Pull PR details, commits
    const pr = await gh(`/repos/${owner}/${repo}/pulls/${PR_NUMBER}`);
    const commits = await gh(`/repos/${owner}/${repo}/pulls/${PR_NUMBER}/commits`);
    const commitList = commits.map(c => `- ${c.commit.message.split("\n")[0]} (${c.sha.slice(0,7)})`).join("\n");

    // 2) Build prompt for hosted LLM (ChatGPT)
    const prompt = `
Generate internal feature documentation in Markdown with these EXACT headings:

1. Previous State
2. Why This Change Was Needed
3. Decision and Reasoning
4. What Was Done
5. Results
6. Follow-ups / Next Steps

Rules:
- Plain, neutral tone. 250–400 words total.
- Do NOT invent metrics. If unknown, be generic.
- If previous state isn't clear, put "N/A".
- Mention the PR URL in "What Was Done".

PR Title: ${pr.title}
PR Author: ${pr.user?.login}
PR URL: ${pr.html_url}
PR Body:
${pr.body || "(no description)"}

Commits:
${commitList || "(no commits read?)"}

Likely ticket ID (if present): ${extractTicketId((pr.title || "") + " " + (pr.body || ""))}
`.trim();

    const ai = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
            { role: "system", content: "You generate precise, audit-friendly engineering docs." },
            { role: "user", content: prompt }
        ],
        temperature: 0.2
    });

    const md = ai.choices?.[0]?.message?.content?.trim();
    if (!md) throw new Error("Empty LLM response.");

    // 3) Read DB schema to locate Title prop and optional props
    const db = await notion.databases.retrieve({ database_id: NOTION_DB_ID });
    const props = db.properties || {};
    const titleKey = Object.keys(props).find(k => props[k]?.type === "title");
    if (!titleKey) throw new Error("Could not find Title property in Notion database.");

    const hasAuthor = !!props["Author"];
    const hasPrUrl  = !!props["PR URL"];
    const hasTaskId = !!props["Task ID"];
    const hasProject= !!props["Project"];

    const properties = {
        [titleKey]: { title: [{ text: { content: `feature-${new Date().toISOString().slice(0,7)}-${pr.title}` } }] }
    };
    if (hasAuthor) properties["Author"] = { rich_text: [{ type: "text", text: { content: pr.user?.login || "" } }] };
    if (hasPrUrl)  properties["PR URL"] = { url: pr.html_url };
    if (hasTaskId) properties["Task ID"] = { rich_text: [{ type: "text", text: { content: extractTicketId(pr.title + " " + (pr.body||"")) } }] };
    if (hasProject)properties["Project"] = { rich_text: [{ type: "text", text: { content: repo } }] };

    // 4) Create page
    const page = await notion.pages.create({
        parent: { database_id: NOTION_DB_ID },
        properties,
        children: mdToNotionBlocks(md)
    });

    console.log("✅ Notion page created:", page.id);
    console.log("🔗 Open:", `https://www.notion.so/${page.id.replace(/-/g, "")}`);
}

main().catch(err => {
    console.error("❌ Generation failed:", err);
    process.exit(1);
});