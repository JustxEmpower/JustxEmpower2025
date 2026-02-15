import { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

interface SEOSettings {
  siteTitle: string;
  siteDescription: string;
  siteKeywords: string;
  ogDefaultImage: string;
  twitterHandle: string;
  googleVerification: string;
  bingVerification: string;
}

interface SEOHeadProps {
  title?: string;
  description?: string;
  keywords?: string;
  ogImage?: string;
  ogTitle?: string;
  ogDescription?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}

export default function SEOHead({
  title,
  description,
  keywords,
  ogImage,
  ogTitle,
  ogDescription,
  noIndex = false,
  canonicalUrl,
}: SEOHeadProps) {
  const [location] = useLocation();
  const [seoSettings, setSeoSettings] = useState<SEOSettings>({
    siteTitle: "Just Empower® | Embodied Empowerment, Wellness & Conscious Leadership",
    siteDescription: "Just Empower® is a transformative platform for embodied empowerment, wellness guidance, conscious leadership, and sacred community.",
    siteKeywords: "Just Empower, embodied empowerment, wellness, conscious leadership, sacred feminine, transformation, community, courses, events",
    ogDefaultImage: "",
    twitterHandle: "",
    googleVerification: "",
    bingVerification: "",
  });

  // Fetch global SEO settings
  const siteSettingsQuery = trpc.admin?.siteSettings?.get?.useQuery?.() || { data: null };

  useEffect(() => {
    if (siteSettingsQuery.data) {
      const settings = siteSettingsQuery.data as any[];
      const getVal = (key: string, defaultVal: string = "") => 
        settings.find((s: any) => s.settingKey === key)?.settingValue || defaultVal;
      
      setSeoSettings({
        siteTitle: getVal("seo_siteTitle", seoSettings.siteTitle),
        siteDescription: getVal("seo_siteDescription", seoSettings.siteDescription),
        siteKeywords: getVal("seo_siteKeywords", seoSettings.siteKeywords),
        ogDefaultImage: getVal("seo_ogDefaultImage"),
        twitterHandle: getVal("seo_twitterHandle"),
        googleVerification: getVal("seo_googleVerification"),
        bingVerification: getVal("seo_bingVerification"),
      });
    }
  }, [siteSettingsQuery.data]);

  // Route-based SEO fallbacks so each page gets unique metadata
  const pageSEOMap: Record<string, { title: string; description: string; keywords?: string }> = {
    '/': {
      title: seoSettings.siteTitle,
      description: seoSettings.siteDescription,
    },
    '/contact': {
      title: 'Contact Us | Just Empower®',
      description: 'Get in touch with Just Empower®. Reach out for inquiries about wellness programs, conscious leadership, events, and community support in Austin, Texas.',
      keywords: 'contact Just Empower, wellness inquiries, Austin Texas, community support',
    },
    '/blog': {
      title: 'Blog: She Writes | Just Empower®',
      description: 'Stories, reflections, and sacred musings on embodied transformation, conscious leadership, and the rising of her. Read the latest from Just Empower®.',
      keywords: 'Just Empower blog, She Writes, embodied transformation, sacred musings, conscious leadership',
    },
    '/emerge-with-us': {
      title: 'Emerge With Us | Just Empower®',
      description: 'Join the Just Empower® community. Discover transformative programs, sacred gatherings, and empowerment experiences designed for your journey.',
      keywords: 'emerge with us, Just Empower community, transformative programs, empowerment',
    },
    '/rooted-unity': {
      title: 'Rooted Unity | Just Empower®',
      description: 'Rooted Unity by Just Empower® — a space for grounded connection, collective healing, and community-driven empowerment.',
      keywords: 'rooted unity, collective healing, community empowerment, Just Empower',
    },
    '/about': {
      title: 'About | Just Empower®',
      description: 'Learn about Just Empower® — our mission, vision, and commitment to embodied empowerment, wellness, and conscious leadership.',
      keywords: 'about Just Empower, mission, vision, empowerment, wellness',
    },
    '/shop': {
      title: 'Shop | Just Empower®',
      description: 'Browse the Just Empower® shop for curated wellness products, the MOM VI•X Journal Trilogy, and tools for your empowerment journey.',
      keywords: 'Just Empower shop, MOM VIX Journal, wellness products, empowerment tools',
    },
    '/events': {
      title: 'Events | Just Empower®',
      description: 'Explore upcoming events, workshops, and sacred gatherings hosted by Just Empower®. Connect, grow, and transform together.',
      keywords: 'Just Empower events, workshops, sacred gatherings, wellness events',
    },
  };

  const routeSEO = pageSEOMap[location] || null;

  // Determine final values (props > route-based > global settings)
  const finalTitle = title || routeSEO?.title || seoSettings.siteTitle;
  const finalDescription = description || routeSEO?.description || seoSettings.siteDescription;
  const finalKeywords = keywords || routeSEO?.keywords || seoSettings.siteKeywords;
  const finalOgImage = ogImage || seoSettings.ogDefaultImage;
  const finalOgTitle = ogTitle || finalTitle;
  const finalOgDescription = ogDescription || finalDescription;
  const baseUrl = "https://justxempower.com";
  const finalCanonicalUrl = canonicalUrl || `${baseUrl}${location}`;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDescription} />
      {finalKeywords && <meta name="keywords" content={finalKeywords} />}
      
      {/* Canonical URL */}
      <link rel="canonical" href={finalCanonicalUrl} />
      
      {/* Robots */}
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:url" content={finalCanonicalUrl} />
      <meta property="og:title" content={finalOgTitle} />
      <meta property="og:description" content={finalOgDescription} />
      <meta property="og:site_name" content="Just Empower®" />
      {finalOgImage && <meta property="og:image" content={finalOgImage} />}
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      {seoSettings.twitterHandle && <meta name="twitter:site" content={seoSettings.twitterHandle} />}
      <meta name="twitter:title" content={finalOgTitle} />
      <meta name="twitter:description" content={finalOgDescription} />
      {finalOgImage && <meta name="twitter:image" content={finalOgImage} />}
      
      {/* Search Engine Verification */}
      {seoSettings.googleVerification && (
        <meta name="google-site-verification" content={seoSettings.googleVerification} />
      )}
      {seoSettings.bingVerification && (
        <meta name="msvalidate.01" content={seoSettings.bingVerification} />
      )}
    </Helmet>
  );
}
