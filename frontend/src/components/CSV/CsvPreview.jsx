export default function CsvPreview({ columns, rows }) {
  if (!columns || !rows || rows.length === 0) {
    return <div className="empty-state"><p>No data to preview</p></div>;
  }

  return (
    <div className="csv-preview">
      <div className="text-sm text-muted mb-8">
        Showing {rows.length} of {rows.length} rows | {columns.length} columns
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((col, i) => (
              <th key={i}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {columns.map((col, j) => (
                <td key={j}>{row[col] !== undefined ? String(row[col]) : ''}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
