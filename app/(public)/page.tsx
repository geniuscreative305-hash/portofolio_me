import { prisma } from "@/lib/prisma";
import PortfolioClientView from "@/components/public/PortfolioClientView";
import type { SiteSettingItem, ServiceItem, PortfolioItem, TestimonialItem } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function HomePage() {
  const [rawSetting, rawServices, rawPortfolio, rawTestimonials, totalPortfolioCount] = await Promise.all([
    prisma.siteSetting.findUnique({
      where: { id: "global" },
      select: {
        id: true,
        ownerName: true,
        profilePhotoUrl: true,
        aboutBio: true,
        experienceYears: true,
        heroRoles: true,
        heroHeadline: true,
        heroSubheadline: true,
        whatsappNumber: true,
        isOpenOrder: true,
        updatedAt: true,
      },
    }),
    prisma.service.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    }),
    prisma.portfolio.findMany({
      where: { status: "PUBLISHED" },
      include: {
        relatedService: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      take: 3,
    }),
    prisma.testimonial.findMany({
      where: { isApproved: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.portfolio.count({
      where: { status: "PUBLISHED" },
    }),
  ]);

  const defaultSetting: SiteSettingItem = {
    id: "global",
    ownerName: "Azi Ramdani",
    profilePhotoUrl: null,
    aboutBio:
      "Dengan pengalaman mendalam dalam ekosistem digital, saya memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding (Apps Script & Web App), serta kekuatan seni copywriting yang berorientasi konversi.",
    experienceYears: 5,
    heroRoles: ["Full-Stack Vibe Coder", "UI/UX Specialist", "Persuasive Copywriter"],
    heroHeadline: "Crafting High-Impact Digital Experiences.",
    heroSubheadline:
      "Memadukan kepekaan estetika UI/UX kelas dunia, kecepatan eksekusi vibe coding (Apps Script & Web App), serta kekuatan seni copywriting yang berorientasi konversi.",
    whatsappNumber: "6281234567890",
    isOpenOrder: true,
    updatedAt: new Date().toISOString(),
  };

  const setting: SiteSettingItem = rawSetting
    ? {
        ...rawSetting,
        updatedAt: rawSetting.updatedAt.toISOString(),
      }
    : defaultSetting;

  const services: ServiceItem[] = rawServices.map((s) => ({
    ...s,
    createdAt: s.createdAt.toISOString(),
    updatedAt: s.updatedAt.toISOString(),
  }));

  const portfolio: PortfolioItem[] = rawPortfolio.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  const testimonials: TestimonialItem[] = rawTestimonials.map((t) => ({
    ...t,
    createdAt: t.createdAt.toISOString(),
  }));

  return (
    <PortfolioClientView
      setting={setting}
      services={services}
      initialPortfolio={portfolio}
      testimonials={testimonials}
      totalPortfolioCount={totalPortfolioCount}
    />
  );
}
