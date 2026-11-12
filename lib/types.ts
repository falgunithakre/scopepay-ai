export interface Milestone {
  id: number;
  title: string;
  deliverables: string[];
  amountUSD: number;
}

export interface GeneratedScope {
  projectTitle: string;
  summary: string;
  timelineWeeks: number;
  totalUSD: number;
  milestones: Milestone[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  source: 'AI' | 'PAYPAL' | 'SYSTEM';
  label: string;
  method?: string;
  status: number | string;
  durationMs?: number;
  body: unknown;
}

export const SAMPLE_PRESETS: Record<string, { title: string; email: string; brief: string }> = {
  ecommerce: {
    title: 'E-commerce Mobile App',
    email: 'client@shopnow.io',
    brief:
      'We need a cross-platform mobile app for our online store. Customers should be able to browse a product catalog with search and filters, add items to a cart, pay by credit card and PayPal, and track their order status. We also need a small admin dashboard where our team can upload products, manage inventory, and see daily sales reports. We currently run on Shopify, but want our own app with push notifications for abandoned carts and flash sales.',
  },
  supportbot: {
    title: 'AI Customer Support Bot',
    email: 'ops@helptech.ai',
    brief:
      'We want an AI customer support bot for our SaaS product. It should answer common questions from our help center docs, escalate complex tickets to a human agent in Zendesk, and work both on our website widget and inside Slack. We need an analytics dashboard showing resolution rate, top asked questions, and customer satisfaction ratings. The bot must support English and Spanish, and hand over the full conversation transcript when escalating.',
  },
};
