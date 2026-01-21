import QRCode from "qrcode";
import { db } from "@/lib/db";

interface QREntryData {
  code: string;
  guestName: string;
  guestIdentityCard: string;
  eventName: string;
  eventDate: Date;
  tableName: string;
  sectorName: string;
}

interface AnonymousQRData {
  code: string;
  eventName: string;
  eventDate: Date;
  tableName: string;
  sectorName: string;
  qrNumber: number;
  totalQRs: number;
}

export function generateQRCode(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `QR-${timestamp}-${random}`;
}

export async function createQREntries(
  requestId: string,
  guestIds: string[],
  eventInfo: {
    name: string;
    eventDate: Date;
    tableName: string;
    sectorName: string;
  },
): Promise<QREntryData[]> {
  const qrEntries: QREntryData[] = [];

  for (const guestId of guestIds) {
    const code = generateQRCode();

    await db.qREntry.create({
      data: {
        id: crypto.randomUUID(),
        code,
        guestId,
        requestId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    const guest = await db.guest.findUnique({
      where: { id: guestId },
      select: {
        name: true,
        identityCard: true,
      },
    });

    if (guest) {
      qrEntries.push({
        code,
        guestName: guest.name,
        guestIdentityCard: guest.identityCard,
        eventName: eventInfo.name,
        eventDate: eventInfo.eventDate,
        tableName: eventInfo.tableName,
        sectorName: eventInfo.sectorName,
      });
    }
  }

  return qrEntries;
}

export async function createAnonymousQREntries(
  requestId: string,
  count: number,
  eventInfo: {
    name: string;
    eventDate: Date;
    tableName: string;
    sectorName: string;
  },
): Promise<AnonymousQRData[]> {
  const qrEntries: AnonymousQRData[] = [];

  const temporaryGuest = await db.guest.create({
    data: {
      id: crypto.randomUUID(),
      name: "Invitado Anónimo",
      identityCard: `TEMP-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  for (let i = 0; i < count; i++) {
    const code = generateQRCode();

    await db.qREntry.create({
      data: {
        id: crypto.randomUUID(),
        code,
        guestId: temporaryGuest.id,
        requestId,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    qrEntries.push({
      code,
      eventName: eventInfo.name,
      eventDate: eventInfo.eventDate,
      tableName: eventInfo.tableName,
      sectorName: eventInfo.sectorName,
      qrNumber: i + 1,
      totalQRs: count,
    });
  }

  return qrEntries;
}

export async function generateQRPDFContent(
  qrEntries: QREntryData[],
): Promise<string> {
  const qrImagesPromises = qrEntries.map(async (entry) => {
    try {
      const qrDataURL = await QRCode.toDataURL(entry.code, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      return { ...entry, qrImage: qrDataURL };
    } catch (error) {
      console.error("Error generating QR code:", error);
      return { ...entry, qrImage: "" };
    }
  });

  const qrEntriesWithImages = await Promise.all(qrImagesPromises);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-BO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const qrCardsHTML = qrEntriesWithImages
    .map(
      (entry, index) => `
    <div class="qr-card">
      <div class="qr-header">
        <h2>${entry.eventName}</h2>
        <p class="date">${formatDate(entry.eventDate)}</p>
      </div>
      
      <div class="qr-body">
        <div class="qr-image-container">
          ${
            entry.qrImage
              ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-image" />`
              : `<div class="qr-error">Error al generar QR</div>`
          }
        </div>
        
        <div class="guest-info">
          <div class="info-row">
            <span class="label">Invitado:</span>
            <span class="value">${entry.guestName}</span>
          </div>
          <div class="info-row">
            <span class="label">CI:</span>
            <span class="value">${entry.guestIdentityCard}</span>
          </div>
          <div class="info-row">
            <span class="label">Sector:</span>
            <span class="value">${entry.sectorName}</span>
          </div>
          <div class="info-row">
            <span class="label">Mesa:</span>
            <span class="value">${entry.tableName}</span>
          </div>
        </div>
      </div>
      
      <div class="qr-footer">
        <p class="code-text">Código: ${entry.code}</p>
        <p class="entry-number">Entrada #${index + 1} de ${qrEntriesWithImages.length}</p>
      </div>
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Códigos QR - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    min-height: 100vh;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .title-section {
    text-align: center;
    color: white;
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    backdrop-filter: blur(10px);
  }
  
  .title-section h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .title-section p {
    font-size: 1.2em;
    opacity: 0.9;
  }
  
  .qr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
  }
  
  .qr-card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    page-break-inside: avoid;
  }
  
  .qr-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  
  .qr-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    text-align: center;
  }
  
  .qr-header h2 {
    font-size: 1.5em;
    margin-bottom: 5px;
  }
  
  .qr-header .date {
    font-size: 0.9em;
    opacity: 0.9;
    text-transform: capitalize;
  }
  
  .qr-body {
    padding: 25px;
  }
  
  .qr-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
  }
  
  .qr-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  
  .qr-error {
    color: #dc3545;
    padding: 20px;
    text-align: center;
    font-weight: bold;
  }
  
  .guest-info {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 15px;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }
  
  .info-row:last-child {
    border-bottom: none;
  }
  
  .info-row .label {
    font-weight: 600;
    color: #6c757d;
  }
  
  .info-row .value {
    font-weight: 500;
    color: #212529;
    text-align: right;
  }
  
  .qr-footer {
    background: #f8f9fa;
    padding: 15px 20px;
    border-top: 2px solid #e9ecef;
    text-align: center;
  }
  
  .code-text {
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    color: #6c757d;
    margin-bottom: 5px;
    word-break: break-all;
  }
  
  .entry-number {
    font-size: 0.9em;
    color: #495057;
    font-weight: 600;
  }
  
  @media print {
    body {
      background: white;
      padding: 0;
    }
    
    .title-section {
      background: #667eea;
      color: white;
    }
    
    .qr-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .qr-card:hover {
      transform: none;
    }
    
    .qr-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
  }
  
  @media (max-width: 768px) {
    .qr-grid {
      grid-template-columns: 1fr;
    }
    
    .title-section h1 {
      font-size: 1.8em;
    }
    
    .title-section p {
      font-size: 1em;
    }
  }
  
  .print-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 50px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    z-index: 1000;
  }
  
  .print-button:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
  }
  
  @media print {
    .print-button {
      display: none;
    }
  }
</style>
</head>
<body>
<div class="container">
  <div class="title-section">
    <h1>JET CLUB - Códigos de Entrada</h1>
    <p>${qrEntriesWithImages[0]?.eventName || "Evento"}</p>
    <p>${qrEntriesWithImages.length} entrada${qrEntriesWithImages.length !== 1 ? "s" : ""}</p>
  </div>
  
  <div class="qr-grid">
    ${qrCardsHTML}
  </div>
</div>

<button class="print-button" onclick="window.print()">
  🖨️ Imprimir QR
</button>
</body>
</html>
  `;
}

export async function generateAnonymousQRPDFContent(
  qrEntries: AnonymousQRData[],
): Promise<string> {
  const qrImagesPromises = qrEntries.map(async (entry) => {
    try {
      const qrDataURL = await QRCode.toDataURL(entry.code, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      return { ...entry, qrImage: qrDataURL };
    } catch (error) {
      console.error("Error generating QR code:", error);
      return { ...entry, qrImage: "" };
    }
  });

  const qrEntriesWithImages = await Promise.all(qrImagesPromises);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-BO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const qrCardsHTML = qrEntriesWithImages
    .map(
      (entry) => `
    <div class="qr-card">
      <div class="qr-header">
        <h2>${entry.eventName}</h2>
        <p class="date">${formatDate(entry.eventDate)}</p>
      </div>
      
      <div class="qr-body">
        <div class="qr-image-container">
          ${
            entry.qrImage
              ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-image" />`
              : `<div class="qr-error">Error al generar QR</div>`
          }
        </div>
        
        <div class="guest-info">
          <div class="info-row">
            <span class="label">Sector:</span>
            <span class="value">${entry.sectorName}</span>
          </div>
          <div class="info-row">
            <span class="label">Mesa:</span>
            <span class="value">${entry.tableName}</span>
          </div>
        </div>
      </div>
      
      <div class="qr-footer">
        <p class="code-text">Código: ${entry.code}</p>
        <p class="entry-number">QR #${entry.qrNumber} de ${entry.totalQRs}</p>
      </div>
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Códigos QR - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    padding: 20px;
    min-height: 100vh;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .title-section {
    text-align: center;
    color: white;
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    backdrop-filter: blur(10px);
  }
  
  .title-section h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .title-section p {
    font-size: 1.2em;
    opacity: 0.9;
  }
  
  .qr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
  }
  
  .qr-card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    page-break-inside: avoid;
  }
  
  .qr-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  
  .qr-header {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    text-align: center;
  }
  
  .qr-header h2 {
    font-size: 1.5em;
    margin-bottom: 5px;
  }
  
  .qr-header .date {
    font-size: 0.9em;
    opacity: 0.9;
    text-transform: capitalize;
  }
  
  .qr-body {
    padding: 25px;
  }
  
  .qr-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #f8f9fa;
    border-radius: 10px;
  }
  
  .qr-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  
  .qr-error {
    color: #dc3545;
    padding: 20px;
    text-align: center;
    font-weight: bold;
  }
  
  .guest-info {
    background: #f8f9fa;
    border-radius: 10px;
    padding: 15px;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #e9ecef;
  }
  
  .info-row:last-child {
    border-bottom: none;
  }
  
  .info-row .label {
    font-weight: 600;
    color: #6c757d;
  }
  
  .info-row .value {
    font-weight: 500;
    color: #212529;
    text-align: right;
  }
  
  .qr-footer {
    background: #f8f9fa;
    padding: 15px 20px;
    border-top: 2px solid #e9ecef;
    text-align: center;
  }
  
  .code-text {
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    color: #6c757d;
    margin-bottom: 5px;
    word-break: break-all;
  }
  
  .entry-number {
    font-size: 0.9em;
    color: #495057;
    font-weight: 600;
  }
  
  @media print {
    body {
      background: white;
      padding: 0;
    }
    
    .title-section {
      background: #667eea;
      color: white;
    }
    
    .qr-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .qr-card:hover {
      transform: none;
    }
    
    .qr-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
  }
  
  @media (max-width: 768px) {
    .qr-grid {
      grid-template-columns: 1fr;
    }
    
    .title-section h1 {
      font-size: 1.8em;
    }
    
    .title-section p {
      font-size: 1em;
    }
  }
  
  .print-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 50px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
    transition: all 0.3s ease;
    z-index: 1000;
  }
  
  .print-button:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
  }
  
  @media print {
    .print-button {
      display: none;
    }
  }
