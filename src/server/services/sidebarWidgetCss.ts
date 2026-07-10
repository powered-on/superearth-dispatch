/** Scoped CSS for Reddit custom sidebar widget (markdown + HTML goals). */
export const SIDEBAR_WIDGET_CSS = `
p,
li,
em,
ul {
  font-family: "Rajdhani", "Segoe UI", system-ui, sans-serif;
  font-size: 0.84rem;
  line-height: 1.45;
  color: #c8cbcd;
}

h3 {
  margin: 0.75rem 0 0.35rem;
  font-family: "Barlow Condensed", "Arial Narrow", sans-serif;
  font-size: 0.78rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #818384;
}

h3:first-child {
  margin-top: 0;
}

p {
  margin: 0 0 0.4rem;
}

.sed-order-title {
  color: #fff;
  font-family: "Barlow Condensed", "Arial Narrow", sans-serif;
}

.sed-order-title strong {
  font-weight: 700;
  letter-spacing: 0.02em;
}

.sed-countdown {
  font-size: 0.78rem;
  font-weight: 600;
  font-style: normal;
  color: #ffb900;
}

.sed-order-body {
  font-size: 0.8rem;
  color: #a8abae;
}

.sed-goals {
  margin: 0.35rem 0 0.5rem;
  padding: 0;
  list-style: none;
}

.sed-goal {
  margin: 0.35rem 0;
  padding: 0.35rem 0.45rem 0.35rem 0.55rem;
  font-size: 0.78rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.03);
  border-left: 3px solid #ffe900;
}

.sed-goal--brand {
  border-left-color: #ffe900;
  color: #ffe900;
}

.sed-goal--terminid {
  border-left-color: #ffb900;
  color: #ffb900;
}

.sed-goal--automaton {
  border-left-color: #ff7171;
  color: #ff7171;
}

.sed-goal--illuminate {
  border-left-color: #cd8ae9;
  color: #cd8ae9;
}

.sed-goal--default {
  border-left-color: #ffe900;
  color: #c8cbcd;
}

.sed-goal--bar .sed-pct {
  display: block;
  font-size: 0.68rem;
  font-weight: 500;
  color: #a8abae;
  margin-top: 0.15rem;
}

.sed-goal--bar .sed-pct::before {
  content: "";
  display: block;
  height: 7px;
  width: 100%;
  margin-bottom: 0.2rem;
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-sizing: border-box;
  background:
    linear-gradient(currentColor, currentColor) 0 0 / var(--sed-pct, 0%) 100% no-repeat,
    rgba(0, 0, 0, 0.25);
}

.sed-goal--brand.sed-goal--bar .sed-pct::before {
  color: #ffe900;
}

.sed-goal--terminid.sed-goal--bar .sed-pct::before {
  color: #ffb900;
}

.sed-goal--automaton.sed-goal--bar .sed-pct::before {
  color: #ff7171;
}

.sed-goal--illuminate.sed-goal--bar .sed-pct::before {
  color: #cd8ae9;
}

.sed-goal--default.sed-goal--bar .sed-pct::before {
  color: #ffe900;
}

.sed-goal--box {
  display: flex;
  align-items: center;
  gap: 0.45rem;
}

.sed-box {
  width: 11px;
  height: 11px;
  flex-shrink: 0;
  background: #2a2d31;
  border: 1px solid #45494e;
}

.sed-box--complete {
  background: #3d9e46;
  border-color: #4db858;
}

.sed-standby {
  margin: 0 0 0.5rem;
  font-style: italic;
  color: #ffb900;
}

.sed-stale,
.sed-error {
  margin: 0.45rem 0 0;
  padding: 0.45rem 0.5rem;
  font-size: 0.78rem;
  border-radius: 3px;
}

.sed-stale {
  color: #e8a838;
  background: rgba(232, 168, 56, 0.08);
  border: 1px solid rgba(232, 168, 56, 0.35);
}

.sed-error {
  color: #ff525d;
  background: rgba(255, 82, 93, 0.08);
  border: 1px solid rgba(255, 82, 93, 0.35);
}

hr {
  margin: 0.65rem 0;
  border: none;
  border-top: 1px solid #343536;
}

.sed-footer {
  margin: 0.15rem 0;
  font-size: 0.72rem;
  color: #818384;
}
`.trim();

export function computeWidgetHeight(text: string): number {
  const lineCount = text.split('\n').length;
  const goalCount = (text.match(/sed-goal/g) ?? []).length;
  const estimated = 130 + lineCount * 5 + goalCount * 26;
  return Math.min(500, Math.max(150, estimated));
}
