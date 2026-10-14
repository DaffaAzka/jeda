import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { ArrowRightIcon } from "@/components/icons";
import { siteCopy } from "@/lib/copy/id";

function PixelStudyScene() {
  return (
    <figure
      aria-label={siteCopy.landing.illustrationLabel}
      className="relative mx-auto w-full max-w-lg border-2 border-border bg-card p-3 shadow-[8px_8px_0_var(--border)] sm:p-5"
      role="img"
    >
      <svg
        aria-hidden="true"
        className="block h-auto w-full"
        shapeRendering="crispEdges"
        viewBox="0 0 400 320"
      >
        <rect width="400" height="320" className="fill-muted" />
        <rect x="32" y="24" width="192" height="144" className="fill-foreground" />
        <rect
          x="44"
          y="36"
          width="168"
          height="120"
          className="scene-sky"
        />
        <g className="scene-sun">
          <rect x="152" y="60" width="32" height="32" className="fill-moodi-butter" />
          <rect x="160" y="52" width="16" height="8" className="fill-moodi-butter" />
          <rect x="160" y="92" width="16" height="8" className="fill-moodi-butter" />
          <rect x="144" y="68" width="8" height="16" className="fill-moodi-butter" />
        </g>
        <g className="scene-moon">
          <rect x="156" y="56" width="32" height="32" className="fill-moodi-butter" />
          <rect x="172" y="48" width="16" height="8" className="fill-moodi-butter" />
          <rect x="172" y="88" width="16" height="8" className="fill-moodi-butter" />
          <rect x="180" y="56" width="16" height="24" className="scene-moon-cutout" />
        </g>
        <g className="scene-stars fill-foreground">
          <rect x="72" y="56" width="8" height="8" />
          <rect x="112" y="96" width="8" height="8" />
          <rect x="72" y="124" width="8" height="8" />
          <rect x="132" y="44" width="8" height="8" />
        </g>
        <rect x="44" y="128" width="168" height="28" className="scene-hill" />
        <rect x="28" y="176" width="216" height="12" className="fill-foreground" />
        <rect x="44" y="188" width="16" height="92" className="fill-foreground" />
        <rect x="212" y="188" width="16" height="92" className="fill-foreground" />
        <rect x="84" y="188" width="104" height="8" className="fill-foreground" />
        <rect x="108" y="112" width="104" height="56" className="fill-moodi-peach" />
        <rect x="124" y="128" width="72" height="32" className="fill-card" />
        <rect x="132" y="136" width="56" height="8" className="fill-moodi-sky" />
        <rect x="156" y="152" width="8" height="8" className="fill-foreground" />
        <rect x="276" y="124" width="72" height="12" className="fill-foreground" />
        <rect x="284" y="136" width="56" height="48" className="fill-moodi-pink" />
        <rect x="292" y="144" width="40" height="32" className="fill-moodi-butter" />
        <rect x="300" y="104" width="24" height="20" className="fill-moodi-sky" />
        <rect x="272" y="188" width="80" height="12" className="fill-foreground" />
        <rect x="280" y="200" width="16" height="64" className="fill-foreground" />
        <rect x="328" y="200" width="16" height="64" className="fill-foreground" />
        <rect x="52" y="248" width="56" height="16" className="fill-moodi-butter" />
        <rect x="60" y="232" width="40" height="16" className="fill-moodi-butter" />
        <rect x="68" y="216" width="24" height="16" className="fill-moodi-butter" />
        <rect x="68" y="200" width="8" height="16" className="fill-moodi-butter" />
        <rect x="216" y="224" width="40" height="40" className="fill-moodi-sky" />
        <rect x="224" y="216" width="24" height="8" className="fill-moodi-sky" />
      </svg>
      <figcaption className="mt-3 flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <span>{siteCopy.landing.illustrationLabel}</span>
        <span aria-hidden="true" className="grid grid-cols-2 gap-1">
          <i className="size-2 bg-moodi-sky" />
          <i className="size-2 bg-moodi-butter" />
          <i className="size-2 bg-moodi-pink" />
          <i className="size-2 bg-moodi-peach" />
        </span>
      </figcaption>
    </figure>
  );
}

function FeatureGlyph({ icon }: { icon: "sun" | "grid" | "breath" }) {
  if (icon === "sun") {
    return (
      <svg aria-hidden="true" className="size-10" viewBox="0 0 40 40">
        <path
          d="M16 4h8v6h-8zm0 26h8v6h-8zM4 16h6v8H4zm26 0h6v8h-6zM12 12h6v6h-6zm10 10h6v6h-6zm0-10h6v6h-6zm-10 10h6v6h-6z"
          className="fill-foreground"
        />
        <path d="M16 16h8v8h-8z" className="fill-moodi-butter" />
      </svg>
    );
  }

  if (icon === "grid") {
    return (
      <svg aria-hidden="true" className="size-10" viewBox="0 0 40 40">
        <path
          d="M5 5h12v12H5zm18 0h12v12H23zM5 23h12v12H5zm18 0h12v12H23z"
          className="fill-foreground"
        />
        <path d="M9 9h4v4H9zm18 0h4v4h-4zM9 27h4v4H9zm18 0h4v4h-4z" className="fill-moodi-sky" />
      </svg>
    );
  }

  return (
    <svg aria-hidden="true" className="size-10" viewBox="0 0 40 40">
      <path
        d="M4 19h8v-6h6V7h6v6h-6v6h-6v6H4zm32 2h-8v6h-6v6h-6v-6h6v-6h6v-6h8z"
        className="fill-foreground"
      />
      <path d="M18 16h6v8h-6z" className="fill-moodi-peach" />
    </svg>
  );
}

