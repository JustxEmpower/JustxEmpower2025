import PortalNav from "@/components/portal-nav";

export default function CodexLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalNav />
      <div className="pt-14">{children}</div>
    </>
  );
}
