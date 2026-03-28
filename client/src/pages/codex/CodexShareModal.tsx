import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, Copy, Check, Download, ExternalLink } from "lucide-react";

// ── Social Platform Definitions ──
// getUrl receives (snippet, hashtags, shareUrl) — shareUrl is the deep link back to the Codex
const PLATFORMS = [
  {
    id: "x",
    label: "X (Twitter)",
    color: "#000000",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    getUrl: (text: string, hashtags: string[], shareUrl: string) =>
      `https://x.com/intent/tweet?text=${encodeURIComponent(text + "\n\n" + hashtags.join(" "))}&url=${encodeURIComponent(shareUrl)}`,
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#1877F2",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    getUrl: (_text: string, _hashtags: string[], shareUrl: string) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
  },
  {
    id: "instagram",
    label: "Instagram",
    color: "#E1306C",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
        <path d="m16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
      </svg>
    ),
    getUrl: null as any, // Instagram: download image + copy caption
  },
  {
    id: "threads",
    label: "Threads",
    color: "#000000",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.96-.065-1.187.408-2.26 1.33-3.017.88-.724 2.104-1.14 3.546-1.205 1.068-.048 2.054.06 2.944.32-.1-.632-.366-1.15-.798-1.53-.554-.49-1.374-.743-2.432-.753h-.064c-.84 0-1.921.257-2.692 1.084l-1.442-1.378c1.16-1.243 2.655-1.835 4.134-1.835h.076c1.51.015 2.727.473 3.613 1.362.81.812 1.317 1.903 1.503 3.236.636.247 1.22.56 1.74.94 1.237.899 2.075 2.196 2.427 3.758.493 2.188.098 4.735-2.165 6.952-1.895 1.857-4.175 2.656-7.396 2.678zm.084-7.543c1.074-.054 1.873-.454 2.376-1.191.39-.572.629-1.313.72-2.228-.856-.27-1.8-.404-2.812-.358-1.074.048-1.916.328-2.437.81-.433.399-.658.91-.632 1.44.037.686.403 1.2 1.06 1.488.524.23 1.115.317 1.725.04z" />
      </svg>
    ),
    getUrl: null as any, // Threads: copy text to clipboard
  },
];

interface CodexShareModalProps {
  entryId: string;
  entryTitle: string;
  onClose: () => void;
}

