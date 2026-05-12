const DEVISE_MAP = {
  'Yas':        { symbol: '€',  label: 'Euros',  color: 'blue'   },
  'Mvola':      { symbol: '€',  label: 'Euros',  color: 'blue'   },
  'Telco OI':   { symbol: '€',  label: 'Euros',  color: 'blue'   },
  'Yas Comores':{ symbol: '€',  label: 'Euros',  color: 'blue'   },
  'ARO':        { symbol: 'Ar', label: 'Ariary', color: 'violet' },
  'Prodigy':    { symbol: 'Ar', label: 'Ariary', color: 'violet' },
  'Stellarix':  { symbol: 'Ar', label: 'Ariary', color: 'violet' },
  'Welight':    { symbol: 'Ar', label: 'Ariary', color: 'violet' },
  'Free PRO' :  { symbol: '€',  label: 'Euros',  color: 'blue'   }
};

export default function Legend({ dark, currentActivity = '' }) {
  const bg2   = dark ? "bg-[#161b22]" : "bg-white";
  const border= dark ? "border-[#30363d]" : "border-slate-200";
  const muted = dark ? "text-slate-500" : "text-slate-400";

  const chip = (color, label) => {
    const c = {
      green:  dark ? "bg-green-950 text-green-400"  : "bg-green-100 text-green-700",
      orange: dark ? "bg-amber-950 text-amber-400"  : "bg-amber-100 text-amber-700",
      red:    dark ? "bg-red-950 text-red-400"       : "bg-red-100 text-red-600",
    };
    return (
      <span className={`inline-block px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${c[color]}`}>
        {label}
      </span>
    );
  };

  //  Badge devise
  const devise = DEVISE_MAP[currentActivity] || null;
  const deviseChipClass = devise?.color === 'blue'
    ? (dark ? "bg-blue-900/40 text-blue-300 border border-blue-700/40" : "bg-blue-50 text-blue-700 border border-blue-200")
    : (dark ? "bg-violet-900/40 text-violet-300 border border-violet-700/40" : "bg-violet-50 text-violet-700 border border-violet-200");

  return (
    <div className={`flex items-center gap-4 px-5 h-8 ${bg2} border-t ${border} flex-shrink-0 flex-wrap`}>

      {/* Indicateurs performance */}
      <span className={`text-[11px] font-medium ${muted}`}>Performance :</span>
      <div className="flex items-center gap-1 text-[11px]">
        {chip("green", "✓ OK")}
        <span className={muted}>Dans la cible</span>
      </div>
      <div className="flex items-center gap-1 text-[11px]">
        {chip("orange", "~ ")}
        <span className={muted}>Acceptable</span>
      </div>
      <div className="flex items-center gap-1 text-[11px]">
        {chip("red", "✗ ")}
        <span className={muted}>Hors cible</span>
      </div>

      <div className={`w-px h-4 mx-1 ${dark ? "bg-slate-700" : "bg-slate-300"}`} />

      {/* Légende colonnes */}
      <div className="flex items-center gap-1.5 text-[11px]">
        <div className={`w-3.5 h-0.5 rounded ${dark ? "bg-slate-500" : "bg-slate-400"}`} />
        <span className={muted}>Total semaine</span>
      </div>
      <div className="flex items-center gap-1.5 text-[11px]">
        <div className="w-3.5 h-0.5 rounded bg-blue-500" />
        <span className={muted}>Total mois</span>
      </div>

      {/*  Devise CA — affichée uniquement si l'activité est connue */}
      {devise && (
        <>
          <div className={`w-px h-4 mx-1 ${dark ? "bg-slate-700" : "bg-slate-300"}`} />
          <div className="flex items-center gap-1.5 text-[11px]">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${deviseChipClass}`}>
              <span className="font-bold">{devise.symbol}</span>
              CA en {devise.label}
            </span>
          </div>
        </>
      )}

    </div>
  );
}
