import { prisma } from "@/lib/prisma";
import PortfolioArchiveView from "@/components/public/PortfolioArchiveView";
import type { SiteSettingItem, PortfolioItem } from "@/types";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PortfolioPage() {
  const [rawSetting, rawPortfolio] = await Promise.all([
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
    prisma.portfolio.findMany({
      where: { status: "PUBLISHED" },
      include: {
        relatedService: {
          select: { id: true, title: true, slug: true },
        },
      },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
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

  const portfolio: PortfolioItem[] = rawPortfolio.map((p) => ({
    ...p,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  }));

  return <PortfolioArchiveView initialPortfolio={portfolio} setting={setting} />;
}

