import Image from "next/image";
import Link from "next/link";

export function Marca({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2">
      <Image src="/bia.png" alt="" width={36} height={36} className="rounded-full" />
      <span className="leading-tight">
        <span className="block font-bold">Bia</span>
        <span className="etiqueta block text-[10px] text-bia">Secretária IA</span>
      </span>
    </Link>
  );
}