export default function CodexShareModal({ entryId, entryTitle, onClose }: CodexShareModalProps) {
  const [snippet, setSnippet] = useState<string>("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const [shareUrl, setShareUrl] = useState<string>("");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [copied, setCopied] = useState<string | null>(null); // tracks what was copied
  const [generating, setGenerating] = useState(true);

  const generateMutation = trpc.codex.client.generateShareSnippet.useMutation();

  // Generate + persist the AI snippet on mount
  useEffect(() => {
    generateMutation.mutate({ entryId }, {
      onSuccess: (data) => {
        setSnippet(data.snippet);
        setHashtags(data.hashtags);
        const origin = window.location.origin;
        setShareUrl(`${origin}${data.shareUrl}`);
        setImageUrl(`${origin}${data.imageUrl}`);
        setGenerating(false);
      },
      onError: () => {
        setSnippet(`"${entryTitle}" — a reflection from my Living Codex journey.`);
        setHashtags(["#LivingCodex", "#InnerWork", "#SelfDiscovery"]);
        setGenerating(false);
      },
    });
  }, [entryId]);

  const fullCaption = `${snippet}\n\n${hashtags.join(" ")}\n\n${shareUrl}\n\n— The Living Codex by Just Empower`;

  const handleCopy = (what: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(what);
    setTimeout(() => setCopied(null), 2500);
  };

  const handleDownloadImage = async () => {
    if (!imageUrl) return;
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "codex-reflection.png";
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handlePlatformClick = (platform: typeof PLATFORMS[0]) => {
    if (platform.getUrl) {
      window.open(platform.getUrl(snippet, hashtags, shareUrl), "_blank", "noopener,noreferrer,width=600,height=500");
    } else if (platform.id === "instagram") {
      // Instagram: download the image + copy caption
      handleDownloadImage();
      handleCopy("instagram", fullCaption);
    } else {
      // Threads: copy text to clipboard
      handleCopy("text", fullCaption);
    }
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(34,30,26,0.4)", backdropFilter: "blur(8px)",
        WebkitBackdropFilter: "blur(8px)",
        animation: "cx-fade-in 200ms ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: "30rem", maxHeight: "90vh", overflowY: "auto",
          borderRadius: "1rem",
          background: "rgba(237,229,216,0.97)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 20px 60px rgba(0,0,0,0.12)",
        }}
      >
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "1.25rem 1.5rem 0.75rem",
        }}>
          <div>
            <p style={{
              fontSize: "9px", letterSpacing: "0.15em", textTransform: "uppercase",
              color: "var(--cx-ink3)", marginBottom: "4px",
            }}>
              SHARE YOUR REFLECTION
            </p>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif", fontSize: "1.25rem",
              fontWeight: 300, color: "var(--cx-ink)", margin: 0,
            }}>
              Inspire Others
            </h3>
          </div>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", cursor: "pointer", color: "var(--cx-ink3)", padding: "4px" }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Image Preview */}
        <div style={{ padding: "0 1.5rem 0.5rem" }}>
          <div style={{
            borderRadius: "0.75rem", overflow: "hidden",
            background: "rgba(255,255,255,0.3)",
            border: "1px solid rgba(255,255,255,0.5)",
            aspectRatio: "1200/630",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            {generating ? (
              <div style={{
                textAlign: "center", padding: "2rem",
                fontFamily: "'Cormorant Garamond', serif",
                fontStyle: "italic", fontSize: "0.85rem",
                color: "var(--cx-ink3)",
              }}>
                <div className="cx-slow-pulse">Crafting your shareable moment...</div>
              </div>
            ) : imageUrl ? (
              <img
                src={imageUrl}
                alt="Share preview"
                style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "0.75rem" }}
              />
            ) : (
              <div style={{ padding: "2rem", textAlign: "center" }}>
                <p style={{
                  fontFamily: "'Cormorant Garamond', serif",
                  fontSize: "1rem", fontStyle: "italic", color: "var(--cx-ink)",
                  lineHeight: 1.7,
                }}>
                  "{snippet}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Snippet Text + Hashtags */}
        {!generating && (
          <div style={{ padding: "0.5rem 1.5rem" }}>
            <p style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontSize: "0.9rem", fontWeight: 300, fontStyle: "italic",
              color: "var(--cx-ink)", lineHeight: 1.6,
              margin: "0 0 0.35rem",
            }}>
              "{snippet}"
            </p>
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {hashtags.map((tag, i) => (
                <span key={i} style={{ fontSize: "0.6rem", color: "var(--cx-rose)", fontWeight: 500 }}>
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Platform Buttons */}
        <div style={{ padding: "0.75rem 1.5rem 0.5rem" }}>
          <p style={{
            fontSize: "9px", letterSpacing: "0.12em", textTransform: "uppercase",
            color: "var(--cx-ink3)", marginBottom: "0.6rem",
          }}>
            SHARE TO
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
            {PLATFORMS.map((platform) => (
              <button
                key={platform.id}
                onClick={() => handlePlatformClick(platform)}
                disabled={generating}
                style={{
                  display: "flex", alignItems: "center", gap: "0.5rem",
                  padding: "0.6rem 0.85rem",
                  borderRadius: "0.6rem",
                  background: "rgba(255,255,255,0.45)",
                  border: "1px solid rgba(255,255,255,0.6)",
                  cursor: generating ? "not-allowed" : "pointer",
                  color: platform.color,
                  fontSize: "0.75rem", fontWeight: 500,
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                  transition: "all 200ms ease",
                  opacity: generating ? 0.4 : 1,
                }}
                onMouseEnter={e => {
                  if (!generating) {
                    e.currentTarget.style.background = `${platform.color}0D`;
                    e.currentTarget.style.borderColor = `${platform.color}30`;
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.45)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.6)";
                }}
              >
                {platform.icon}
                <span>{platform.label}</span>
                {platform.id === "instagram" && (
                  <span style={{ fontSize: "0.5rem", opacity: 0.5, marginLeft: "auto" }}>img+copy</span>
                )}
                {platform.id === "threads" && (
                  <span style={{ fontSize: "0.5rem", opacity: 0.5, marginLeft: "auto" }}>copy</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Action Row: Download Image + Copy Text */}
        <div style={{ padding: "0.5rem 1.5rem 0.75rem", display: "flex", gap: "0.5rem" }}>
          <button
            onClick={handleDownloadImage}
            disabled={generating || !imageUrl}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              padding: "0.6rem",
              borderRadius: "0.6rem",
              background: "rgba(184,151,106,0.06)",
              border: "1px solid rgba(184,151,106,0.12)",
              cursor: generating ? "not-allowed" : "pointer",
              color: "var(--cx-gold)",
              fontSize: "0.7rem", fontWeight: 500,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "all 200ms ease",
              opacity: generating ? 0.4 : 1,
            }}
          >
            <Download size={13} />
            Save Image
          </button>
          <button
            onClick={() => handleCopy("text", fullCaption)}
            disabled={generating}
            style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "0.4rem",
              padding: "0.6rem",
              borderRadius: "0.6rem",
              background: copied === "text" ? "rgba(125,142,127,0.1)" : "rgba(184,123,101,0.06)",
              border: `1px solid ${copied === "text" ? "rgba(125,142,127,0.2)" : "rgba(184,123,101,0.12)"}`,
              cursor: generating ? "not-allowed" : "pointer",
              color: copied === "text" ? "var(--cx-sage)" : "var(--cx-rose)",
              fontSize: "0.7rem", fontWeight: 500,
              fontFamily: "'DM Sans', system-ui, sans-serif",
              transition: "all 200ms ease",
              opacity: generating ? 0.4 : 1,
            }}
          >
            {copied === "text" ? <Check size={13} /> : <Copy size={13} />}
            {copied === "text" ? "Copied" : "Copy Caption"}
          </button>
        </div>

        {/* Share Link */}
        {!generating && shareUrl && (
          <div style={{ padding: "0 1.5rem 1.25rem" }}>
            <div style={{
              display: "flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 0.75rem",
              borderRadius: "0.5rem",
              background: "rgba(255,255,255,0.35)",
              border: "1px solid rgba(255,255,255,0.5)",
            }}>
              <ExternalLink size={12} style={{ color: "var(--cx-ink3)", flexShrink: 0 }} />
              <span style={{
                flex: 1, fontSize: "0.65rem", color: "var(--cx-ink2)",
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                fontFamily: "'JetBrains Mono', monospace",
              }}>
                {shareUrl}
              </span>
              <button
                onClick={() => handleCopy("link", shareUrl)}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  color: copied === "link" ? "var(--cx-sage)" : "var(--cx-ink3)",
                  fontSize: "0.6rem", fontWeight: 500, padding: "2px 6px",
                  fontFamily: "'DM Sans', system-ui, sans-serif",
                }}
              >
                {copied === "link" ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
