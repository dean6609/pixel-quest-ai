interface Props {
  open: boolean;
  onToggle: () => void;
}

export function HourglassButton({ open, onToggle }: Props) {
  return (
    <button
      className={`hourglass ${open ? "hourglass--active" : ""}`}
      onClick={onToggle}
      aria-label="Conversaciones pasadas"
      aria-pressed={open}
      title="Conversaciones pasadas"
    >
      <svg viewBox="0 0 24 24" width="24" height="24" aria-hidden="true">
        <path
          d="M6 3h12M6 21h12M7 3c0 5 10 5 10 0M7 21c0-5 10-5 10 0M8 4l8 16M16 4L8 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path className="hourglass__sand" d="M9.5 18.5h5l-2.5-3z" fill="currentColor" />
      </svg>
    </button>
  );
}
