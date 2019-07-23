export function formatDate(date, showtime = true, abbr = true) {
    if (!(date instanceof Date)) {
        date = new Date(date)
    }
    let dayOfMonth = date.getDate();
    let month = date.getMonth() + 1;
    let year = date.getFullYear();
    let hour = date.getHours();
    let minutes = date.getMinutes();
    let diffMs = new Date() - date;
    let diffSec = Math.round(diffMs / 1000);
    let diffMin = diffSec / 60;
    let diffHour = diffMin / 60;

    year = year.toString().slice(-2);
    month = month < 10 ? '0' + month : month;
    hour = hour < 10 ? '0' + hour : hour;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    dayOfMonth = dayOfMonth < 10 ? '0' + dayOfMonth : dayOfMonth;

    if (diffMs < 0 || abbr === false) {
        return showtime ? `${dayOfMonth}.${month}.'${year} ${hour}:${minutes}` : `${dayOfMonth}.${month}.'${year}`
    }
    if (diffSec < 1) {
        return 'right now';
    } else if (diffMin < 1) {
        return `${diffSec.toFixed()} sec. ago`
    } else if (diffHour < 1) {
        return `${diffMin.toFixed()} min. ago`
    } else {
        return showtime ? `${dayOfMonth}.${month}.'${year} ${hour}:${minutes}` : `${dayOfMonth}.${month}.'${year}`
    }
}

export const uc = str => str.charAt(0).toUpperCase() + str.slice(1);
export const trunc = (t, n = 10) => t.substr(0, n - 1) + (t.length > n ? "..." : "");
export const uuid = () => ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
)
export function downloadAsJson(exportObj, exportName) {
    var dataStr =
        "data:text/json;charset=utf-8," +
        encodeURIComponent(JSON.stringify(exportObj));
    var da = document.createElement("a");
    da.setAttribute("href", dataStr);
    da.setAttribute("download", exportName + ".json");
    document.body.appendChild(da); // required for firefox
    da.click();
    da.remove();
}