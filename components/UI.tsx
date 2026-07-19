import React from 'react';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

const baseBtn =
  'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-150 focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none';

const variantCls: Record<Variant, string> = {
  primary: 'bg-accent-600 text-white hover:bg-accent-500 active:bg-accent-700',
  secondary:
    'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800',
  ghost:
    'bg-transparent text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
};

const sizeCls: Record<Size, string> = {
  sm: 'text-xs px-3 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-3',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'secondary',
  size = 'md',
  className = '',
  ...props
}) => (
  <button className={`${baseBtn} ${variantCls[variant]} ${sizeCls[size]} ${className}`} {...props} />
);

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  label: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ label, className = '', children, ...props }) => (
  <button
    type="button"
    aria-label={label}
    title={label}
    className={`inline-flex items-center justify-center rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-colors duration-150 focus-ring ${className}`}
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
    <h2 className="text-sm font-semibold tracking-tight text-gray-900 dark:text-gray-100">{children}</h2>
    {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
  </div>
);

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

/* A quiet section wrapper: whitespace + optional hairline, not a floating card. */
export const Panel: React.FC<PanelProps> = ({ children, className = '' }) => (
  <section className={`${className}`}>{children}</section>
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
      <label htmlFor={htmlFor} className="text-xs font-medium text-gray-600 dark:text-gray-400">
        {label}
      </label>
      {hint && <span className="text-xs text-gray-400 dark:text-gray-500">{hint}</span>}
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
}

export function Segmented<T extends string>({ options, value, onChange, disabled, className = '' }: SegmentedProps<T>) {
  return (
    <div
      role="tablist"
      className={`inline-flex items-center rounded-lg bg-gray-100 dark:bg-gray-800/80 p-1 flex-nowrap max-w-full overflow-x-auto no-scrollbar ${className}`}
    >
      {options.map((opt) => {
        const active = opt === value;
        return (
          <button
            key={opt}
            role="tab"
            aria-selected={active}
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-150 focus-ring disabled:cursor-not-allowed
              ${active
                ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'}`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}
