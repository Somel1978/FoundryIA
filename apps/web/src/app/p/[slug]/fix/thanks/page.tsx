import Link from "next/link";

export default async function FixThanksPage({ params }: PageProps<"/p/[slug]/fix/thanks">) {
  const { slug } = await params;
  return (
    <div className="card mx-auto max-w-lg p-8 text-center">
      <h2 className="text-lg font-semibold">Thanks for your fix!</h2>
      <p className="mt-2 text-sm text-zinc-500">It&apos;s been sent to the maintainer for review.</p>
      <Link href={`/p/${slug}`} className="btn mt-6">
        Back to the code
      </Link>
    </div>
  );
}
