const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');

const processTextFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return { success: true, text: content, pages: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const processPdfFile = async (filePath) => {
  try {
    const pdfParse = require('pdf-parse');
    const dataBuffer = fs.readFileSync(filePath);
    const data = await pdfParse(dataBuffer);
    return { success: true, text: data.text, pages: data.numpages };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const processDocxFile = async (filePath) => {
  try {
    const mammoth = require('mammoth');
    const dataBuffer = fs.readFileSync(filePath);
    const result = await mammoth.extractRawText({ buffer: dataBuffer });
    return { success: true, text: result.value, pages: null };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const processCsvFile = (filePath) => {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    const allRecords = parse(content, {
      columns: false,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true
    });

    const columns = allRecords.length > 0 ? allRecords[0] : [];
    const dataTypes = {};
    const missingValues = {};
    const summary = {};

    columns.forEach(col => {
      const values = records.map(r => r[col]).filter(v => v !== undefined && v !== null && v !== '');
      missingValues[col] = records.length - values.length;

      const numValues = values.filter(v => !isNaN(v) && v !== '').length;
      if (numValues > values.length * 0.5) {
        dataTypes[col] = 'numeric';
        const nums = values.map(Number).filter(n => !isNaN(n));
        summary[col] = {
          mean: (nums.reduce((a, b) => a + b, 0) / nums.length).toFixed(2),
          min: Math.min(...nums),
          max: Math.max(...nums)
        };
      } else {
        dataTypes[col] = 'text';
        const unique = new Set(values);
        summary[col] = {
          unique_values: unique.size,
          most_common: [...unique].slice(0, 3).join(', ')
        };
      }
    });

    const preview = records.slice(0, 10);

    return {
      success: true,
      text: content,
      columns,
      dataTypes,
      missingValues,
      summary,
      preview,
      rowCount: records.length,
      columnCount: columns.length
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};

const processFile = async (filePath, mimeType) => {
  const ext = path.extname(filePath).toLowerCase();

  if (ext === '.txt') return processTextFile(filePath);
  if (ext === '.pdf') return await processPdfFile(filePath);
  if (ext === '.docx' || ext === '.doc') return await processDocxFile(filePath);
  if (ext === '.csv') return processCsvFile(filePath);
  if (ext === '.json') {
    const result = processTextFile(filePath);
    if (result.success) {
      try {
        const parsed = JSON.parse(result.text);
        result.text = typeof parsed === 'object' ? JSON.stringify(parsed, null, 2) : result.text;
      } catch (e) {
        // not valid JSON, keep as text
      }
    }
    return result;
  }

  return processTextFile(filePath);
};

module.exports = { processFile, processCsvFile };
