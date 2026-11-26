import { Marca } from "@/components/Marca";

export default function LayoutAuth({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-12">
      <div className="mb-6">
        <Marca />
      </div>
      <div className="cartao w-full max-w-md">{children}</div>
    </main>
  );
}
