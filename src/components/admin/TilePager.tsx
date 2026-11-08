import Link from "next/link";

type SearchParams = { [key: string]: string | string[] | undefined };

export function pageNumber(params: SearchParams, name: string, total: number, size: number): number {
  const value = params[name];
  const asked = Math.floor(Number(Array.isArray(value) ? value[0] : value) || 1);
  return Math.min(Math.max(1, asked), Math.max(1, Math.ceil(total / size)));
}

export function TilePager({
  basePath,
  params,
  name,
  page,
  size,
  total,
  noun,
}: {
  basePath: string;
  params: SearchParams;
  name: string;
  page: number;
  size: number;
  total: number;
  noun: string;
}) {
  if (total === 0) return null;
  const first = (page - 1) * size + 1;
  const last = Math.min(page * size, total);

  const hrefFor = (target: number) => {
    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      const text = Array.isArray(value) ? value[0] : value;
      if (text && key !== name) query.set(key, text);
    }
    if (target > 1) query.set(name, String(target));
    return query.size > 0 ? `${basePath}?${query}` : basePath;
  };

  return (
    <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4 text-sm">
      {page > 1 ? (
        <Link href={hrefFor(page - 1)} scroll={false} className="font-semibold text-azure-blue hover:underline">
          ← Previous {size}
        </Link>
      ) : (
        <span className="text-gray-400">← Previous {size}</span>
      )}
      <span className="text-gray-600">
        {noun} {first}–{last} of {total}
      </span>
      {last < total ? (
        <Link href={hrefFor(page + 1)} scroll={false} className="font-semibold text-azure-blue hover:underline">
          Next {size} →
        </Link>
      ) : (
        <span className="text-gray-400">Next {size} →</span>
      )}
    </div>
  );
}
