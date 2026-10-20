//use this component with the prop as either current={1} or current={2} or current={3} depending on the step of the booking process

const steps = [
  { number: 1, label: "Flights" },
  { number: 2, label: "Seats" },
  { number: 3, label: "Information and Payment" },
];

export function StepPills({ current }: { current: number }) {
  return (
    <ol aria-label="Booking steps" className="flex gap-10 border-b border-gray-300">
      {steps.map((step) => {
        const done = step.number < current;
        const isCurrent = step.number === current;

        let circle;
        let label;
        if (done) {
          circle = "border-azure-blue bg-azure-blue text-white";
          label = "text-gray-700";
        } else if (isCurrent) {
          circle = "border-azure-navy bg-azure-navy text-white";
          label = "font-semibold text-azure-navy";
        } else {
          circle = "border-gray-300 bg-white text-gray-500";
          label = "text-gray-500";
        }

        return (
          <li
            key={step.number}
            aria-current={isCurrent ? "step" : undefined}
            className={`-mb-px flex items-center gap-2.5 border-b-[3px] pb-3 text-sm ${
              isCurrent ? "border-azure-blue" : "border-transparent"
            }`}
          >
            <span
              className={`flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ${circle}`}
            >
              {done ? "✓" : step.number}
            </span>
            <span className={label}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
