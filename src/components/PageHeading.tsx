import type { ReactNode } from "react";

export function PageHeading({
  overline,
  title,
  as: Heading = "h1",
  id,
  center = false,
  children,
}: {
  overline: string;
  title: string;
  as?: "h1" | "h2";
  id?: string;
  center?: boolean;
  children?: ReactNode;
}) {
  return (
    <div className={center ? "text-center" : ""}>
      <p className="text-[13px] font-semibold tracking-widest text-azure-navy uppercase">{overline}</p>
      <Heading id={id} className="mt-2 text-4xl leading-tight font-light text-balance text-azure-navy">
        {title}
      </Heading>
      <div className={`mt-5 h-[3px] w-14 bg-azure-blue ${center ? "mx-auto" : ""}`} />
      {children && (
        <p className={`mt-5 max-w-3xl text-lg leading-relaxed text-pretty text-gray-700 ${center ? "mx-auto" : ""}`}>{children}</p>
      )}
    </div>
  );
}
