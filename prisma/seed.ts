import { PrismaClient, PortfolioStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting safe seed...");

  // ── SiteSetting ──────────────────────────────────────────────────────────
  const existingSetting = await prisma.siteSetting.findUnique({
    where: { id: "global" },
  });

  if (!existingSetting) {
    const hash = await bcrypt.hash("porto123", 12);
    await prisma.siteSetting.create({
      data: {
        id: "global",
        ownerName: "Azi Ramdani",
        experienceYears: 5,
        aboutBio:
          "Dengan pengalaman mendalam dalam ekosistem digital, saya memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding (Apps Script & Web App), serta kekuatan seni copywriting yang berorientasi konversi.",
        heroRoles: [
          "Full-Stack Vibe Coder",
          "UI/UX Specialist",
          "Persuasive Copywriter",
        ],
        heroHeadline: "Crafting High-Impact Digital Experiences.",
        heroSubheadline:
          "Memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding (Apps Script & Web App), serta kekuatan seni copywriting yang berorientasi konversi.",
        whatsappNumber: "6281234567890",
        isOpenOrder: true,
        adminPinHash: hash,
      },
    });
    console.log("✅ SiteSetting seeded (default PIN: admin1234)");
  } else {
    await prisma.siteSetting.update({
      where: { id: "global" },
      data: {
        ownerName: "Azi Ramdani",
        experienceYears: 5,
        aboutBio:
          "Dengan pengalaman mendalam dalam ekosistem digital, saya memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding (Apps Script & Web App), serta kekuatan seni copywriting yang berorientasi konversi.",
        heroRoles: [
          "Full-Stack Vibe Coder",
          "UI/UX Specialist",
          "Persuasive Copywriter",
        ],
      },
    });
    console.log("✅ SiteSetting updated with Azi Ramdani profile & roles");
  }

  // ── Services ─────────────────────────────────────────────────────────────
  const serviceCount = await prisma.service.count();
  if (serviceCount === 0) {
    const services = await prisma.service.createMany({
      data: [
        {
          title: "Web App Development",
          slug: "web-app-development",
          category: "Development",
          shortDesc:
            "Full-stack web applications built with Next.js, React, and modern cloud infrastructure.",
          priceStart: 5000000,
          features: [
            "Next.js / React / TypeScript",
            "REST API & Server Actions",
            "PostgreSQL / MySQL Database",
            "Responsive Mobile-First Design",
            "3 Months Free Support",
          ],
          isActive: true,
          sortOrder: 1,
        },
        {
          title: "UI/UX Design",
          slug: "ui-ux-design",
          category: "Design",
          shortDesc:
            "User-centered design systems, wireframes, and high-fidelity Figma prototypes.",
          priceStart: 2000000,
          features: [
            "Figma Design System",
            "Wireframe & Prototyping",
            "Mobile & Desktop Mockups",
            "Design Handoff to Developer",
            "2 Rounds of Revision",
          ],
          isActive: true,
          sortOrder: 2,
        },
        {
          title: "Landing Page",
          slug: "landing-page",
          category: "Development",
          shortDesc:
            "Conversion-optimized landing pages with animations and analytics integration.",
          priceStart: 1500000,
          features: [
            "Custom Design (No Templates)",
            "Framer Motion Animations",
            "SEO Optimized",
            "Google Analytics Integration",
            "1 Year Hosting Included",
          ],
          isActive: true,
          sortOrder: 3,
        },
        {
          title: "WordPress Development",
          slug: "wordpress-development",
          category: "CMS",
          shortDesc:
            "Custom WordPress themes and plugins, WooCommerce stores, and performance optimization.",
          priceStart: 3000000,
          features: [
            "Custom Theme Development",
            "WooCommerce Integration",
            "Plugin Development",
            "Speed & SEO Optimization",
            "Admin Training Session",
          ],
          isActive: true,
          sortOrder: 4,
        },
      ],
    });
    console.log(`✅ ${services.count} Services seeded`);
  } else {
    console.log("⏭️  Services already exist, skipping.");
  }

  // ── Portfolio ─────────────────────────────────────────────────────────────
  const portfolioCount = await prisma.portfolio.count();
  if (portfolioCount === 0) {
    const service = await prisma.service.findFirst({
      where: { slug: "web-app-development" },
    });

    await prisma.portfolio.createMany({
      data: [
        {
          title: "NexCommerce — E-Commerce Platform",
          category: "Development",
          shortDesc:
            "A full-featured e-commerce platform with real-time inventory, Stripe payments, and admin dashboard.",
          fullDescription: `## Project Overview\n\nNexCommerce is a production-ready e-commerce solution built from scratch for a retail client needing to scale from brick-and-mortar to online sales.\n\n## Challenges\n- Real-time inventory sync across warehouse and storefront\n- High-concurrency checkout without overselling\n- Multi-currency support with dynamic tax calculation\n\n## Solution\nBuilt on Next.js 14 with Server Components for sub-100ms TTFB. Used Prisma with PostgreSQL for ACID-compliant transactions. Implemented optimistic UI updates with SWR for cart management.\n\n## Results\n- **320% increase** in conversion rate vs. old WooCommerce site\n- **98 Lighthouse score** on mobile\n- **Zero overselling incidents** in 6 months of production`,
          thumbnailUrl:
            "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&q=80",
          techStack: ["Next.js", "TypeScript", "Prisma", "PostgreSQL", "Stripe", "Tailwind CSS"],
          liveDemoUrl: "https://nexcommerce.example.com",
          relatedServiceId: service?.id ?? null,
          status: PortfolioStatus.PUBLISHED,
          isFeatured: true,
        },
        {
          title: "ZenDesk Clone — SaaS Support Portal",
          category: "Development",
          shortDesc:
            "Multi-tenant SaaS ticketing system with AI-powered ticket routing and real-time notifications.",
          fullDescription: `## Project Overview\n\nA custom support desk SaaS built for a B2B company managing 500+ enterprise clients with complex SLA requirements.\n\n## Key Features\n- Multi-tenant architecture with row-level security in PostgreSQL\n- AI-powered ticket categorization using OpenAI API\n- Real-time notifications via WebSocket (Pusher)\n- SLA breach alerting and reporting dashboard\n\n## Tech Decisions\nChose Next.js App Router for co-located server and client logic. Prisma RLS extensions for tenant isolation. Recharts for the analytics dashboard.\n\n## Outcome\n- Reduced average response time by **45%**\n- Support team handles **3x more tickets** per agent`,
          thumbnailUrl:
            "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80",
          techStack: ["Next.js", "TypeScript", "WebSocket", "Pusher", "OpenAI", "Prisma"],
          liveDemoUrl: null,
          relatedServiceId: service?.id ?? null,
          status: PortfolioStatus.PUBLISHED,
          isFeatured: false,
        },
        {
          title: "DesignOS — Figma Design System",
          category: "Design",
          shortDesc:
            "Enterprise-grade Figma design system with 200+ components, documentation, and developer handoff.",
          fullDescription: `## Project Overview\n\nBuilt a comprehensive design system for a fintech startup standardizing their product across 4 teams and 12 products.\n\n## Deliverables\n- 200+ Figma components with auto-layout and variants\n- Color, typography, spacing, and icon token library\n- Interactive prototype for all major user flows\n- Storybook integration for developer handoff\n\n## Impact\n- Reduced design-to-development cycle by **60%**\n- Eliminated inconsistency across all product surfaces`,
          thumbnailUrl:
            "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
          techStack: ["Figma", "Design Systems", "Auto Layout", "Prototyping", "Storybook"],
          liveDemoUrl: "https://www.figma.com/example",
          relatedServiceId: null,
          status: PortfolioStatus.PUBLISHED,
          isFeatured: true,
        },
      ],
    });
    console.log("✅ Portfolio items seeded");
  } else {
    console.log("⏭️  Portfolio already exists, skipping.");
  }

  // ── Testimonials ──────────────────────────────────────────────────────────
  const testCount = await prisma.testimonial.count();
  if (testCount === 0) {
    await prisma.testimonial.createMany({
      data: [
        {
          orderCode: "SEED-001",
          clientName: "Ahmad Fauzi",
          clientRole: "CEO, TechVenture Indonesia",
          rating: 5,
          content:
            "Luar biasa! Proyek e-commerce kami selesai tepat waktu dengan kualitas yang melampaui ekspektasi. Tim sangat responsif dan profesional.",
          isApproved: true,
        },
        {
          orderCode: "SEED-002",
          clientName: "Sari Dewi",
          clientRole: "Marketing Director, GrowthCo",
          rating: 5,
          content:
            "Landing page yang dibuat sangat memukau. Conversion rate naik drastis dalam minggu pertama. Sangat recommended!",
          isApproved: true,
        },
        {
          orderCode: "SEED-003",
          clientName: "Budi Santoso",
          clientRole: "Founder, StartupKita",
          rating: 4,
          content:
            "Desain sistem kami jadi jauh lebih rapi dan konsisten. Kolaborasi yang sangat menyenangkan. Pasti akan order lagi!",
          isApproved: true,
        },
      ],
    });
    console.log("✅ Testimonials seeded");
  } else {
    console.log("⏭️  Testimonials already exist, skipping.");
  }

  console.log("🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

