"use client";

import { useState } from "react";

import { adminInputClass, adminLabelClass } from "@/components/admin/AdminTile";

export type RoutePair = { origin: string; originCity: string; destination: string; destinationCity: string };

export function RoutePicker({ routes, origin: startOrigin, destination: startDestination }: { routes: RoutePair[]; origin: string; destination: string }) {
  const [origin, setOrigin] = useState(startOrigin);
  const [destination, setDestination] = useState(startDestination);

  const origins = airports(
    routes.filter((route) => destination === "" || route.destination === destination),
    (route) => [route.origin, route.originCity],
  );
  const destinations = airports(
    routes.filter((route) => origin === "" || route.origin === origin),
    (route) => [route.destination, route.destinationCity],
  );

  return (
    <>
      <label className="w-44">
        <span className={adminLabelClass}>Origin</span>
        <select name="origin" value={origin} onChange={(event) => setOrigin(event.target.value)} className={adminInputClass}>
          <option value="">Any origin</option>
          {origins.map(([code, city]) => (
            <option key={code} value={code}>
              {code} · {city}
            </option>
          ))}
        </select>
      </label>
      <label className="w-44">
        <span className={adminLabelClass}>Destination</span>
        <select name="destination" value={destination} onChange={(event) => setDestination(event.target.value)} className={adminInputClass}>
          <option value="">Any destination</option>
          {destinations.map(([code, city]) => (
            <option key={code} value={code}>
              {code} · {city}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function airports(routes: RoutePair[], pick: (route: RoutePair) => [string, string]): [string, string][] {
  return [...new Map(routes.map(pick))].sort(([a], [b]) => a.localeCompare(b));
}
