import { getMois, parseDate } from "./helpers";

export function buildIndex(rows, group) {
  const filtered = group ? rows.filter((r) => r.groupe_suivi === group) : rows;
  console.log(group)
  const dateIndex = {}, dateWeek = {}, dateMois = {};
  const allFiles = new Set(), allRd = new Set(), allDates = new Set();

  filtered.forEach((r) => {
    const { date_appel: date, semaine: sem, source: src, attribut: attr } = r;
    const val = parseFloat(r.valeur) || 0;
    const key = src + "::" + attr;
    const mois = getMois(date);

    allDates.add(date);
    dateWeek[date] = sem;
    dateMois[date] = mois;

    if (src === "files") allFiles.add(attr);
    if (src === "rd") allRd.add(attr);

    if (!dateIndex[date]) dateIndex[date] = {};
    dateIndex[date][key] = (dateIndex[date][key] || 0) + val;
  });

  const monthWeekDay = {};
  allDates.forEach((d) => {
    const w = dateWeek[d], m = dateMois[d];
    if (!monthWeekDay[m]) monthWeekDay[m] = {};
    if (!monthWeekDay[m][w]) monthWeekDay[m][w] = [];
    monthWeekDay[m][w].push(d);
  });

  const sortedDates = [...allDates].sort((a, b) => parseDate(a) - parseDate(b));
  const sortedMonths = Object.keys(monthWeekDay).sort();

  return {
    dateIndex,
    dateWeek,
    dateMois,
    allFiles: [...allFiles].sort(),
    allRd: [...allRd].sort(),
    sortedDates,
    sortedMonths,
    monthWeekDay,
  };
}

export function buildAgg(dates, dateIndex) {
  const agg = {};
  dates.forEach((d) => {
    const dd = dateIndex[d] || {};
    Object.keys(dd).forEach((k) => { agg[k] = (agg[k] || 0) + dd[k]; });
  });
  return agg;
}
