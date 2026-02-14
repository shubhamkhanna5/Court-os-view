
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { SagaData } from '../context/ViewerContext';

export const generateSagaPDF = (data: SagaData) => {
  // 1. Initialize Document
  const doc = new jsPDF();
  
  // 2. Title Section
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text("SAIYAN SAGA – OFFICIAL STANDINGS REPORT", 14, 20);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 14, 28);
  
  // 3. League Summary
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text("League Summary", 14, 40);
  
  const totalMatches = data.leagueStats?.totalMatches || 0;
  
  // 60% Rule: Use pre-calculated minRequired if available (based on max games played), 
  // otherwise fallback to calculating based on max played from standings.
  // Note: calculating 60% of *totalMatches* is incorrect for eligibility in pair leagues.
  let minRequired = data.leagueStats?.minRequired;
  
  if (minRequired === undefined) {
      const maxPlayed = Math.max(...(data.standings || []).map(p => p.played), 0);
      minRequired = Math.ceil(maxPlayed * 0.6);
  }
  
  autoTable(doc, {
    startY: 45,
    head: [['Metric', 'Value']],
    body: [
      ['Total Matches Played (No Walkovers)', totalMatches],
      ['Minimum Required (60% of Max Played)', minRequired],
      ['Total Fighters', data.standings?.length || 0],
    ],
    theme: 'grid',
    headStyles: { fillColor: [220, 220, 220], textColor: 0, fontStyle: 'bold' },
    styles: { textColor: 0 },
    columnStyles: { 0: { cellWidth: 100 } }
  });
  
  let finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // 4. Top 3 Section
  doc.text("Top 3 (Based on PPG)", 14, finalY);
  
  const top3 = (data.standings || []).slice(0, 3);
  const top3Rows = top3.map((p, i) => [
    i + 1,
    p.name,
    p.ppg.toFixed(2),
    `${p.wins}-${p.losses || 0}`,
    p.played
  ]);
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [['Rank', 'Fighter', 'PPG', 'W-L', 'Matches']],
    body: top3Rows,
    theme: 'striped',
    headStyles: { fillColor: [0, 0, 0], textColor: 255 },
    styles: { halign: 'center' },
    columnStyles: { 
        1: { halign: 'left' } 
    }
  });
  
  finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // 5. Full Standings
  doc.text("Full Standings (Sorted by PPG)", 14, finalY);
  
  const fullRows = (data.standings || []).map((p, i) => [
    i + 1,
    p.name,
    p.ppg.toFixed(2),
    `${p.wins}-${p.losses || 0}`,
    p.played,
    p.points || 0
  ]);
  
  autoTable(doc, {
    startY: finalY + 5,
    head: [['Rank', 'Fighter', 'PPG', 'W-L', 'Matches', 'Total Points']],
    body: fullRows,
    theme: 'striped',
    headStyles: { fillColor: [40, 40, 40], textColor: 255 },
    styles: { halign: 'center' },
    columnStyles: { 
        1: { halign: 'left' } 
    }
  });
  
  finalY = (doc as any).lastAutoTable.finalY + 15;
  
  // 6. Below 60% Rule
  doc.text("Below 60% Participation", 14, finalY);
  
  const belowThreshold = (data.standings || []).filter(p => p.played < minRequired!);
  
  if (belowThreshold.length > 0) {
    const belowRows = belowThreshold.map(p => [p.name, p.played, minRequired]);
    autoTable(doc, {
      startY: finalY + 5,
      head: [['Fighter', 'Matches Played', 'Required']],
      body: belowRows,
      theme: 'grid',
      headStyles: { fillColor: [200, 50, 50], textColor: 255 },
      styles: { halign: 'center' },
      columnStyles: { 0: { halign: 'left' } }
    });
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.text("All active fighters meet the 60% rule.", 14, finalY + 10);
  }
  
  // 7. Save
  doc.save('saiyan_saga_standings.pdf');
};
