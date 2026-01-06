import * as XLSX from "xlsx";
import { ApiEndpoint } from "../mock-db";

export function exportApisToExcel(endpoints: ApiEndpoint[]) {
    const data = endpoints.map(api => ({
        "Path": api.path,
        "Method": api.method,
        "Summary": api.summary,
        "Controller": api.className,
        "Method Name": api.methodName,
        "Request Body": api.requestBody || "-",
        "Response Type": api.responseType || "-",
        "Version": api.version || "1.0.0",
        "Last Sync": api.syncedAt ? new Date(api.syncedAt).toLocaleString() : "Just now"
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "API 명세");

    // 열 너비 조정
    const wscols = [
        { wch: 40 }, // Path
        { wch: 10 }, // Method
        { wch: 40 }, // Summary
        { wch: 25 }, // Controller
        { wch: 20 }, // Method Name
        { wch: 20 }, // Request Body
        { wch: 20 }, // Response Type
        { wch: 10 }, // Version
        { wch: 25 }, // Last Sync
    ];
    worksheet["!cols"] = wscols;

    XLSX.writeFile(workbook, `API_Hub_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
}
