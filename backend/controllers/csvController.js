const { query } = require('../config/db');
const { processCsvFile } = require('../services/fileProcessor');
const { getAIResponse } = require('../services/cerebrasAI');
const { commandParser } = require('../services/commandParser');

const uploadCsv = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No CSV file uploaded.' });
    }

    const file = req.file;
    const processed = processCsvFile(file.path);

    if (!processed.success) {
      return res.status(400).json({ error: processed.error || 'Failed to process CSV.' });
    }

    const fileResult = await query(
      'INSERT INTO uploaded_files (user_id, filename, original_name, mime_type, size, storage_path) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, file.filename, file.originalname, file.mimetype, file.size, file.path]
    );

    const result = await query(
      'INSERT INTO csv_datasets (user_id, file_id, filename, columns, row_count, preview_data, summary) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [
        req.user.id,
        fileResult.insertId,
        file.originalname,
        JSON.stringify(processed.columns),
        processed.rowCount,
        JSON.stringify(processed.preview),
        JSON.stringify({ dataTypes: processed.dataTypes, missingValues: processed.missingValues, stats: processed.summary })
      ]
    );

    await query(
      'INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)',
      [req.user.id, 'csv_uploaded', JSON.stringify({ dataset_id: result.insertId, name: file.originalname, rows: processed.rowCount })]
    );

    res.status(201).json({
      dataset: {
        id: result.insertId,
        filename: file.originalname,
        columns: processed.columns,
        rowCount: processed.rowCount,
        columnCount: processed.columnCount,
        preview: processed.preview,
        dataTypes: processed.dataTypes,
        missingValues: processed.missingValues,
        summary: processed.summary
      }
    });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const datasets = await query(
      'SELECT id, filename, columns, row_count, preview_data, summary, created_at FROM csv_datasets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (datasets.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const dataset = datasets[0];
    res.json({
      dataset: {
        id: dataset.id,
        filename: dataset.filename,
        columns: JSON.parse(dataset.columns),
        rowCount: dataset.row_count,
        preview: JSON.parse(dataset.preview_data),
        summary: JSON.parse(dataset.summary)
      }
    });
  } catch (err) {
    next(err);
  }
};

const askCsv = async (req, res, next) => {
  try {
    const { question } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ error: 'Question is required.' });
    }

    const datasets = await query(
      'SELECT id, filename, columns, row_count, preview_data, summary FROM csv_datasets WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (datasets.length === 0) {
      return res.status(404).json({ error: 'Dataset not found.' });
    }

    const dataset = datasets[0];
    const summary = JSON.parse(dataset.summary);
    const preview = JSON.parse(dataset.preview_data);

    const context = `CSV File: ${dataset.filename}
Columns: ${dataset.columns}
Row Count: ${dataset.row_count}
Data Types: ${JSON.stringify(summary.dataTypes)}
Missing Values: ${JSON.stringify(summary.missingValues)}
Statistics: ${JSON.stringify(summary.stats)}
Preview (first 10 rows): ${JSON.stringify(preview, null, 2)}

User Question: ${question}`;

    const memories = await query('SELECT content, category FROM memories WHERE user_id = ? ORDER BY created_at DESC LIMIT 10', [req.user.id]);
    const aiResponse = await getAIResponse({
      message: context,
      memories,
      fileContext: `The user is asking about their CSV dataset "${dataset.filename}". The dataset has ${dataset.row_count} rows and columns: ${dataset.columns}.`
    });

    res.json({
      answer: aiResponse.message,
      emotion: aiResponse.emotion
    });
  } catch (err) {
    next(err);
  }
};

const getDatasets = async (req, res, next) => {
  try {
    const datasets = await query(
      'SELECT id, filename, row_count, created_at FROM csv_datasets WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ datasets });
  } catch (err) {
    next(err);
  }
};

const deleteDataset = async (req, res, next) => {
  try {
    await query('DELETE FROM csv_datasets WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ message: 'Dataset deleted.' });
  } catch (err) {
    next(err);
  }
};

module.exports = { uploadCsv, getSummary, askCsv, getDatasets, deleteDataset };
