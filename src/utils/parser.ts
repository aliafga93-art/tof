import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { LatenessRecord } from '../types';

// Helper to generate a random or unique ID
const generateId = () => Math.random().toString(36).substring(2, 9);

// Helper to clean Arabic/English text
function cleanText(text: any): string {
  if (text === null || text === undefined) return '';
  const str = String(text).trim();
  if (str === '—' || str === '-' || str === '---' || str === 'لا يوجد') return '';
  return str;
}

// Convert Excel Serial Date to DD/MM/YYYY string
export function parseExcelDate(val: any): string {
  if (typeof val === 'number' && val > 30000 && val < 60000) {
    const date = new Date((val - 25569) * 86400 * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }
  return cleanText(val);
}

// Parse and clean time string (extracting first time value)
export function parseTimeString(val: any): string {
  let str = cleanText(val);
  if (!str) return '';

  // Replace common arabic colons or characters
  str = str.replace(/：/g, ':');

  // If there are multiple times (e.g., "08:04 08:04" or "08:04\n08:04"), take the first one
  const pieces = str.split(/[\s\n\r\t]+/).filter(Boolean);
  if (pieces.length > 0) {
    str = pieces[0];
  }

  // Ensure format is HH:MM, if it's like "8:4" convert to "08:04"
  const match = str.match(/(\d{1,2}):(\d{1,2})/);
  if (match) {
    const hh = match[1].padStart(2, '0');
    const mm = match[2].padStart(2, '0');
    return `${hh}:${mm}`;
  }

  return str;
}

// Calculate lateness minutes relative to 08:00 AM
export function calculateLatenessMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  
  const match = timeStr.match(/(\d{2}):(\d{2})/);
  if (!match) return 0;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (isNaN(hours) || isNaN(minutes)) return 0;

  const totalMinutes = hours * 60 + minutes;
  const targetMinutes = 8 * 60; // 08:00 AM

  const diff = totalMinutes - targetMinutes;
  return diff > 0 ? diff : 0;
}

/**
 * Parses a 2D array (rows of cells) into LatenessRecord objects.
 * It dynamically searches for the header row or fallbacks to parsing numeric rows.
 */
export function parseRawData(rows: any[][]): LatenessRecord[] {
  if (!rows || rows.length === 0) return [];

  // 1. Try to find the header row by searching for keywords
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 15); i++) {
    const row = rows[i] || [];
    const rowStr = row.map(cell => String(cell || '').trim()).join('|');
    if (
      rowStr.includes('الاسم') || 
      rowStr.includes('القسم') || 
      rowStr.includes('التاريخ') || 
      rowStr.includes('وقت التأخير') ||
      rowStr.includes('بصمة')
    ) {
      headerIndex = i;
      break;
    }
  }

  // Determine column indexes based on header or default
  let colIndexNo = 0;
  let colIndexName = 1;
  let colIndexDept = 2;
  let colIndexDate = 3;
  let colIndexTime = 4;

  let dataStartRow = 0;

  if (headerIndex !== -1) {
    const headerRow = rows[headerIndex];
    dataStartRow = headerIndex + 1;

    // Find closest matches for columns
    headerRow.forEach((cell, idx) => {
      const cellStr = String(cell || '').trim();
      if (cellStr === 'ت' || cellStr === 'ت.' || cellStr === 'الرقم' || cellStr === 'م') {
        colIndexNo = idx;
      } else if (cellStr.includes('الاسم') || cellStr.includes('اسم')) {
        colIndexName = idx;
      } else if (cellStr.includes('القسم') || cellStr.includes('جهة') || cellStr.includes('الدائرة')) {
        colIndexDept = idx;
      } else if (cellStr.includes('التاريخ') || cellStr.includes('تاريخ')) {
        colIndexDate = idx;
      } else if (cellStr.includes('وقت') || cellStr.includes('التأخير') || cellStr.includes('البصمة') || cellStr.includes('بصمة')) {
        colIndexTime = idx;
      }
    });
  } else {
    // If no header was found, find the first row that looks like a data row:
    // Starts with a number (e.g. 1), followed by a string (name), department, date, time
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i] || [];
      const firstColNum = parseInt(String(r[0] || '').trim(), 10);
      if (!isNaN(firstColNum) && r.length >= 4) {
        dataStartRow = i;
        break;
      }
    }
  }

  const records: LatenessRecord[] = [];

  for (let i = dataStartRow; i < rows.length; i++) {
    const r = rows[i] || [];
    // Skip empty or purely whitespace rows
    if (r.filter(cell => cell !== null && cell !== undefined && String(cell).trim() !== '').length === 0) {
      continue;
    }

    // Extract raw fields
    const rawNo = r[colIndexNo];
    const rawName = r[colIndexName];
    const rawDept = r[colIndexDept];
    const rawDate = r[colIndexDate];
    const rawTime = r[colIndexTime];

    const cleanNoStr = String(rawNo || '').trim();
    const indexVal = parseInt(cleanNoStr, 10);

    // If there is no name and no time, this is probably footer text or signatures, skip it
    if (!rawName && !rawTime) {
      continue;
    }

    const name = cleanText(rawName);
    const department = cleanText(rawDept);
    const dateString = parseExcelDate(rawDate);
    const timeString = parseTimeString(rawTime);
    const minutes = calculateLatenessMinutes(timeString);

    // Validation flags
    let hasError = false;
    let errorMsg = '';

    if (!name) {
      hasError = true;
      errorMsg = 'الاسم مفقود';
    } else if (!dateString) {
      hasError = true;
      errorMsg = 'التاريخ مفقود أو غير مفهوم';
    } else if (!timeString) {
      hasError = true;
      errorMsg = 'وقت البصمة مفقود';
    } else {
      // Check if time is valid HH:MM format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(timeString)) {
        hasError = true;
        errorMsg = `تنسيق الوقت غير صالح (${timeString})`;
      }
    }

    records.push({
      id: generateId(),
      index: isNaN(indexVal) ? (records.length + 1) : indexVal,
      name,
      department,
      dateString,
      timeString,
      minutesOfLateness: minutes,
      hasError,
      errorMsg
    });
  }

  return records;
}

/**
 * Parses an Excel file (.xlsx) from an ArrayBuffer
 */
export function parseExcelFile(arrayBuffer: ArrayBuffer): LatenessRecord[] {
  const data = new Uint8Array(arrayBuffer);
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  
  // Convert sheet to 2D array
  const rows = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1 });
  return parseRawData(rows);
}

/**
 * Parses a Word file (.docx) from an ArrayBuffer
 * Uses mammoth to convert to HTML, then extracts tables
 */
export async function parseWordFile(arrayBuffer: ArrayBuffer): Promise<LatenessRecord[]> {
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Set up a temporary DOM node to parse the HTML tables
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const tables = doc.getElementsByTagName('table');

  if (tables.length === 0) {
    throw new Error('لم يتم العثور على أي جداول في ملف الوورد المرفوع.');
  }

  // Parse the first table
  const table = tables[0];
  const trElements = table.getElementsByTagName('tr');
  const rows: any[][] = [];

  for (let i = 0; i < trElements.length; i++) {
    const tr = trElements[i];
    const tdElements = tr.querySelectorAll('td, th');
    const cells: any[] = [];
    
    tdElements.forEach(td => {
      // Clean up multiple spaces and tag structures
      cells.push(td.textContent?.trim() || '');
    });
    
    rows.push(cells);
  }

  return parseRawData(rows);
}
