import ClientLayout from "@/components/ClientLayout";

export default function Home() {
  return (
    <main
      className="relative min-h-[100svh] w-full overflow-hidden antialiased"
      style={{
        background: "var(--color-background)",
        color: "var(--color-foreground)",
      }}
    >
      <ClientLayout />
    </main>
  );
}
