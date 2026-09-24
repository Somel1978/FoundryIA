import Link from "next/link";

export default function NotFound() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-semibold">Not found</h1>
      <p className="mt-2 text-zinc-500">This page doesn&apos;t exist or isn&apos;t public.</p>
      <Link href="/" className="btn mt-6">
        Back to projects
      </Link>
    </div>
  );
}
