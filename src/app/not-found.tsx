import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto w-full max-w-[960px] px-4 py-20 text-center sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight">We don&apos;t track that company</h1>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        It may not be in our list yet, or the link has a typo. Search the companies we do track instead.
      </p>
      <Link href="/" className="mt-6 inline-block rounded-lg bg-ink px-5 py-2.5 text-sm font-semibold text-white hover:bg-ink-2">
        Back to all companies
      </Link>
    </main>
  );
}
