// File: csvUtilities.js
export function convertToCSV(arr) {
    if (!arr.length) {
        return ""; // return empty string if there's no data
    }

    // First, find all unique keys/headers across all objects:
    const headers = Array.from(new Set(arr.flatMap(Object.keys)));

    // Create a header row as the first line of CSV
    const headerLine = headers.join(',');

    // Map each data object to a CSV string based on these headers
    const lines = arr.map(obj => {
        const line = headers.map(header => {
            const cell = obj[header] === undefined ? "" : obj[header]; // Handle undefined values
            const escaped = ('' + cell).replace(/"/g, '""'); // Escape double quotes
            return `"${escaped}"`; // Quote the values to handle commas in values
        });
        return line.join(',');
    });

    // Combine header and lines into a full CSV string
    return [headerLine, ...lines].join('\n');
}


export function downloadCSV(csv, filename) {
    const csvFile = new Blob([csv], { type: "text/csv" });
    const downloadLink = document.createElement("a");
    downloadLink.download = filename;
    downloadLink.href = window.URL.createObjectURL(csvFile);
    downloadLink.style.display = "none";
    document.body.appendChild(downloadLink);
    downloadLink.click();
}
