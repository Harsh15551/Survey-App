// Lightweight client-side exports for the MVP/demo. In production, swap
// these for calls to a backend export endpoint (e.g. GET /api/exports?format=xlsx)
// that streams a real .xlsx (exceljs) or .pdf (puppeteer/pdfkit) file — that
// gives you formatting, multi-sheet workbooks, and server-side audit logging
// of every export, which a browser-only CSV can't do.

export function exportHouseholdsToCsv(households, filename = 'households-export.csv') {
  const headers = [
    'House ID', 'Head name', 'Phone', 'District', 'Taluk', 'Age', 'Gender',
    'Family size', 'Occupation', 'Income bracket', 'Latitude', 'Longitude',
    'Problems', 'Grievance', 'Schemes', 'Scheme feedback', 'Status', 'Surveyed on'
  ]
  const rows = households.map(h => [
    h.houseCode || h.houseId, h.headName, h.phone, h.district, h.taluk, h.age, h.gender,
    h.familySize, h.occupation, h.incomeBracket, h.latitude, h.longitude,
    h.problems.join('; '), h.grievanceDescription, h.schemes.join('; '),
    h.schemeFeedback, h.status, new Date(h.createdAt).toLocaleDateString()
  ])

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function exportHouseholdsToPdf(households) {
  // Opens a print-formatted view; "Save as PDF" in the browser print dialog.
  const win = window.open('', '_blank')
  const rows = households.map(h => `
    <tr>
      <td>${h.houseCode || h.houseId}</td><td>${h.headName}</td><td>${h.phone}</td>
      <td>${h.district}, ${h.taluk}</td><td>${h.familySize}</td>
      <td>${h.problems.join(', ')}</td><td>${h.status}</td>
    </tr>`).join('')

  win.document.write(`
    <html>
      <head>
        <title>Household survey export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; text-align: left; }
          th { background: #f2f5f7; }
        </style>
      </head>
      <body>
        <h1>Household survey export — Gulbarga &amp; Bidar</h1>
        <p>Generated ${new Date().toLocaleString()} · ${households.length} households</p>
        <table>
          <thead><tr><th>House ID</th><th>Head name</th><th>Phone</th><th>Location</th><th>Family size</th><th>Problems</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `)
  win.document.close()
  win.print()
}
