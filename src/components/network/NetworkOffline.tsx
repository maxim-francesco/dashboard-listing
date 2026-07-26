import { Link } from "react-router-dom";

export default function NetworkOffline() {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex flex-col gap-3">
      <p className="text-[15px] text-foreground">
        Ești în afara rețelei, așa că nu vezi ce fac ceilalți dealeri.
      </p>
      <Link
        to="/network/setari"
        className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-[15px] font-semibold w-fit flex items-center justify-center"
      >
        Intră în rețea
      </Link>
    </div>
  );
}