export default function Home() {
  const copy = siteCopy.landing;

  return (
    <>
      <header className="sticky top-0 z-20 border-b-2 border-border bg-background/95 backdrop-blur">
        <nav
          aria-label={siteCopy.brand}
          className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6"
        >
          <Link
            className="shrink-0 font-pixelify text-2xl font-bold tracking-wide"
            href="/"
          >
            {siteCopy.brand}
          </Link>
          <div className="hidden items-center gap-6 text-sm font-semibold md:flex">
            <a className="hover:text-link" href="#alur">
              Alur Belajar
            </a>
            <a className="hover:text-link" href="#fitur">
              Fitur
            </a>
            <a className="hover:text-link" href="#bantuan">
              Bantuan
            </a>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              className="min-h-10 border-2 border-border bg-card px-4 py-2 text-sm font-semibold shadow-[2px_2px_0_var(--border)] hover:bg-muted"
              href="/login"
            >
              {siteCopy.navigation.signIn}
            </Link>
          </div>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="mx-auto grid w-full max-w-7xl items-center gap-10 px-4 py-12 sm:px-6 sm:py-16 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14 lg:py-20">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 border-2 border-border bg-moodi-butter px-3 py-1.5 text-xs font-semibold text-ink shadow-[2px_2px_0_var(--border)]">
              <span aria-hidden="true" className="size-2 bg-foreground" />
              <span>{copy.eyebrow}</span>
            </div>
            <h1 className="font-pixelify text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              {copy.headlineFirst}{" "}
              <span className="block text-link">{copy.headlineSecond}</span>
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8">
              {copy.intro}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="pixel-press inline-flex min-h-12 items-center justify-center gap-2 border-2 border-border bg-moodi-sky px-6 font-semibold text-ink shadow-[4px_4px_0_var(--border)]"
                href="/register"
              >
                <span>{copy.primaryAction}</span>
                <ArrowRightIcon className="size-4" />
              </Link>
              <a
                className="inline-flex min-h-12 items-center justify-center border-2 border-border bg-card px-6 font-semibold hover:bg-muted"
                href="#alur"
              >
                {copy.secondaryAction}
              </a>
            </div>
          </div>
          <PixelStudyScene />
        </section>

        {/* Steps / Flow Section (replaces generic about and redundant band) */}
        <section
          className="border-t-2 border-border bg-card py-14 sm:py-20"
          id="alur"
        >
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <div className="max-w-2xl">
              <h2 className="font-pixelify text-3xl leading-tight sm:text-4xl">
                {copy.stepsTitle}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                {copy.stepsIntro}
              </p>
            </div>

            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {copy.steps.map((step, index) => (
                <div
                  className="flex flex-col border-2 border-border bg-background p-5 shadow-[4px_4px_0_var(--border)]"
                  key={step.title}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-pixelify text-2xl font-bold text-link">
                      0{index + 1}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`size-3 ${
                        index === 0
                          ? "bg-moodi-sky"
                          : index === 1
                            ? "bg-moodi-butter"
                            : "bg-moodi-pink"
                      }`}
                    />
                  </div>
                  <h3 className="mt-4 font-pixelify text-xl font-bold">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-t-2 border-border bg-muted py-14 sm:py-20" id="fitur">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
            <h2 className="font-pixelify text-3xl sm:text-4xl">
              {copy.featuresTitle}
            </h2>
            <div className="mt-8 grid gap-5 md:grid-cols-3">
              {copy.features.map((feature, index) => (
                <article
                  className={`border-2 border-border p-6 text-ink shadow-[4px_4px_0_var(--border)] ${
                    index === 0
                      ? "bg-moodi-sky"
                      : index === 1
                        ? "bg-moodi-butter"
                        : "bg-moodi-peach"
                  }`}
                  key={feature.title}
                >
                  <FeatureGlyph icon={feature.icon} />
                  <h3 className="mt-5 font-pixelify text-xl font-bold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* Safety & Support Banner */}
        <section
          className="border-t-2 border-border bg-card py-14 sm:py-20"
          id="bantuan"
        >
          <div className="mx-auto flex w-full max-w-7xl flex-col justify-between gap-8 px-4 sm:px-6 md:flex-row md:items-center">
            <div className="max-w-2xl">
              <h2 className="font-pixelify text-3xl leading-tight sm:text-4xl">
                {copy.closingTitle}
              </h2>
              <p className="mt-3 text-base text-muted-foreground">
                {copy.closingDescription}
              </p>
            </div>
            <Link
              className="pixel-press inline-flex min-h-12 shrink-0 items-center justify-center border-2 border-border bg-moodi-pink px-6 font-semibold text-ink shadow-[4px_4px_0_var(--border)]"
              href="/register"
            >
              {copy.primaryAction}
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-border bg-background" id="privasi">
        <div className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1fr_auto] md:items-start">
          <div>
            <Link className="font-pixelify text-2xl font-bold" href="/">
              {siteCopy.brand}
            </Link>
            <p className="mt-2 text-sm text-muted-foreground">
              {copy.footerTagline}
            </p>
            <p className="mt-4 max-w-2xl text-xs leading-5 text-muted-foreground">
              {copy.sdg}
            </p>
            <p className="mt-2 max-w-2xl text-xs font-semibold leading-5 text-muted-foreground">
              {copy.disclaimer}
            </p>
          </div>
          <nav
            aria-label={copy.privacy}
            className="flex gap-5 text-sm font-semibold"
          >
            <a className="hover:underline underline-offset-4" href="#alur">
              Alur
            </a>
            <a className="hover:underline underline-offset-4" href="#fitur">
              Fitur
            </a>
            <a className="hover:underline underline-offset-4" href="#bantuan">
              Bantuan
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
