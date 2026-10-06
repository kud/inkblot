export const STYLE_ID = "inkblot-style"
export const FILTER_ID = "inkblot-edge"

export const stylesheet = `
.inkblot {
  position: fixed;
  inset: -60px;
  z-index: var(--inkblot-z, 2147483646);
  background: var(--inkblot-colour, #000);
  pointer-events: none;
  opacity: 0;
  clip-path: circle(0% at var(--inkblot-x, 50%) var(--inkblot-y, 50%));
}

.inkblot-cover,
.inkblot-reveal,
.inkblot-veil {
  opacity: 1;
  filter: url("#${FILTER_ID}");
  will-change: clip-path;
  animation: inkblot-spread var(--inkblot-duration, 500ms) cubic-bezier(0.5, 0, 0.85, 1) forwards;
}

.inkblot-reveal {
  animation-direction: reverse;
}

.inkblot-veil {
  opacity: 0.88;
}

.inkblot-fade-in,
.inkblot-fade-out,
.inkblot-veil-fade {
  clip-path: none;
}

.inkblot-fade-in {
  opacity: 1;
  animation: inkblot-darken var(--inkblot-duration, 280ms) ease-out forwards;
}

.inkblot-fade-out {
  opacity: 1;
  animation: inkblot-clear var(--inkblot-duration, 400ms) ease-out forwards;
}

.inkblot-veil-fade {
  opacity: 0.88;
  animation: inkblot-veil-in var(--inkblot-duration, 280ms) ease-out backwards;
}

@keyframes inkblot-spread {
  from {
    clip-path: circle(0% at var(--inkblot-x, 50%) var(--inkblot-y, 50%));
  }
  to {
    clip-path: circle(150% at var(--inkblot-x, 50%) var(--inkblot-y, 50%));
  }
}

@keyframes inkblot-darken {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes inkblot-clear {
  to {
    opacity: 0;
  }
}

@keyframes inkblot-veil-in {
  from {
    opacity: 0;
  }
}
`
