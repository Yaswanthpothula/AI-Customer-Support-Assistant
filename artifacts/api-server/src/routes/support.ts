import { randomUUID } from "node:crypto";
import { Router, type IRouter } from "express";
import {
  ChatWithSupportBody,
  ChatWithSupportResponse,
  CreateSupportTicketBody,
  CreateSupportTicketResponse,
  GetSupportFaqsResponse,
  GetSupportHealthResponse,
} from "@workspace/api-zod";
import { db, supportTicketsTable } from "@workspace/db";

const router: IRouter = Router();

const faqs = [
  {
    id: "shipping",
    title: "Shipping time",
    keywords: ["shipping", "delivery", "deliver", "arrive", "dispatch", "ship"],
    answer:
      "Standard shipping usually takes 3–5 business days after dispatch. Delivery times are estimates and may vary by location.",
  },
  {
    id: "returns",
    title: "Returns policy",
    keywords: ["return", "send back", "exchange", "unused", "wrong size"],
    answer:
      "Unused products can be returned within 30 days of purchase with proof of purchase. Please contact support to confirm eligibility before sending an item back.",
  },
  {
    id: "refunds",
    title: "Refund timing",
    keywords: ["refund", "money back", "reimbursement", "credited"],
    answer:
      "Once a return is approved, refunds are generally processed within 5–7 business days. Your bank or payment provider may take additional time to display the refund.",
  },
  {
    id: "tracking",
    title: "Order tracking",
    keywords: ["track", "tracking", "where is my order", "order status", "package"],
    answer:
      "Use the tracking link in your order confirmation email to check your delivery status. This demo does not connect to real order systems, so I cannot look up an individual order.",
  },
  {
    id: "support_hours",
    title: "Support hours",
    keywords: [
      "hours",
      "open",
      "opening",
      "contact support",
      "support team",
      "business hours",
    ],
    answer:
      "The demo support team is available Monday–Friday, 9:00 AM–5:00 PM IST.",
  },
  {
    id: "payment",
    title: "Payment methods",
    keywords: ["payment", "pay", "card", "upi", "transaction", "charged"],
    answer:
      "This sample store accepts common online payment methods at checkout. This demo cannot inspect actual transactions or confirm whether a payment succeeded.",
  },
];

const escalationKeywords = [
  "fraud",
  "scam",
  "charged twice",
  "double charged",
  "legal",
  "lawyer",
  "data breach",
  "stolen card",
  "unauthorized",
  "urgent",
  "angry",
  "complaint",
  "manager",
  "human",
  "agent",
  "speak to someone",
];

function findFaq(message: string) {
  const normalized = message.toLowerCase();
  const words = new Set(normalized.match(/[a-z0-9']+/g) ?? []);
  let best: (typeof faqs)[number] | undefined;
  let bestScore = 0;

  for (const faq of faqs) {
    let score = 0;
    for (const keyword of faq.keywords) {
      if (keyword.includes(" ")) {
        if (normalized.includes(keyword)) score += 3;
      } else if (words.has(keyword)) {
        score += ["refund", "return", "shipping", "delivery", "tracking", "payment"].includes(
          keyword,
        )
          ? 3
          : 2;
      }
    }
    if (score > bestScore) {
      best = faq;
      bestScore = score;
    }
  }

  return bestScore >= 2 ? { faq: best, score: bestScore } : { faq: undefined, score: 0 };
}

function classifyIssue(message: string, matchedFaq?: (typeof faqs)[number]) {
  if (matchedFaq) return matchedFaq.id;
  const text = message.toLowerCase();
  if (["invoice", "billing", "charged", "payment", "transaction"].some((word) => text.includes(word))) {
    return "billing";
  }
  if (["broken", "damaged", "defect", "not working"].some((word) => text.includes(word))) {
    return "product_issue";
  }
  if (["account", "login", "password", "sign in"].some((word) => text.includes(word))) {
    return "account";
  }
  if (["complaint", "manager", "angry", "unhappy"].some((word) => text.includes(word))) {
    return "complaint";
  }
  return "other";
}

function createTicketId() {
  return `BC-${randomUUID().replaceAll("-", "").slice(0, 8).toUpperCase()}`;
}

router.get("/support/health", (_req, res) => {
  res.json(
    GetSupportHealthResponse.parse({
      status: "ok",
      app: "AI Customer Support Assistant",
      mode: "demo",
    }),
  );
});

router.get("/support/faqs", (_req, res) => {
  res.json(
    GetSupportFaqsResponse.parse(
      faqs.map(({ id, title, answer }) => ({ id, title, answer })),
    ),
  );
});

router.post("/support/chat", async (req, res): Promise<void> => {
  const parsed = ChatWithSupportBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const message = parsed.data.message.trim();
  const { faq, score } = findFaq(message);
  const text = message.toLowerCase();
  const escalation =
    escalationKeywords.some((keyword) => text.includes(keyword)) ||
    !faq ||
    score < 2 ||
    ["my order", "order number", "my account", "my payment", "my refund"].some(
      (phrase) => text.includes(phrase),
    );
  const category = classifyIssue(message, faq);
  const priority = [
    "urgent",
    "fraud",
    "stolen",
    "unauthorized",
    "charged twice",
    "data breach",
  ].some((phrase) => text.includes(phrase))
    ? "high"
    : "normal";
  const answer = faq
    ? escalation
      ? `${faq.answer}\n\nBecause this may need account-specific review, I recommend creating a demo support ticket. This preview does not notify a live team or send email.`
      : `${faq.answer}\n\nIs there anything else I can help you with?`
    : "I don't have enough verified information to answer that reliably. You can save a demo support ticket; this preview does not notify a live team or send email.";

  let ticketId: string | null = null;
  if (
    escalation &&
    (parsed.data.customer_name?.trim() || parsed.data.customer_email?.trim())
  ) {
    ticketId = createTicketId();
    await db.insert(supportTicketsTable).values({
      id: ticketId,
      customerName: parsed.data.customer_name?.trim() || null,
      customerEmail: parsed.data.customer_email?.trim() || null,
      category,
      priority,
      status: "open",
      summary: message.slice(0, 120),
      originalMessage: message,
      assistantReply: answer,
    });
  }

  res.json(
    ChatWithSupportResponse.parse({
      answer,
      category,
      priority,
      escalation_required: escalation,
      matched_faq: faq?.title ?? null,
      mode: "demo",
      ticket_recommended: escalation,
      ticket_id: ticketId,
    }),
  );
});

router.post("/support/tickets", async (req, res): Promise<void> => {
  const parsed = CreateSupportTicketBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const input = parsed.data;
  const message = input.message.trim();
  const ticketId = createTicketId();
  await db.insert(supportTicketsTable).values({
    id: ticketId,
    customerName: input.customer_name?.trim() || null,
    customerEmail: input.customer_email?.trim() || null,
    category: input.category.trim() || "other",
    priority: input.priority,
    status: "open",
    summary: input.summary.trim() || message.slice(0, 120),
    originalMessage: message,
    assistantReply: "Ticket submitted by customer.",
  });

  res.status(201).json(
    CreateSupportTicketResponse.parse({
      ticket_id: ticketId,
      status: "open",
      message: "Your support request has been saved.",
    }),
  );
});

export default router;
