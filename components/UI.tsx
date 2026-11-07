import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'accent';
type Size = 'sm' | 'md' | 'lg';

const baseBtn =
  'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none active:scale-[0.98]';

const variantCls: Record<Variant, string> = {
  primary:
    'bg-stone-900 hover:bg-stone-800 text-stone-50 dark:bg-stone-100 dark:hover:bg-white dark:text-stone-950 shadow-sm border border-black/5 dark:border-white/20 font-semibold',
  secondary:
    'bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 border border-stone-200/90 dark:border-stone-800/90 hover:bg-stone-100/70 hover:text-stone-900 dark:hover:bg-stone-800 dark:hover:text-stone-100 shadow-xs',
  ghost:
    'bg-transparent text-stone-600 dark:text-stone-400 hover:bg-stone-100/70 dark:hover:bg-stone-800/70 hover:text-stone-900 dark:hover:text-stone-100',
  accent:
    'bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-800/60 hover:bg-amber-100/80 dark:hover:bg-amber-800/40',
};

const sizeCls: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2.5',
  lg: 'text-base px-6 py-3.5',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  iconTrailing?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  children,
  iconTrailing,
  ...props
}) => (
  <button className={`${baseBtn} ${variantCls[variant]} ${sizeCls[size]} ${className}`} {...props}>
    <span>{children}</span>
    {iconTrailing && (
      <span className="w-6 h-6 rounded-lg bg-black/10 dark:bg-white/15 flex items-center justify-center -mr-1">
        {iconTrailing}
      </span>
    )}
  </button>
);

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  label,
  className = '',
  children,
  ...props
}) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-flex items-center justify-center rounded-xl p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-800 dark:hover:text-gray-100 transition-all duration-150 active:scale-90 focus-ring ${className}`}
    {...props}
  >
    {children}
  </button>
);

interface SectionTitleProps {
  children: React.ReactNode;
  hint?: React.ReactNode;
  className?: string;
}

export const SectionTitle: React.FC<SectionTitleProps> = ({ children, hint, className = '' }) => (
  <div className={`flex items-baseline justify-between gap-4 ${className}`}>
    <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100 flex items-center gap-2">
      <span className="w-1.5 h-1.5 rounded-full bg-accent-500" />
      {children}
    </h2>
    {hint && (
      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-medium">
        {hint}
      </span>
    )}
  </div>
);

interface FieldProps {
  label: string;
  htmlFor?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const Field: React.FC<FieldProps> = ({ label, htmlFor, hint, children, className = '' }) => (
  <div className={`space-y-1.5 ${className}`}>
    <div className="flex items-baseline justify-between gap-3">
      <label htmlFor={htmlFor} className="text-xs font-semibold text-gray-700 dark:text-gray-300">
        {label}
      </label>
      {hint && <span className="text-[11px] text-gray-400 dark:text-gray-500">{hint}</span>}
    </div>
    {children}
  </div>
);

interface SegmentedProps<T extends string> {
  options: readonly T[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
  className?: string;
  gridOnMobile?: boolean;
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  disabled,
  className = '',
  gridOnMobile = true,
}: SegmentedProps<T>) {
  const isFour = options.length === 4;
  const isTwo = options.length === 2;

  const layoutClass = gridOnMobile
    ? isFour
      ? 'grid grid-cols-2 sm:flex sm:flex-nowrap w-full sm:w-auto'
      : isTwo
      ? 'grid grid-cols-2 sm:inline-flex w-full sm:w-auto'
      : 'flex flex-wrap sm:flex-nowrap w-full sm:w-auto'
    : 'inline-flex items-center flex-nowrap overflow-x-auto no-scrollbar';

  return (
    <div
      role="tablist"
      className={`rounded-xl bg-stone-100/90 dark:bg-stone-800/90 p-1 border border-stone-200/80 dark:border-stone-700/80 gap-1 shadow-inner ${layoutClass} ${className}`}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            role="tab"
            type="button"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-150 focus-ring disabled:cursor-not-allowed select-none text-center whitespace-nowrap flex items-center justify-center
              ${
                active
                  ? 'bg-white dark:bg-stone-900 text-stone-950 dark:text-stone-50 shadow-xs ring-1 ring-black/5 dark:ring-white/10 font-bold'
                  : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 hover:bg-white/40 dark:hover:bg-stone-700/40'
              }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
