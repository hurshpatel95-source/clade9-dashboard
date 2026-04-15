import { tintFromName } from "@/lib/utils";

export function FamilyAvatar({
  name,
  emoji,
  color,
  size = 36,
}: {
  name: string;
  emoji?: string | null;
  color?: string | null;
  size?: number;
}) {
  const tint = color || tintFromName(name);
  return (
    <span
      className="grid place-items-center rounded-full text-base font-semibold text-white"
      style={{
        width: size,
        height: size,
        backgroundColor: tint,
        fontSize: size * 0.45,
      }}
      aria-hidden
    >
      {emoji ?? name.slice(0, 1).toUpperCase()}
    </span>
  );
}
