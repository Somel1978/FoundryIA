import Link from "next/link";
import { LogoMark } from "@/components/logo";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center py-24 text-center">
      <LogoMark className="mb-6 size-14 opacity-80" />
      <p className="font-display text-6xl font-bold text-gradient">404</p>
      <h1 className="mt-3 text-2xl font-semibold">This page rolled a natural 1</h1>
      <p className="mt-2 text-muted">It doesn&apos;t exist, or it isn&apos;t public.</p>
      <Link href="/" className="btn btn-primary mt-8">
        Back to projects
      </Link>
    </div>
  );
}
