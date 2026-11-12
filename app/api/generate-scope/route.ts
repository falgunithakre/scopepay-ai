import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { projectTitle, clientEmail, brief, description } = await req.json();
  const userBrief = brief || description || "Custom web application";
  const apiKey = process.env.AI_API_KEY?.trim();

  const fallbackScope = {
    projectTitle: projectTitle || "Custom Digital Project",
    summary: `End-to-end delivery for ${projectTitle || "your project"}, scoped into three transparent milestone phases with PayPal escrow protection.`,
    estimatedTimeline: "4 weeks",
    timeline: "4 weeks",
    totalUSD: 1450,
    milestones: [
      {
        id: 1,
        title: "Kick-start: Architecture & UI Prototype",
        deliverables: [
          "Interactive wireframes & design system",
          "Database schema & API specification",
          "Clickable prototype review"
        ],
        amountUSD: 450
      },
      {
        id: 2,
        title: "Core Feature Development & Integration",
        deliverables: [
          "Full-stack frontend and backend build",
          "Third-party API and payment setup",
          "Staging deployment for client testing"
        ],
        amountUSD: 600
      },
      {
        id: 3,
        title: "QA Testing, Launch & Handover",
        deliverables: [
          "End-to-end security & mobile responsiveness QA",
          "Production launch & domain configuration",
          "Source code handover & documentation"
        ],
        amountUSD: 400
      }
    ]
  };

  try {
    const res = await fetch("https://groq.com", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              'Output ONLY valid JSON with no markdown or extra text: {"projectTitle":"string","summary":"string","estimatedTimeline":"4 weeks","timeline":"4 weeks","totalUSD":1200,"milestones":[{"id":1,"title":"string","deliverables":["string"],"amountUSD":400},{"id":2,"title":"string","deliverables":["string"],"amountUSD":400},{"id":3,"title":"string","deliverables":["string"],"amountUSD":400}]}. Keep Milestone 1 amountUSD between 250 and 950.'
          },
          {
            role: "user",
            content: `Project: ${projectTitle || "Web App"}. Client: ${clientEmail || "client@example.com"}. Details: ${userBrief}`
          }
        ]
      })
    });

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content || "";
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = match ? JSON.parse(match[0]) : fallbackScope;

    return NextResponse.json({
      scope: parsed,
      logs: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          endpoint: "POST /api/generate-scope (Groq llama-3.1-8b-instant)",
          status: res.status,
          response: parsed
        }
      ]
    });
  } catch (err: any) {
    return NextResponse.json({
      scope: fallbackScope,
      logs: [
        {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          endpoint: "POST /api/generate-scope (Fallback)",
          status: 200,
          response: fallbackScope
        }
      ]
    });
  }
}
