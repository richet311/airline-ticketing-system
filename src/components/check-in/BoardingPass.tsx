import { DawnCrest } from "@/components/Logo";
import { formatDate, formatTime } from "@/lib/format";

export type BoardingPassData = {
  eTicketNumber: string;
  passengerName: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  boardingTime: string;
  timeZone: string;
  gate: string | null;
  seat: string | null;
  cabin: string;
  group: number;
};

// preview = faded one before check in
export function BoardingPass({ pass, preview = false }: { pass: BoardingPassData; preview?: boolean }) {
  return (
    <article
      aria-label={`Boarding pass for ${pass.passengerName}${preview ? " (not checked in yet)" : ""}`}
      className={`overflow-hidden rounded-card border border-gray-200 bg-white shadow-card ${preview ? "opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between bg-azure-navy px-6 py-4 text-white">
        <span className="flex items-center gap-2.5 text-[15px] font-semibold tracking-[0.18em]">
          <DawnCrest ribbon={false} className="h-9 w-auto" />
          AZURE AIR
        </span>
        <span className="text-xs font-semibold tracking-widest text-sky-300 uppercase">
          {preview ? "Not checked in" : `${pass.cabin} · Group ${pass.group}`}
        </span>
      </div>

      <div className="space-y-6 px-6 pt-6 pb-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-4xl font-semibold text-azure-navy">{pass.origin}</p>
            <p className="text-sm text-gray-600">{pass.originCity}</p>
          </div>
          <span aria-hidden="true" className="mt-5 h-px flex-1 max-w-24 bg-gray-400" />
          <div className="text-right">
            <p className="text-4xl font-semibold text-azure-navy">{pass.destination}</p>
            <p className="text-sm text-gray-600">{pass.destinationCity}</p>
          </div>
        </div>

        <dl className="grid grid-cols-3 gap-x-4 gap-y-4">
          <Detail label="Passenger" value={pass.passengerName} />
          <Detail label="Flight" value={pass.flightNumber.replace(/^([A-Z]+)/, "$1 ")} />
          <Detail label="Date" value={formatDate(pass.departureTime, pass.timeZone).replace(/, \d{4}$/, "")} />
          <Detail label="Gate" value={pass.gate ?? "TBA"} />
          <Detail label="Boards" value={formatTime(pass.boardingTime, pass.timeZone)} />
          <Detail label="Seat" value={pass.seat ?? "None"} />
        </dl>
      </div>

      <div className="mx-6 border-t-2 border-dashed border-gray-300" />
      <div className="flex flex-col items-center gap-2 px-6 pt-4 pb-6">
        <Barcode text={pass.eTicketNumber} />
        <p className="font-mono text-sm tracking-widest text-gray-900">{pass.eTicketNumber}</p>
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-semibold tracking-widest text-gray-500 uppercase">{label}</dt>
      <dd className="truncate text-[17px] font-semibold text-azure-navy uppercase">{value}</dd>
    </div>
  );
}

// just for looks, not a real scannable barcode
function Barcode({ text }: { text: string }) {
  const bars = [...text].flatMap((character) => {
    const code = character.charCodeAt(0);
    return [1 + (code % 3), 1 + ((code >> 2) % 2)];
  });
  return (
    <div aria-hidden="true" className="flex h-14 items-stretch gap-[3px]">
      {bars.map((width, index) => (
        <span key={index} className="bg-gray-900" style={{ width: `${width + 1}px` }} />
      ))}
    </div>
  );
}
