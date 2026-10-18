//use this component with the prop as either current={1} or current={2} or current={3} depending on the step of the booking process
//creates a pill style uninteractive navigation bar with the steps of the booking process

const steps = [
    { number: 1, label: "Flights"},
    { number: 2, label: "Seats"},
    { number: 3, label: "Information and Payment"},
];

export function StepPills({ current }: { current: number }) {

  return (
  <ol className="flex gap-4 mt-2 mb-2">
        {steps.map((step) => {
        let colors;
        if (step.number < current) {
          colors = "border-green-200 bg-green-50 text-green-700";
        } else if (step.number === current) {
          colors = "border-azure-navy bg-azure-navy text-white";
        } else {
          colors = "border-gray-300 bg-white text-gray-600";
        }

        return (
          <li key={step.number} className={`rounded-full border px-4 py-2 text-xs font-semibold ${colors}`}>
            {step.number} {step.label}
          </li>
        );
      })}

  </ol>
  )};