</style>
</head>
<body>
<div class="container">
  <div class="title-section">
    <h1>JET CLUB - Códigos de Entrada</h1>
    <p>${qrEntriesWithImages[0]?.eventName || "Evento"}</p>
    <p>${qrEntriesWithImages.length} entrada${qrEntriesWithImages.length !== 1 ? "s" : ""}</p>
  </div>
  
  <div class="qr-grid">
    ${qrCardsHTML}
  </div>
</div>

<button class="print-button" onclick="window.print()">
  🖨️ Imprimir QR
</button>
</body>
</html>
  `;
}

export async function generateFreeQRPDFContent(
  qrEntries: AnonymousQRData[],
): Promise<string> {
  const qrImagesPromises = qrEntries.map(async (entry) => {
    try {
      const qrDataURL = await QRCode.toDataURL(entry.code, {
        width: 300,
        margin: 2,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      });
      return { ...entry, qrImage: qrDataURL };
    } catch (error) {
      console.error("Error generating QR code:", error);
      return { ...entry, qrImage: "" };
    }
  });

  const qrEntriesWithImages = await Promise.all(qrImagesPromises);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-BO", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(new Date(date));
  };

  const qrCardsHTML = qrEntriesWithImages
    .map(
      (entry) => `
    <div class="qr-card">
      <div class="qr-header free">
        <h2>${entry.eventName}</h2>
        <p class="date">${formatDate(entry.eventDate)}</p>
        <div class="warning-badge">⚠️ PROHIBIDA LA VENTA</div>
      </div>
      
      <div class="qr-body">
        <div class="qr-image-container">
          ${
            entry.qrImage
              ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-image" />`
              : `<div class="qr-error">Error al generar QR</div>`
          }
        </div>
        
        <div class="guest-info free">
          <div class="free-notice">
            <strong>🎁 ENTRADA GRATUITA</strong>
            <p>Este código QR es un regalo y no debe ser vendido</p>
          </div>
          <div class="info-row">
            <span class="label">Sector:</span>
            <span class="value">${entry.sectorName}</span>
          </div>
          <div class="info-row">
            <span class="label">Mesa:</span>
            <span class="value">${entry.tableName}</span>
          </div>
        </div>
      </div>
      
      <div class="qr-footer free">
        <p class="code-text">Código: ${entry.code}</p>
        <p class="entry-number">QR GRATIS #${entry.qrNumber} de ${entry.totalQRs}</p>
      </div>
    </div>
  `,
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Códigos QR GRATIS - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  
  body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
    padding: 20px;
    min-height: 100vh;
  }
  
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
  
  .title-section {
    text-align: center;
    color: white;
    margin-bottom: 30px;
    padding: 20px;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 15px;
    backdrop-filter: blur(10px);
  }
  
  .title-section h1 {
    font-size: 2.5em;
    margin-bottom: 10px;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
  }
  
  .title-section p {
    font-size: 1.2em;
    opacity: 0.9;
  }
  
  .warning-badge {
    background: #dc3545;
    color: white;
    padding: 10px 20px;
    border-radius: 25px;
    margin-top: 10px;
    font-weight: bold;
    font-size: 1.1em;
    display: inline-block;
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }
  
  .qr-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 25px;
    margin-bottom: 30px;
  }
  
  .qr-card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    page-break-inside: avoid;
    border: 3px solid #feca57;
  }
  
  .qr-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
  }
  
  .qr-header.free {
    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
    color: white;
    padding: 20px;
    text-align: center;
  }
  
  .qr-header h2 {
    font-size: 1.5em;
    margin-bottom: 5px;
  }
  
  .qr-header .date {
    font-size: 0.9em;
    opacity: 0.9;
    text-transform: capitalize;
  }
  
  .qr-body {
    padding: 25px;
  }
  
  .qr-image-container {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    padding: 15px;
    background: #fff3cd;
    border-radius: 10px;
    border: 2px dashed #feca57;
  }
  
  .qr-image {
    max-width: 100%;
    height: auto;
    border-radius: 8px;
  }
  
  .qr-error {
    color: #dc3545;
    padding: 20px;
    text-align: center;
    font-weight: bold;
  }
  
  .guest-info.free {
    background: #fff3cd;
    border-radius: 10px;
    padding: 15px;
    border: 2px solid #feca57;
  }
  
  .free-notice {
    background: #ff6b6b;
    color: white;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 15px;
    text-align: center;
  }
  
  .free-notice strong {
    font-size: 1.2em;
    display: block;
    margin-bottom: 5px;
  }
  
  .free-notice p {
    font-size: 0.9em;
    opacity: 0.95;
  }
  
  .info-row {
    display: flex;
    justify-content: space-between;
    padding: 8px 0;
    border-bottom: 1px solid #feca57;
  }
  
  .info-row:last-child {
    border-bottom: none;
  }
  
  .info-row .label {
    font-weight: 600;
    color: #856404;
  }
  
  .info-row .value {
    font-weight: 500;
    color: #212529;
    text-align: right;
  }
  
  .qr-footer.free {
    background: #fff3cd;
    padding: 15px 20px;
    border-top: 2px solid #feca57;
    text-align: center;
  }
  
  .code-text {
    font-family: 'Courier New', monospace;
    font-size: 0.85em;
    color: #856404;
    margin-bottom: 5px;
    word-break: break-all;
  }
  
  .entry-number {
    font-size: 0.9em;
    color: #ff6b6b;
    font-weight: 700;
  }
  
  @media print {
    body {
      background: white;
      padding: 0;
    }
    
    .title-section {
      background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
      color: white;
    }
    
    .qr-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 20px;
    }
    
    .qr-card:hover {
      transform: none;
    }
    
    .qr-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
  }
  
  @media (max-width: 768px) {
    .qr-grid {
      grid-template-columns: 1fr;
    }
    
    .title-section h1 {
      font-size: 1.8em;
    }
    
    .title-section p {
      font-size: 1em;
    }
  }
  
  .print-button {
    position: fixed;
    bottom: 30px;
    right: 30px;
    background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
    color: white;
    border: none;
    padding: 15px 30px;
    border-radius: 50px;
    font-size: 1.1em;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
    transition: all 0.3s ease;
    z-index: 1000;
  }
  
  .print-button:hover {
    transform: scale(1.05);
    box-shadow: 0 8px 30px rgba(255, 107, 107, 0.6);
  }
  
  @media print {
    .print-button {
      display: none;
    }
  }
</style>
</head>
<body>
<div class="container">
  <div class="title-section">
    <h1>JET CLUB - QR GRATUITOS</h1>
    <p>${qrEntriesWithImages[0]?.eventName || "Evento"}</p>
    <p>${qrEntriesWithImages.length} entrada${qrEntriesWithImages.length !== 1 ? "s" : ""} gratuita${qrEntriesWithImages.length !== 1 ? "s" : ""}</p>
    <div class="warning-badge">⚠️ PROHIBIDA LA VENTA</div>
  </div>
  
  <div class="qr-grid">
    ${qrCardsHTML}
  </div>
</div>

<button class="print-button" onclick="window.print()">
  🖨️ Imprimir QR Gratis
</button>
</body>
</html>
  `;
}
