import { VALIDATORS } from '../game/validators';

interface RuleListProps {
  results: Record<string, boolean>;
  input: string;
}

export function RuleList({ results, input }: RuleListProps) {
  const passCount = Object.values(results).filter(Boolean).length;

  return (
    <div style={{ width: '100%', maxWidth: 500 }}>
      <div className="rule-counter" style={{ marginBottom: 4, textAlign: 'center' }}>
        RULES {passCount}/{VALIDATORS.length}
      </div>
      <div className="rule-list">
        {VALIDATORS.map((v) => {
          const hasInput = input.length > 0;
          const status = !hasInput ? 'pending' : results[v.id] ? 'pass' : 'fail';
          return (
            <div key={v.id} className={`rule-item ${status}`}>
              <span>{status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○'}</span>
              <span>{v.id}: {v.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
