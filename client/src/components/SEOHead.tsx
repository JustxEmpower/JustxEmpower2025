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
    siteTitle: "Just Empower | Where Empowerment Becomes Embodiment",
    siteDescription: "Discover empowerment resources, wellness guidance, and community support at Just Empower.",
    siteKeywords: "empowerment, wellness, community, self-care, mindfulness",
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

  // Determine final values (props override global settings)
  const finalTitle = title || seoSettings.siteTitle;
  const finalDescription = description || seoSettings.siteDescription;
  const finalKeywords = keywords || seoSettings.siteKeywords;
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
      <meta property="og:site_name" content="Just Empower" />
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
