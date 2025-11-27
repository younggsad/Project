interface Props {
  highlights: any[];
}

export default function ProfileHighlights({ highlights }: Props) {
  if (!highlights || highlights.length === 0) return null;

  return (
    <div className="flex gap-4 px-4 py-4 overflow-x-auto">
      {highlights.map((h) => (
        <div key={h.id} className="flex flex-col items-center">
          <img
            src={h.cover}
            className="w-16 h-16 rounded-full border object-cover dark:border-neutral-700"
          />
          <span className="text-xs mt-1">{h.title}</span>
        </div>
      ))}
    </div>
  );
}
