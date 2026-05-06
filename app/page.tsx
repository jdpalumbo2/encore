import Link from "next/link";

const specimens = [
  {
    header: "A second date with someone who reads.",
    line: "Maison Carlos, the corner table. Then a walk on Worth.",
  },
  {
    header: "An anniversary that needs to land.",
    line: "Sunset on the Motunui, then Milos by the window.",
  },
  {
    header: "A Thursday that wants a little volume.",
    line: "Pink Steak at eight, Sourbon upstairs after.",
  },
];

export default function Home() {
  return (
    <section className="mx-auto w-full max-w-[720px] px-6 pt-24 pb-20 sm:pt-32">
      <p className="font-sans text-xs tracking-[0.22em] text-brass uppercase">
        West Palm Beach. By invitation.
      </p>
      <h1 className="font-display font-medium text-4xl sm:text-5xl md:text-6xl text-primary mt-5 leading-[1.05]">
        Plan a night that says you&rsquo;ve been paying attention.
      </h1>
      <p className="font-sans text-lg text-text-muted mt-6 leading-relaxed max-w-[560px]">
        You bring the date. Encore handles the rest of the evening.
      </p>
      <div className="mt-10">
        <Link
          href="/plan"
          className="inline-flex items-center justify-center bg-brass text-primary px-8 py-4 font-sans font-semibold tracking-[0.02em] hover:bg-brass-hover transition-colors rounded-sm"
        >
          Plan the night
        </Link>
      </div>

      <div className="mt-24 grid grid-cols-1 sm:grid-cols-3 gap-px bg-hairline border border-hairline">
        {specimens.map((s) => (
          <article
            key={s.header}
            className="bg-background p-6 sm:p-7 flex flex-col gap-3"
          >
            <p className="font-display italic text-text text-base leading-snug">
              {s.header}
            </p>
            <p className="font-sans text-sm text-text-muted leading-relaxed">
              {s.line}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}
