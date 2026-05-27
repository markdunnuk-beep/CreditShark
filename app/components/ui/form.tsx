import { cx } from "./utils";

type FieldProps = {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
};

const controlClasses = "min-h-[46px] w-full rounded-[12px] border border-creditshark-border bg-white px-3 py-2.5 text-sm text-creditshark-ink shadow-sm outline-none transition placeholder:text-creditshark-muted/70 focus:border-creditshark-teal focus:outline focus:outline-3 focus:outline-creditshark-aqua/25";

export function Field({ label, helper, error, children, className }: FieldProps) {
  return (
    <label className={cx("grid gap-2", className)}>
      <span className="text-xs font-extrabold uppercase tracking-[0.04em] text-creditshark-muted">{label}</span>
      {children}
      {helper ? <span className="text-xs leading-5 text-creditshark-muted">{helper}</span> : null}
      {error ? <span className="text-xs font-bold text-[#9d2f2f]">{error}</span> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={cx(controlClasses, props.className)} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={cx(controlClasses, "min-h-28 resize-y", props.className)} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={cx(controlClasses, props.className)} />;
}

export function FormSection({
  title,
  description,
  span = false,
  children
}: {
  title: string;
  description?: string;
  span?: boolean;
  children: React.ReactNode;
}) {
  return (
    <fieldset className={cx("grid gap-4 rounded-[16px] border border-creditshark-border bg-creditshark-mist/35 p-4", span && "md:col-span-2")}>
      <legend className="px-2 text-sm font-extrabold text-creditshark-navy">{title}</legend>
      {description ? <p className="m-0 text-sm leading-6 text-creditshark-muted">{description}</p> : null}
      {children}
    </fieldset>
  );
}

export function FormActions({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cx("flex flex-wrap items-center gap-2 md:col-span-2", className)}>{children}</div>;
}
