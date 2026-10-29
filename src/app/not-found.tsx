import Link from 'next/link';

export default function NotFound() {
  return (
    <main id="main" className="flex min-h-[70vh] items-center">
      <div className="shell max-w-lg text-center">
        <p className="eyebrow">404</p>
        <h1 className="mt-3 text-[clamp(2rem,5vw,3rem)] leading-tight">
          That page isn’t here.
        </h1>
        <p className="mt-4 text-[16px] text-ink-soft">
          The link may be out of date. Everything on the site is reachable from the homepage.
        </p>
        <Link href="/" className="btn-primary mt-7">Back to the homepage</Link>
      </div>
    </main>
  );
}
