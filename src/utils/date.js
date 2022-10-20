export const TODAY = new Date();

const WEEKDAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export const maxDate = (dates) =>
  dates.reduce((a, b) => (new Date(a) > new Date(b) ? a : b));
export const minDate = (dates) =>
  dates.reduce((a, b) => (new Date(a) < new Date(b) ? a : b));

export const addDays = (date, days) => {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
};

export const isToday = (date) => {
  return (
    date.getDate() === TODAY.getDate() &&
    date.getMonth() === TODAY.getMonth() &&
    date.getFullYear() === TODAY.getFullYear()
  );
};

export const isYesterday = (date) => {
  return isToday(addDays(date, 1));
};

// 1 -> 1st, 2 -> 2nd, 12 -> 12th, 23 -> 23rd, 29 -> 29th
const getDateSuffix = (day) => {
  if (day <= 0 || day >= 32) {
    return "";
  } // should not happen
  if (day === 1 || day === 21 || day === 31) {
    return "st";
  }
  if (day === 2 || day === 22) {
    return "nd";
  }
  if (day === 3 || day === 23) {
    return "rd";
  }
  return "th";
};

// '5/19/2020' -> Tuesday, May 19th
export const friendlyDate = (dateStr) => {
  // We get a babel error on `npm run build` when destructing like so:
  // const [dateMonth, dateDay, dateYear] = dateStr.split("/");
  // So instead we break apart the pieces manually below *sigh*
  const datePieces = dateStr.split("/");
  const dateMonth = parseInt(datePieces[0], 10) - 1; // Months start from 0
  const dateDay = datePieces[1];
  const dateYear = datePieces[2];
  const date = new Date(dateYear, dateMonth, dateDay);
  if (isToday(date)) {
    return "Today";
  }
  if (isYesterday(date)) {
    return "Yesterday";
  }

  const weekday = WEEKDAYS[date.getDay()];
  const month = MONTHS[date.getMonth()];
  const day = `${date.getDate()}${getDateSuffix(date.getDate())}`;

  return `${weekday}, ${month} ${day}`;
};

// 2020-08-16T01:22:00.000Z -> '8/16/2020'
export const extractDate = (date) =>
  `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
