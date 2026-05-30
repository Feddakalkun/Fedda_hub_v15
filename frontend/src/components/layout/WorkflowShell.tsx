import type { ElementType, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface WorkflowShellProps {
  title: string;
  eyebrow?: string;
  description?: ReactNode;
  icon?: ElementType;
  children: ReactNode;
  output: ReactNode;
  isGenerating?: boolean;
  canGenerate?: boolean;
  leftClassName?: string;
  outputClassName?: string;
}

export const WorkflowShell = ({
  title,
  eyebrow = 'Workflow',
  description,
  icon: Icon,
  children,
  output,
  isGenerating = false,
  canGenerate = true,
  leftClassName = '',
  outputClassName = '',
}: WorkflowShellProps) => {
  return (
    <div className="workflow-shell">
      <section className={`workflow-control-pane ${leftClassName}`.trim()}>
        <div className="workflow-header">
          <div className="workflow-header-icon">
            {Icon ? <Icon className="h-4 w-4" /> : null}
          </div>
          <div className="min-w-0">
            <p className="workflow-eyebrow">{eyebrow}</p>
            <h1 className="workflow-title">{title}</h1>
            {description ? <div className="workflow-description">{description}</div> : null}
          </div>
          {isGenerating ? (
            <div className="workflow-status-pill text-violet-200 border-violet-400/25 bg-violet-500/10">
              <Loader2 className="h-3 w-3 animate-spin" />
              Running
            </div>
          ) : canGenerate ? (
            <div className="workflow-status-pill text-emerald-200 border-emerald-400/20 bg-emerald-500/10">
              Ready
            </div>
          ) : (
            <div className="workflow-status-pill text-slate-400 border-white/10 bg-white/[0.03]">
              Setup
            </div>
          )}
        </div>

        <div className="workflow-scroll">
          {children}
        </div>
      </section>

      <section className={`workflow-output-pane ${outputClassName}`.trim()}>
        {output}
      </section>
    </div>
  );
};

interface WorkflowSectionProps {
  title?: ReactNode;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const WorkflowSection = ({ title, actions, children, className = '' }: WorkflowSectionProps) => {
  return (
    <section className={`workflow-section ${className}`.trim()}>
      {(title || actions) && (
        <div className="workflow-section-header">
          {title ? <div className="workflow-section-title">{title}</div> : <span />}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
};
