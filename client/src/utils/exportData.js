export function exportHouseholdsToCsv(households, filename = 'households-export.csv') {
  const headers = [
    'House ID', 'Head name', 'Phone', 'Email', 'State', 'District', 'Taluk',
    'Village', 'Ward/Panchayat', 'House number', 'Property type',
    'Head age', 'Family size band', 'Occupation', 'Income bracket',
    'Facilities', 'Latitude', 'Longitude',
    'Problems', 'Grievance', 'Govt schemes', 'Status', 'Surveyed on'
  ]
  const rows = households.map(h => [
    h.houseCode || h.houseId, h.headName, h.phone, h.email || '', h.state || '',
    h.district, h.taluk, h.villageName || '', h.wardPanchayat || '', h.houseNumber || '',
    h.propertyType || '', h.headAge ?? '', h.familySizeBand || h.familySize || '',
    h.occupation || '', h.incomeBracket || '', (h.facilities || []).join('; '),
    h.latitude ?? '', h.longitude ?? '',
    (h.problems || []).join('; '), h.grievanceDescription || '',
    (h.govtSchemesAvailed || []).join('; '), h.status,
    h.createdAt ? new Date(h.createdAt).toLocaleDateString() : ''
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
  const win = window.open('', '_blank')
  const rows = households.map(h => `
    <tr>
      <td>${h.houseCode || h.houseId}</td><td>${h.headName}</td><td>${h.phone}</td>
      <td>${h.villageName || '—'}, ${h.taluk}, ${h.district}</td>
      <td>${h.familySizeBand || h.familySize || '—'}</td>
      <td>${(h.problems || []).join(', ')}</td><td>${h.status}</td>
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
          <thead><tr><th>House ID</th><th>Head name</th><th>Phone</th><th>Location</th><th>Family</th><th>Problems</th><th>Status</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `)
  win.document.close()
  win.print()
}

export function exportGrievancesToCsv(grievances, filename = 'grievances-export.csv') {
  const headers = [
    'House ID', 'Head name', 'District', 'Taluk', 'Ward/Panchayat',
    'Field agent', 'Grievance', 'Status', 'Raised on'
  ]
  const rows = grievances.map(g => [
    g.houseCode, g.headName, g.district, g.taluk, g.wardPanchayat,
    g.fieldAgentName, g.message, g.status === 'OPEN' ? 'Not resolved' : 'Resolved',
    new Date(g.createdAt).toLocaleDateString()
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

export function exportGrievancesToPdf(grievances) {
  const win = window.open('', '_blank')
  const rows = grievances.map(g => `
    <tr>
      <td>${g.houseCode}</td><td>${g.headName}</td>
      <td>${g.taluk}, ${g.district}</td><td>${g.fieldAgentName || '—'}</td>
      <td>${g.message}</td><td>${g.status === 'OPEN' ? 'Not resolved' : 'Resolved'}</td>
      <td>${new Date(g.createdAt).toLocaleDateString()}</td>
    </tr>`).join('')

  win.document.write(`
    <html>
      <head>
        <title>Citizen grievances export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 24px; }
          h1 { font-size: 18px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th, td { border: 1px solid #ccc; padding: 6px 8px; font-size: 12px; text-align: left; }
          th { background: #f2f5f7; }
        </style>
      </head>
      <body>
        <h1>Citizen grievances export — Gulbarga &amp; Bidar</h1>
        <p>Generated ${new Date().toLocaleString()} · ${grievances.length} grievances</p>
        <table>
          <thead><tr><th>House ID</th><th>Head name</th><th>Location</th><th>Field agent</th><th>Grievance</th><th>Status</th><th>Raised on</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `)
  win.document.close()
  win.print()
}
