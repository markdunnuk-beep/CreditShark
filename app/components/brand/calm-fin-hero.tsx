import { cx } from "../ui";

type CalmFinHeroVariant = "homepage" | "brand";

export function CalmFinHero({
  variant = "homepage",
  className,
  children
}: {
  variant?: CalmFinHeroVariant;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cx("calm-fin-hero", `calm-fin-hero--${variant}`, className)} aria-hidden={children ? undefined : true}>
      <div className="calm-fin-hero__water" aria-hidden="true">
        <svg className="calm-fin-hero__svg" viewBox="0 0 640 520" role="presentation" focusable="false">
          <defs>
            <linearGradient id={`calm-fin-sky-${variant}`} x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor="#FAFBFC" stopOpacity="0.96" />
              <stop offset="48%" stopColor="#EAF7F8" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#6DD1D6" stopOpacity="0.42" />
            </linearGradient>
            <linearGradient id={`calm-fin-water-${variant}`} x1="0" x2="1" y1="0" y2="0">
              <stop offset="0%" stopColor="#0D2B45" stopOpacity="0.04" />
              <stop offset="54%" stopColor="#1CA3A6" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#0D2B45" stopOpacity="0.42" />
            </linearGradient>
          </defs>
          <rect width="640" height="520" rx="34" fill={`url(#calm-fin-sky-${variant})`} />
          <path
            d="M18 342C96 314 170 314 245 342C326 374 410 374 492 342C544 322 586 316 622 323"
            fill="none"
            stroke="#6DD1D6"
            strokeLinecap="round"
            strokeWidth="14"
          />
          <path
            d="M0 356C74 330 149 330 224 356C307 388 390 388 473 356C536 332 590 328 640 342V520H0V356Z"
            fill={`url(#calm-fin-water-${variant})`}
          />
          <path
            d="M322 326C336 242 378 171 455 122C450 222 414 291 346 338C336 345 324 340 322 326Z"
            fill="#1CA3A6"
          />
          <path
            d="M62 396C128 378 194 378 260 396C328 415 398 415 466 396C512 384 552 381 590 386"
            fill="none"
            stroke="#0D2B45"
            strokeLinecap="round"
            strokeOpacity="0.2"
            strokeWidth="5"
          />
          <path
            d="M88 430C148 419 207 419 266 430C326 441 388 441 449 430"
            fill="none"
            stroke="#FAFBFC"
            strokeLinecap="round"
            strokeOpacity="0.72"
            strokeWidth="4"
          />
        </svg>
      </div>
      {children ? <div className="calm-fin-hero__content">{children}</div> : null}
    </div>
  );
}
