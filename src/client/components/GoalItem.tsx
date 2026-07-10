import type { OrderGoal } from '../../shared/orderGoals.js';
import {
  goalClassName,
  goalDisplayLabel,
  goalProgressPercent,
} from '../../shared/orderGoals.js';

function formatCount(value: number): string {
  return new Intl.NumberFormat('en-US').format(value);
}

export function GoalItem({ goal }: { goal: OrderGoal }) {
  const toneClass = goalClassName(goal.tone);
  const label = goalDisplayLabel(goal);

  if (goal.progress?.kind === 'box') {
    return (
      <li className={`order-goal ${toneClass} order-goal--box`}>
        <span
          className={goal.progress.complete ? 'goal-box goal-box--complete' : 'goal-box'}
          aria-hidden="true"
        />
        <span className="goal-label">{label}</span>
        <span className="sr-only">
          {goal.text}
          {goal.progress.complete ? ' — complete' : ' — incomplete'}
        </span>
      </li>
    );
  }

  if (goal.progress?.kind === 'bar') {
    const percent = goalProgressPercent(goal.progress);

    return (
      <li className={`order-goal ${toneClass} order-goal--bar`}>
        <span className="goal-label">{goal.text}</span>
        <div
          className="goal-bar"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={goal.progress.goal}
          aria-valuenow={goal.progress.current}
          aria-label={`${goal.text}: ${formatCount(goal.progress.current)} of ${formatCount(goal.progress.goal)} (${percent}%)`}
        >
          <div className="goal-bar-fill" style={{ width: `${percent}%` }} />
        </div>
      </li>
    );
  }

  return (
    <li className={`order-goal ${toneClass}`}>
      <span className="goal-label">{goal.text}</span>
    </li>
  );
}
