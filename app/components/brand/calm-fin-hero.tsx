import { cx } from "../ui";

type CalmFinHeroVariant = "homepage" | "brand";

const OCEAN_FIN_HERO_SRC = "/images/brand/creditshark-ocean-fin-hero.svg";

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
      <img className="calm-fin-hero__image" src={OCEAN_FIN_HERO_SRC} alt="" aria-hidden="true" decoding="async" />
      {children ? <div className="calm-fin-hero__content">{children}</div> : null}
    </div>
  );
}
