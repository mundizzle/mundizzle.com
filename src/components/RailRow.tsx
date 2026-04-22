import type { ReactNode } from "react";

interface RailBaseProps {
  label?: ReactNode;
  children: ReactNode;
  aside?: ReactNode;
  className?: string;
  labelClassName?: string;
  contentClassName?: string;
  asideClassName?: string;
}

interface RailInsetRowProps extends RailBaseProps {
  insetClassName?: string;
}

function joinClasses(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

function RailFrame({
  children,
  aside,
  asideClassName,
  className,
}: Pick<RailBaseProps, "aside" | "asideClassName" | "className"> & { children: ReactNode }) {
  return (
    <div
      className={joinClasses(
        "grid gap-[10px] md:gap-[var(--rail-gap)]",
        aside
          ? "md:[grid-template-columns:var(--rail-width)_1fr_auto]"
          : "md:[grid-template-columns:var(--rail-width)_1fr]",
        className,
      )}
    >
      {children}
      {aside ? <div className={asideClassName}>{aside}</div> : null}
    </div>
  );
}

const gutterLabelClassName = "text-[11px] leading-[1.35] uppercase tracking-[0.2em] text-ink-faint";

export function RailBaselineRow({
  label,
  children,
  aside,
  className,
  labelClassName,
  contentClassName,
  asideClassName,
}: RailBaseProps) {
  return (
    <RailFrame
      aside={aside}
      asideClassName={asideClassName}
      className={joinClasses("md:items-baseline", className)}
    >
      <div className={joinClasses(gutterLabelClassName, "md:self-baseline", labelClassName)}>
        {label}
      </div>
      <div className={contentClassName}>{children}</div>
    </RailFrame>
  );
}

export function RailDividerRow({
  label,
  children,
  aside,
  className,
  labelClassName,
  contentClassName,
  asideClassName,
}: RailBaseProps) {
  return (
    <RailFrame
      aside={aside}
      asideClassName={asideClassName}
      className={joinClasses("relative md:items-baseline", className)}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-[calc(var(--rail-width)+var(--rail-gap))] right-0 border-t border-rule [border-top-style:dashed]"
      ></div>
      <div className={joinClasses(gutterLabelClassName, "pt-[10px] md:pt-[18px]", labelClassName)}>
        {label}
      </div>
      <div className={joinClasses("pt-[10px] md:pt-[18px]", contentClassName)}>{children}</div>
    </RailFrame>
  );
}

export function RailInsetRow({
  label,
  children,
  aside,
  className,
  labelClassName,
  contentClassName,
  asideClassName,
  insetClassName = "pt-[10px]",
}: RailInsetRowProps) {
  return (
    <RailFrame
      aside={aside}
      asideClassName={asideClassName}
      className={joinClasses("relative md:items-baseline", className)}
    >
      <div
        aria-hidden="true"
        className="absolute top-0 left-[calc(var(--rail-width)+var(--rail-gap))] right-0 border-t border-rule [border-top-style:dashed]"
      ></div>
      <div className={joinClasses(gutterLabelClassName, insetClassName, labelClassName)}>
        {label}
      </div>
      <div className={contentClassName}>{children}</div>
    </RailFrame>
  );
}
