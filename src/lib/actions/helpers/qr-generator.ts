// import QRCode from "qrcode";
// import { db } from "@/lib/db";

// interface QREntryData {
//   code: string;
//   guestName: string;
//   guestIdentityCard: string;
//   eventName: string;
//   eventDate: Date;
//   tableName: string;
//   sectorName: string;
// }

// interface AnonymousQRData {
//   code: string;
//   eventName: string;
//   eventDate: Date;
//   tableName: string;
//   sectorName: string;
//   qrNumber: number;
//   totalQRs: number;
// }

// export function generateQRCode(): string {
//   const timestamp = Date.now();
//   const random = Math.random().toString(36).substring(2, 15);
//   return `QR-${timestamp}-${random}`;
// }

// export async function createQREntries(
//   requestId: string,
//   guestIds: string[],
//   eventInfo: {
//     name: string;
//     eventDate: Date;
//     tableName: string;
//     sectorName: string;
//   },
// ): Promise<QREntryData[]> {
//   const qrEntries: QREntryData[] = [];

//   for (const guestId of guestIds) {
//     const code = generateQRCode();

//     await db.qREntry.create({
//       data: {
//         id: crypto.randomUUID(),
//         code,
//         guestId,
//         requestId,
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     const guest = await db.guest.findUnique({
//       where: { id: guestId },
//       select: {
//         name: true,
//         identityCard: true,
//       },
//     });

//     if (guest) {
//       qrEntries.push({
//         code,
//         guestName: guest.name,
//         guestIdentityCard: guest.identityCard,
//         eventName: eventInfo.name,
//         eventDate: eventInfo.eventDate,
//         tableName: eventInfo.tableName,
//         sectorName: eventInfo.sectorName,
//       });
//     }
//   }

//   return qrEntries;
// }

// export async function createAnonymousQREntries(
//   requestId: string,
//   count: number,
//   eventInfo: {
//     name: string;
//     eventDate: Date;
//     tableName: string;
//     sectorName: string;
//   },
// ): Promise<AnonymousQRData[]> {
//   const qrEntries: AnonymousQRData[] = [];

//   const temporaryGuest = await db.guest.create({
//     data: {
//       id: crypto.randomUUID(),
//       name: "Invitado Anónimo",
//       identityCard: `TEMP-${Date.now()}`,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//   });

//   for (let i = 0; i < count; i++) {
//     const code = generateQRCode();

//     await db.qREntry.create({
//       data: {
//         id: crypto.randomUUID(),
//         code,
//         guestId: temporaryGuest.id,
//         requestId,
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     qrEntries.push({
//       code,
//       eventName: eventInfo.name,
//       eventDate: eventInfo.eventDate,
//       tableName: eventInfo.tableName,
//       sectorName: eventInfo.sectorName,
//       qrNumber: i + 1,
//       totalQRs: count,
//     });
//   }

//   return qrEntries;
// }

// export async function generateQRPDFContent(
//   qrEntries: QREntryData[],
// ): Promise<string> {
//   const qrImagesPromises = qrEntries.map(async (entry) => {
//     try {
//       const qrDataURL = await QRCode.toDataURL(entry.code, {
//         width: 300,
//         margin: 2,
//         color: {
//           dark: "#000000",
//           light: "#FFFFFF",
//         },
//       });
//       return { ...entry, qrImage: qrDataURL };
//     } catch (error) {
//       console.error("Error generating QR code:", error);
//       return { ...entry, qrImage: "" };
//     }
//   });

//   const qrEntriesWithImages = await Promise.all(qrImagesPromises);

//   const formatDate = (date: Date) => {
//     return new Intl.DateTimeFormat("es-BO", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     }).format(new Date(date));
//   };

//   const qrCardsHTML = qrEntriesWithImages
//     .map(
//       (entry, index) => `
//     <div class="qr-card">
//       <div class="qr-header">
//         <h2>${entry.eventName}</h2>
//         <p class="date">${formatDate(entry.eventDate)}</p>
//       </div>

//       <div class="qr-body">
//         <div class="qr-image-container">
//           ${
//             entry.qrImage
//               ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-image" />`
//               : `<div class="qr-error">Error al generar QR</div>`
//           }
//         </div>

//         <div class="guest-info">
//           <div class="info-row">
//             <span class="label">Invitado:</span>
//             <span class="value">${entry.guestName}</span>
//           </div>
//           <div class="info-row">
//             <span class="label">CI:</span>
//             <span class="value">${entry.guestIdentityCard}</span>
//           </div>
//           <div class="info-row">
//             <span class="label">Sector:</span>
//             <span class="value">${entry.sectorName}</span>
//           </div>
//           <div class="info-row">
//             <span class="label">Mesa:</span>
//             <span class="value">${entry.tableName}</span>
//           </div>
//         </div>
//       </div>

//       <div class="qr-footer">
//         <p class="code-text">Código: ${entry.code}</p>
//         <p class="entry-number">Entrada #${index + 1} de ${qrEntriesWithImages.length}</p>
//       </div>
//     </div>
//   `,
//     )
//     .join("");

//   return `
// <!DOCTYPE html>
// <html lang="es">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>Códigos QR - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
// <style>
//   * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//   }

//   body {
//     font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     padding: 20px;
//     min-height: 100vh;
//   }

//   .container {
//     max-width: 1200px;
//     margin: 0 auto;
//   }

//   .title-section {
//     text-align: center;
//     color: white;
//     margin-bottom: 30px;
//     padding: 20px;
//     background: rgba(255, 255, 255, 0.1);
//     border-radius: 15px;
//     backdrop-filter: blur(10px);
//   }

//   .title-section h1 {
//     font-size: 2.5em;
//     margin-bottom: 10px;
//     text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
//   }

//   .title-section p {
//     font-size: 1.2em;
//     opacity: 0.9;
//   }

//   .qr-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
//     gap: 25px;
//     margin-bottom: 30px;
//   }

//   .qr-card {
//     background: white;
//     border-radius: 15px;
//     box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
//     overflow: hidden;
//     transition: transform 0.3s ease, box-shadow 0.3s ease;
//     page-break-inside: avoid;
//   }

//   .qr-card:hover {
//     transform: translateY(-5px);
//     box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
//   }

//   .qr-header {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     color: white;
//     padding: 20px;
//     text-align: center;
//   }

//   .qr-header h2 {
//     font-size: 1.5em;
//     margin-bottom: 5px;
//   }

//   .qr-header .date {
//     font-size: 0.9em;
//     opacity: 0.9;
//     text-transform: capitalize;
//   }

//   .qr-body {
//     padding: 25px;
//   }

//   .qr-image-container {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     margin-bottom: 20px;
//     padding: 15px;
//     background: #f8f9fa;
//     border-radius: 10px;
//   }

//   .qr-image {
//     max-width: 100%;
//     height: auto;
//     border-radius: 8px;
//   }

//   .qr-error {
//     color: #dc3545;
//     padding: 20px;
//     text-align: center;
//     font-weight: bold;
//   }

//   .guest-info {
//     background: #f8f9fa;
//     border-radius: 10px;
//     padding: 15px;
//   }

//   .info-row {
//     display: flex;
//     justify-content: space-between;
//     padding: 8px 0;
//     border-bottom: 1px solid #e9ecef;
//   }

//   .info-row:last-child {
//     border-bottom: none;
//   }

//   .info-row .label {
//     font-weight: 600;
//     color: #6c757d;
//   }

//   .info-row .value {
//     font-weight: 500;
//     color: #212529;
//     text-align: right;
//   }

//   .qr-footer {
//     background: #f8f9fa;
//     padding: 15px 20px;
//     border-top: 2px solid #e9ecef;
//     text-align: center;
//   }

//   .code-text {
//     font-family: 'Courier New', monospace;
//     font-size: 0.85em;
//     color: #6c757d;
//     margin-bottom: 5px;
//     word-break: break-all;
//   }

//   .entry-number {
//     font-size: 0.9em;
//     color: #495057;
//     font-weight: 600;
//   }

//   @media print {
//     body {
//       background: white;
//       padding: 0;
//     }

//     .title-section {
//       background: #667eea;
//       color: white;
//     }

//     .qr-card {
//       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
//       margin-bottom: 20px;
//     }

//     .qr-card:hover {
//       transform: none;
//     }

//     .qr-grid {
//       grid-template-columns: repeat(2, 1fr);
//       gap: 15px;
//     }
//   }

//   @media (max-width: 768px) {
//     .qr-grid {
//       grid-template-columns: 1fr;
//     }

//     .title-section h1 {
//       font-size: 1.8em;
//     }

//     .title-section p {
//       font-size: 1em;
//     }
//   }

//   .print-button {
//     position: fixed;
//     bottom: 30px;
//     right: 30px;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     color: white;
//     border: none;
//     padding: 15px 30px;
//     border-radius: 50px;
//     font-size: 1.1em;
//     font-weight: 600;
//     cursor: pointer;
//     box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
//     transition: all 0.3s ease;
//     z-index: 1000;
//   }

//   .print-button:hover {
//     transform: scale(1.05);
//     box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
//   }

//   @media print {
//     .print-button {
//       display: none;
//     }
//   }
// </style>
// </head>
// <body>
// <div class="container">
//   <div class="title-section">
//     <h1>JET CLUB - Códigos de Entrada</h1>
//     <p>${qrEntriesWithImages[0]?.eventName || "Evento"}</p>
//     <p>${qrEntriesWithImages.length} entrada${qrEntriesWithImages.length !== 1 ? "s" : ""}</p>
//   </div>

//   <div class="qr-grid">
//     ${qrCardsHTML}
//   </div>
// </div>

// <button class="print-button" onclick="window.print()">
//   🖨️ Imprimir QR
// </button>
// </body>
// </html>
//   `;
// }

// export async function generateAnonymousQRPDFContent(
//   qrEntries: AnonymousQRData[],
// ): Promise<string> {
//   const qrImagesPromises = qrEntries.map(async (entry) => {
//     try {
//       const qrDataURL = await QRCode.toDataURL(entry.code, {
//         width: 300,
//         margin: 2,
//         color: {
//           dark: "#000000",
//           light: "#FFFFFF",
//         },
//       });
//       return { ...entry, qrImage: qrDataURL };
//     } catch (error) {
//       console.error("Error generating QR code:", error);
//       return { ...entry, qrImage: "" };
//     }
//   });

//   const qrEntriesWithImages = await Promise.all(qrImagesPromises);

//   const formatDate = (date: Date) => {
//     return new Intl.DateTimeFormat("es-BO", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     }).format(new Date(date));
//   };

//   const qrCardsHTML = qrEntriesWithImages
//     .map(
//       (entry) => `
//     <div class="qr-card">
//       <div class="qr-header">
//         <h2>${entry.eventName}</h2>
//         <p class="date">${formatDate(entry.eventDate)}</p>
//       </div>

//       <div class="qr-body">
//         <div class="qr-image-container">
//           ${
//             entry.qrImage
//               ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-image" />`
//               : `<div class="qr-error">Error al generar QR</div>`
//           }
//         </div>

//         <div class="guest-info">
//           <div class="info-row">
//             <span class="label">Sector:</span>
//             <span class="value">${entry.sectorName}</span>
//           </div>
//           <div class="info-row">
//             <span class="label">Mesa:</span>
//             <span class="value">${entry.tableName}</span>
//           </div>
//         </div>
//       </div>

//       <div class="qr-footer">
//         <p class="code-text">Código: ${entry.code}</p>
//         <p class="entry-number">QR #${entry.qrNumber} de ${entry.totalQRs}</p>
//       </div>
//     </div>
//   `,
//     )
//     .join("");

//   return `
// <!DOCTYPE html>
// <html lang="es">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>Códigos QR - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
// <style>
//   * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//   }

//   body {
//     font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     padding: 20px;
//     min-height: 100vh;
//   }

//   .container {
//     max-width: 1200px;
//     margin: 0 auto;
//   }

//   .title-section {
//     text-align: center;
//     color: white;
//     margin-bottom: 30px;
//     padding: 20px;
//     background: rgba(255, 255, 255, 0.1);
//     border-radius: 15px;
//     backdrop-filter: blur(10px);
//   }

//   .title-section h1 {
//     font-size: 2.5em;
//     margin-bottom: 10px;
//     text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
//   }

//   .title-section p {
//     font-size: 1.2em;
//     opacity: 0.9;
//   }

//   .qr-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
//     gap: 25px;
//     margin-bottom: 30px;
//   }

//   .qr-card {
//     background: white;
//     border-radius: 15px;
//     box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
//     overflow: hidden;
//     transition: transform 0.3s ease, box-shadow 0.3s ease;
//     page-break-inside: avoid;
//   }

//   .qr-card:hover {
//     transform: translateY(-5px);
//     box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
//   }

//   .qr-header {
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     color: white;
//     padding: 20px;
//     text-align: center;
//   }

//   .qr-header h2 {
//     font-size: 1.5em;
//     margin-bottom: 5px;
//   }

//   .qr-header .date {
//     font-size: 0.9em;
//     opacity: 0.9;
//     text-transform: capitalize;
//   }

//   .qr-body {
//     padding: 25px;
//   }

//   .qr-image-container {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     margin-bottom: 20px;
//     padding: 15px;
//     background: #f8f9fa;
//     border-radius: 10px;
//   }

//   .qr-image {
//     max-width: 100%;
//     height: auto;
//     border-radius: 8px;
//   }

//   .qr-error {
//     color: #dc3545;
//     padding: 20px;
//     text-align: center;
//     font-weight: bold;
//   }

//   .guest-info {
//     background: #f8f9fa;
//     border-radius: 10px;
//     padding: 15px;
//   }

//   .info-row {
//     display: flex;
//     justify-content: space-between;
//     padding: 8px 0;
//     border-bottom: 1px solid #e9ecef;
//   }

//   .info-row:last-child {
//     border-bottom: none;
//   }

//   .info-row .label {
//     font-weight: 600;
//     color: #6c757d;
//   }

//   .info-row .value {
//     font-weight: 500;
//     color: #212529;
//     text-align: right;
//   }

//   .qr-footer {
//     background: #f8f9fa;
//     padding: 15px 20px;
//     border-top: 2px solid #e9ecef;
//     text-align: center;
//   }

//   .code-text {
//     font-family: 'Courier New', monospace;
//     font-size: 0.85em;
//     color: #6c757d;
//     margin-bottom: 5px;
//     word-break: break-all;
//   }

//   .entry-number {
//     font-size: 0.9em;
//     color: #495057;
//     font-weight: 600;
//   }

//   @media print {
//     body {
//       background: white;
//       padding: 0;
//     }

//     .title-section {
//       background: #667eea;
//       color: white;
//     }

//     .qr-card {
//       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
//       margin-bottom: 20px;
//     }

//     .qr-card:hover {
//       transform: none;
//     }

//     .qr-grid {
//       grid-template-columns: repeat(2, 1fr);
//       gap: 15px;
//     }
//   }

//   @media (max-width: 768px) {
//     .qr-grid {
//       grid-template-columns: 1fr;
//     }

//     .title-section h1 {
//       font-size: 1.8em;
//     }

//     .title-section p {
//       font-size: 1em;
//     }
//   }

//   .print-button {
//     position: fixed;
//     bottom: 30px;
//     right: 30px;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//     color: white;
//     border: none;
//     padding: 15px 30px;
//     border-radius: 50px;
//     font-size: 1.1em;
//     font-weight: 600;
//     cursor: pointer;
//     box-shadow: 0 5px 20px rgba(102, 126, 234, 0.4);
//     transition: all 0.3s ease;
//     z-index: 1000;
//   }

//   .print-button:hover {
//     transform: scale(1.05);
//     box-shadow: 0 8px 30px rgba(102, 126, 234, 0.6);
//   }

//   @media print {
//     .print-button {
//       display: none;
//     }
//   }
// </style>
// </head>
// <body>
// <div class="container">
//   <div class="title-section">
//     <h1>JET CLUB - Códigos de Entrada</h1>
//     <p>${qrEntriesWithImages[0]?.eventName || "Evento"}</p>
//     <p>${qrEntriesWithImages.length} entrada${qrEntriesWithImages.length !== 1 ? "s" : ""}</p>
//   </div>

//   <div class="qr-grid">
//     ${qrCardsHTML}
//   </div>
// </div>

// <button class="print-button" onclick="window.print()">
//   🖨️ Imprimir QR
// </button>
// </body>
// </html>
//   `;
// }

// export async function generateFreeQRPDFContent(
//   qrEntries: AnonymousQRData[],
// ): Promise<string> {
//   const qrImagesPromises = qrEntries.map(async (entry) => {
//     try {
//       const qrDataURL = await QRCode.toDataURL(entry.code, {
//         width: 300,
//         margin: 2,
//         color: {
//           dark: "#000000",
//           light: "#FFFFFF",
//         },
//       });
//       return { ...entry, qrImage: qrDataURL };
//     } catch (error) {
//       console.error("Error generating QR code:", error);
//       return { ...entry, qrImage: "" };
//     }
//   });

//   const qrEntriesWithImages = await Promise.all(qrImagesPromises);

//   const formatDate = (date: Date) => {
//     return new Intl.DateTimeFormat("es-BO", {
//       weekday: "long",
//       year: "numeric",
//       month: "long",
//       day: "numeric",
//     }).format(new Date(date));
//   };

//   const qrCardsHTML = qrEntriesWithImages
//     .map(
//       (entry) => `
//     <div class="qr-card">
//       <div class="qr-header free">
//         <h2>${entry.eventName}</h2>
//         <p class="date">${formatDate(entry.eventDate)}</p>
//         <div class="warning-badge">⚠️ PROHIBIDA LA VENTA</div>
//       </div>

//       <div class="qr-body">
//         <div class="qr-image-container">
//           ${
//             entry.qrImage
//               ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-image" />`
//               : `<div class="qr-error">Error al generar QR</div>`
//           }
//         </div>

//         <div class="guest-info free">
//           <div class="free-notice">
//             <strong>🎁 ENTRADA GRATUITA</strong>
//             <p>Este código QR es un regalo y no debe ser vendido</p>
//           </div>
//           <div class="info-row">
//             <span class="label">Sector:</span>
//             <span class="value">${entry.sectorName}</span>
//           </div>
//           <div class="info-row">
//             <span class="label">Mesa:</span>
//             <span class="value">${entry.tableName}</span>
//           </div>
//         </div>
//       </div>

//       <div class="qr-footer free">
//         <p class="code-text">Código: ${entry.code}</p>
//         <p class="entry-number">QR GRATIS #${entry.qrNumber} de ${entry.totalQRs}</p>
//       </div>
//     </div>
//   `,
//     )
//     .join("");

//   return `
// <!DOCTYPE html>
// <html lang="es">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>Códigos QR GRATIS - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
// <style>
//   * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//   }

//   body {
//     font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//     padding: 20px;
//     min-height: 100vh;
//   }

//   .container {
//     max-width: 1200px;
//     margin: 0 auto;
//   }

//   .title-section {
//     text-align: center;
//     color: white;
//     margin-bottom: 30px;
//     padding: 20px;
//     background: rgba(255, 255, 255, 0.1);
//     border-radius: 15px;
//     backdrop-filter: blur(10px);
//   }

//   .title-section h1 {
//     font-size: 2.5em;
//     margin-bottom: 10px;
//     text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
//   }

//   .title-section p {
//     font-size: 1.2em;
//     opacity: 0.9;
//   }

//   .warning-badge {
//     background: #dc3545;
//     color: white;
//     padding: 10px 20px;
//     border-radius: 25px;
//     margin-top: 10px;
//     font-weight: bold;
//     font-size: 1.1em;
//     display: inline-block;
//     box-shadow: 0 4px 8px rgba(0,0,0,0.2);
//   }

//   .qr-grid {
//     display: grid;
//     grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
//     gap: 25px;
//     margin-bottom: 30px;
//   }

//   .qr-card {
//     background: white;
//     border-radius: 15px;
//     box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
//     overflow: hidden;
//     transition: transform 0.3s ease, box-shadow 0.3s ease;
//     page-break-inside: avoid;
//     border: 3px solid #feca57;
//   }

//   .qr-card:hover {
//     transform: translateY(-5px);
//     box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
//   }

//   .qr-header.free {
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//     color: white;
//     padding: 20px;
//     text-align: center;
//   }

//   .qr-header h2 {
//     font-size: 1.5em;
//     margin-bottom: 5px;
//   }

//   .qr-header .date {
//     font-size: 0.9em;
//     opacity: 0.9;
//     text-transform: capitalize;
//   }

//   .qr-body {
//     padding: 25px;
//   }

//   .qr-image-container {
//     display: flex;
//     justify-content: center;
//     align-items: center;
//     margin-bottom: 20px;
//     padding: 15px;
//     background: #fff3cd;
//     border-radius: 10px;
//     border: 2px dashed #feca57;
//   }

//   .qr-image {
//     max-width: 100%;
//     height: auto;
//     border-radius: 8px;
//   }

//   .qr-error {
//     color: #dc3545;
//     padding: 20px;
//     text-align: center;
//     font-weight: bold;
//   }

//   .guest-info.free {
//     background: #fff3cd;
//     border-radius: 10px;
//     padding: 15px;
//     border: 2px solid #feca57;
//   }

//   .free-notice {
//     background: #ff6b6b;
//     color: white;
//     padding: 15px;
//     border-radius: 8px;
//     margin-bottom: 15px;
//     text-align: center;
//   }

//   .free-notice strong {
//     font-size: 1.2em;
//     display: block;
//     margin-bottom: 5px;
//   }

//   .free-notice p {
//     font-size: 0.9em;
//     opacity: 0.95;
//   }

//   .info-row {
//     display: flex;
//     justify-content: space-between;
//     padding: 8px 0;
//     border-bottom: 1px solid #feca57;
//   }

//   .info-row:last-child {
//     border-bottom: none;
//   }

//   .info-row .label {
//     font-weight: 600;
//     color: #856404;
//   }

//   .info-row .value {
//     font-weight: 500;
//     color: #212529;
//     text-align: right;
//   }

//   .qr-footer.free {
//     background: #fff3cd;
//     padding: 15px 20px;
//     border-top: 2px solid #feca57;
//     text-align: center;
//   }

//   .code-text {
//     font-family: 'Courier New', monospace;
//     font-size: 0.85em;
//     color: #856404;
//     margin-bottom: 5px;
//     word-break: break-all;
//   }

//   .entry-number {
//     font-size: 0.9em;
//     color: #ff6b6b;
//     font-weight: 700;
//   }

//   @media print {
//     body {
//       background: white;
//       padding: 0;
//     }

//     .title-section {
//       background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//       color: white;
//     }

//     .qr-card {
//       box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
//       margin-bottom: 20px;
//     }

//     .qr-card:hover {
//       transform: none;
//     }

//     .qr-grid {
//       grid-template-columns: repeat(2, 1fr);
//       gap: 15px;
//     }
//   }

//   @media (max-width: 768px) {
//     .qr-grid {
//       grid-template-columns: 1fr;
//     }

//     .title-section h1 {
//       font-size: 1.8em;
//     }

//     .title-section p {
//       font-size: 1em;
//     }
//   }

//   .print-button {
//     position: fixed;
//     bottom: 30px;
//     right: 30px;
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//     color: white;
//     border: none;
//     padding: 15px 30px;
//     border-radius: 50px;
//     font-size: 1.1em;
//     font-weight: 600;
//     cursor: pointer;
//     box-shadow: 0 5px 20px rgba(255, 107, 107, 0.4);
//     transition: all 0.3s ease;
//     z-index: 1000;
//   }

//   .print-button:hover {
//     transform: scale(1.05);
//     box-shadow: 0 8px 30px rgba(255, 107, 107, 0.6);
//   }

//   @media print {
//     .print-button {
//       display: none;
//     }
//   }
// </style>
// </head>
// <body>
// <div class="container">
//   <div class="title-section">
//     <h1>JET CLUB - QR GRATUITOS</h1>
//     <p>${qrEntriesWithImages[0]?.eventName || "Evento"}</p>
//     <p>${qrEntriesWithImages.length} entrada${qrEntriesWithImages.length !== 1 ? "s" : ""} gratuita${qrEntriesWithImages.length !== 1 ? "s" : ""}</p>
//     <div class="warning-badge">⚠️ PROHIBIDA LA VENTA</div>
//   </div>

//   <div class="qr-grid">
//     ${qrCardsHTML}
//   </div>
// </div>

// <button class="print-button" onclick="window.print()">
//   🖨️ Imprimir QR Gratis
// </button>
// </body>
// </html>
//   `;
// }

// import QRCode from "qrcode";
// import { db } from "@/lib/db";

// interface QREntryData {
//   code: string;
//   guestName: string;
//   guestIdentityCard: string;
//   eventName: string;
//   eventDate: Date;
//   tableName: string;
//   sectorName: string;
// }

// interface AnonymousQRData {
//   code: string;
//   eventName: string;
//   eventDate: Date;
//   tableName: string;
//   sectorName: string;
//   qrNumber: number;
//   totalQRs: number;
// }

// export function generateQRCode(): string {
//   const timestamp = Date.now();
//   const random = Math.random().toString(36).substring(2, 15);
//   return `QR-${timestamp}-${random}`;
// }

// export async function createQREntries(
//   requestId: string,
//   guestIds: string[],
//   eventInfo: {
//     name: string;
//     eventDate: Date;
//     tableName: string;
//     sectorName: string;
//   },
// ): Promise<QREntryData[]> {
//   const qrEntries: QREntryData[] = [];

//   for (const guestId of guestIds) {
//     const code = generateQRCode();

//     await db.qREntry.create({
//       data: {
//         id: crypto.randomUUID(),
//         code,
//         guestId,
//         requestId,
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     const guest = await db.guest.findUnique({
//       where: { id: guestId },
//       select: {
//         name: true,
//         identityCard: true,
//       },
//     });

//     if (guest) {
//       qrEntries.push({
//         code,
//         guestName: guest.name,
//         guestIdentityCard: guest.identityCard,
//         eventName: eventInfo.name,
//         eventDate: eventInfo.eventDate,
//         tableName: eventInfo.tableName,
//         sectorName: eventInfo.sectorName,
//       });
//     }
//   }

//   return qrEntries;
// }

// export async function createAnonymousQREntries(
//   requestId: string,
//   count: number,
//   eventInfo: {
//     name: string;
//     eventDate: Date;
//     tableName: string;
//     sectorName: string;
//   },
// ): Promise<AnonymousQRData[]> {
//   const qrEntries: AnonymousQRData[] = [];

//   const temporaryGuest = await db.guest.create({
//     data: {
//       id: crypto.randomUUID(),
//       name: "Invitado Anónimo",
//       identityCard: `TEMP-${Date.now()}`,
//       createdAt: new Date(),
//       updatedAt: new Date(),
//     },
//   });

//   for (let i = 0; i < count; i++) {
//     const code = generateQRCode();

//     await db.qREntry.create({
//       data: {
//         id: crypto.randomUUID(),
//         code,
//         guestId: temporaryGuest.id,
//         requestId,
//         isActive: true,
//         createdAt: new Date(),
//         updatedAt: new Date(),
//       },
//     });

//     qrEntries.push({
//       code,
//       eventName: eventInfo.name,
//       eventDate: eventInfo.eventDate,
//       tableName: eventInfo.tableName,
//       sectorName: eventInfo.sectorName,
//       qrNumber: i + 1,
//       totalQRs: count,
//     });
//   }

//   return qrEntries;
// }

// export async function generateQRPDFContent(
//   qrEntries: QREntryData[],
// ): Promise<string> {
//   const qrImagesPromises = qrEntries.map(async (entry) => {
//     try {
//       const qrDataURL = await QRCode.toDataURL(entry.code, {
//         width: 400,
//         margin: 1,
//         color: {
//           dark: "#000000",
//           light: "#FFFFFF",
//         },
//       });
//       return { ...entry, qrImage: qrDataURL };
//     } catch (error) {
//       console.error("Error generating QR code:", error);
//       return { ...entry, qrImage: "" };
//     }
//   });

//   const qrEntriesWithImages = await Promise.all(qrImagesPromises);

//   const formatDate = (date: Date) => {
//     return new Intl.DateTimeFormat("es-BO", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     }).format(new Date(date));
//   };

//   const qrCardsHTML = qrEntriesWithImages
//     .map(
//       (entry, index) => `
//     <div class="ticket">
//       <div class="ticket-header">
//         <div class="brand">JET NIGHTS</div>
//       </div>

//       <div class="ticket-content">
//         <div class="ticket-left">
//           <div class="event-info">
//             <div class="event-name">${entry.eventName.toUpperCase()}</div>
//             <div class="event-date">${formatDate(entry.eventDate)}</div>
//           </div>

//           <div class="guest-info">
//             <div class="info-item">
//               <div class="info-label">PASAJERO</div>
//               <div class="info-value">${entry.guestName.toUpperCase()}</div>
//             </div>
//             <div class="info-item">
//               <div class="info-label">CI</div>
//               <div class="info-value">${entry.guestIdentityCard}</div>
//             </div>
//           </div>

//           <div class="flight-details">
//             <div class="detail-row">
//               <div class="detail-item">
//                 <div class="detail-label">PUERTA</div>
//                 <div class="detail-value">${entry.sectorName}</div>
//               </div>
//               <div class="detail-item">
//                 <div class="detail-label">ASIENTO</div>
//                 <div class="detail-value">${entry.tableName}</div>
//               </div>
//             </div>
//           </div>

//           <div class="ticket-footer-info">
//             <div class="booking-ref">
//               <div class="booking-label">CÓDIGO DE RESERVA</div>
//               <div class="booking-code">${entry.code}</div>
//             </div>
//             <div class="boarding-number">
//               <div class="boarding-label">ENTRADA</div>
//               <div class="boarding-value">${index + 1} DE ${qrEntriesWithImages.length}</div>
//             </div>
//           </div>
//         </div>

//         <div class="ticket-right">
//           <div class="qr-container">
//             ${
//               entry.qrImage
//                 ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-code" />`
//                 : `<div class="qr-error">ERROR</div>`
//             }
//           </div>
//           <div class="qr-label">ESCANEAR AL INGRESAR</div>
//         </div>
//       </div>
//     </div>
//   `,
//     )
//     .join("");

//   return `
// <!DOCTYPE html>
// <html lang="es">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>Pase de Abordaje - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
// <style>
//   * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//   }

//   body {
//     font-family: 'Arial', sans-serif;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
//     background-image:
//       repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px),
//       linear-gradient(135deg, #00d2ff 0%, #3a7bd5 25%, #00d2ff 50%, #3a47d5 75%, #00d2ff 100%);
//     background-size: 100% 100%, 200% 200%;
//     animation: tropicalMove 20s ease infinite;
//     padding: 40px 20px;
//     min-height: 100vh;
//   }

//   @keyframes tropicalMove {
//     0%, 100% { background-position: 0% 0%, 0% 50%; }
//     50% { background-position: 0% 0%, 100% 50%; }
//   }

//   .container {
//     max-width: 900px;
//     margin: 0 auto;
//   }

//   .ticket {
//     background: white;
//     border-radius: 20px;
//     overflow: hidden;
//     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//     margin-bottom: 40px;
//     page-break-inside: avoid;
//   }

//   .ticket-header {
//     background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
//     padding: 20px 30px;
//     text-align: center;
//   }

//   .brand {
//     font-size: 32px;
//     font-weight: 900;
//     letter-spacing: 8px;
//     color: white;
//     text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
//   }

//   .ticket-content {
//     display: grid;
//     grid-template-columns: 2fr 1fr;
//     min-height: 400px;
//   }

//   .ticket-left {
//     padding: 35px;
//     display: flex;
//     flex-direction: column;
//     gap: 25px;
//   }

//   .event-info {
//     padding-bottom: 20px;
//     border-bottom: 3px solid #000;
//   }

//   .event-name {
//     font-size: 26px;
//     font-weight: 900;
//     color: #000;
//     letter-spacing: 1px;
//     margin-bottom: 8px;
//   }

//   .event-date {
//     font-size: 18px;
//     font-weight: 600;
//     color: #666;
//   }

//   .guest-info {
//     display: flex;
//     flex-direction: column;
//     gap: 15px;
//   }

//   .info-item {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .info-label {
//     font-size: 12px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .info-value {
//     font-size: 20px;
//     font-weight: 700;
//     color: #000;
//   }

//   .flight-details {
//     padding: 20px 0;
//     border-top: 2px dashed #ddd;
//     border-bottom: 2px dashed #ddd;
//   }

//   .detail-row {
//     display: grid;
//     grid-template-columns: 1fr 1fr;
//     gap: 20px;
//   }

//   .detail-item {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .detail-label {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .detail-value {
//     font-size: 24px;
//     font-weight: 900;
//     color: #000;
//   }

//   .ticket-footer-info {
//     margin-top: auto;
//     display: flex;
//     flex-direction: column;
//     gap: 15px;
//   }

//   .booking-ref {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .booking-label {
//     font-size: 10px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .booking-code {
//     font-family: 'Courier New', monospace;
//     font-size: 13px;
//     font-weight: 700;
//     color: #000;
//     word-break: break-all;
//   }

//   .boarding-number {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     padding: 12px;
//     background: #f5f5f5;
//     border-radius: 8px;
//   }

//   .boarding-label {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #666;
//   }

//   .boarding-value {
//     font-size: 16px;
//     font-weight: 900;
//     color: #000;
//   }

//   .ticket-right {
//     background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
//     border-left: 3px dashed #ccc;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     padding: 30px 20px;
//     gap: 15px;
//   }

//   .qr-container {
//     background: white;
//     padding: 15px;
//     border-radius: 15px;
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//   }

//   .qr-code {
//     display: block;
//     width: 100%;
//     height: auto;
//     max-width: 250px;
//   }

//   .qr-error {
//     width: 200px;
//     height: 200px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-weight: 900;
//     color: #dc3545;
//     border: 3px solid #dc3545;
//     border-radius: 10px;
//   }

//   .qr-label {
//     font-size: 12px;
//     font-weight: 700;
//     letter-spacing: 2px;
//     color: #666;
//     text-align: center;
//   }

//   @media print {
//     body {
//       background: white;
//       padding: 0;
//     }

//     .ticket {
//       box-shadow: none;
//       margin-bottom: 0;
//       page-break-after: always;
//     }

//     .ticket:last-child {
//       page-break-after: auto;
//     }

//     .print-button {
//       display: none;
//     }
//   }

//   @media (max-width: 768px) {
//     .ticket-content {
//       grid-template-columns: 1fr;
//     }

//     .ticket-right {
//       border-left: none;
//       border-top: 3px dashed #ccc;
//     }

//     .detail-row {
//       grid-template-columns: 1fr;
//     }
//   }

//   .print-button {
//     position: fixed;
//     bottom: 30px;
//     right: 30px;
//     background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
//     color: white;
//     border: none;
//     padding: 18px 35px;
//     border-radius: 50px;
//     font-size: 14px;
//     font-weight: 700;
//     letter-spacing: 2px;
//     cursor: pointer;
//     box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
//     transition: all 0.3s ease;
//     z-index: 1000;
//   }

//   .print-button:hover {
//     background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
//     transform: translateY(-3px);
//     box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
//   }
// </style>
// </head>
// <body>
// <div class="container">
//   ${qrCardsHTML}
// </div>

// <button class="print-button" onclick="window.print()">
//   IMPRIMIR ENTRADAS
// </button>
// </body>
// </html>
//   `;
// }

// export async function generateAnonymousQRPDFContent(
//   qrEntries: AnonymousQRData[],
// ): Promise<string> {
//   const qrImagesPromises = qrEntries.map(async (entry) => {
//     try {
//       const qrDataURL = await QRCode.toDataURL(entry.code, {
//         width: 400,
//         margin: 1,
//         color: {
//           dark: "#000000",
//           light: "#FFFFFF",
//         },
//       });
//       return { ...entry, qrImage: qrDataURL };
//     } catch (error) {
//       console.error("Error generating QR code:", error);
//       return { ...entry, qrImage: "" };
//     }
//   });

//   const qrEntriesWithImages = await Promise.all(qrImagesPromises);

//   const formatDate = (date: Date) => {
//     return new Intl.DateTimeFormat("es-BO", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     }).format(new Date(date));
//   };

//   const qrCardsHTML = qrEntriesWithImages
//     .map(
//       (entry) => `
//     <div class="ticket">
//       <div class="ticket-header">
//         <div class="brand">JET NIGHTS</div>
//       </div>

//       <div class="ticket-content">
//         <div class="ticket-left">
//           <div class="event-info">
//             <div class="event-name">${entry.eventName.toUpperCase()}</div>
//             <div class="event-date">${formatDate(entry.eventDate)}</div>
//           </div>

//           <div class="guest-info">
//             <div class="info-item">
//               <div class="info-label">PASAJERO</div>
//               <div class="info-value">INVITADO</div>
//             </div>
//           </div>

//           <div class="flight-details">
//             <div class="detail-row">
//               <div class="detail-item">
//                 <div class="detail-label">PUERTA</div>
//                 <div class="detail-value">${entry.sectorName}</div>
//               </div>
//               <div class="detail-item">
//                 <div class="detail-label">ASIENTO</div>
//                 <div class="detail-value">${entry.tableName}</div>
//               </div>
//             </div>
//           </div>

//           <div class="ticket-footer-info">
//             <div class="booking-ref">
//               <div class="booking-label">CÓDIGO DE RESERVA</div>
//               <div class="booking-code">${entry.code}</div>
//             </div>
//             <div class="boarding-number">
//               <div class="boarding-label">ENTRADA</div>
//               <div class="boarding-value">${entry.qrNumber} DE ${entry.totalQRs}</div>
//             </div>
//           </div>
//         </div>

//         <div class="ticket-right">
//           <div class="qr-container">
//             ${
//               entry.qrImage
//                 ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-code" />`
//                 : `<div class="qr-error">ERROR</div>`
//             }
//           </div>
//           <div class="qr-label">ESCANEAR AL INGRESAR</div>
//         </div>
//       </div>
//     </div>
//   `,
//     )
//     .join("");

//   return `
// <!DOCTYPE html>
// <html lang="es">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>Pase de Abordaje - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
// <style>
//   * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//   }

//   body {
//     font-family: 'Arial', sans-serif;
//     background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
//     background-image:
//       repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px),
//       linear-gradient(135deg, #00d2ff 0%, #3a7bd5 25%, #00d2ff 50%, #3a47d5 75%, #00d2ff 100%);
//     background-size: 100% 100%, 200% 200%;
//     animation: tropicalMove 20s ease infinite;
//     padding: 40px 20px;
//     min-height: 100vh;
//   }

//   @keyframes tropicalMove {
//     0%, 100% { background-position: 0% 0%, 0% 50%; }
//     50% { background-position: 0% 0%, 100% 50%; }
//   }

//   .container {
//     max-width: 900px;
//     margin: 0 auto;
//   }

//   .ticket {
//     background: white;
//     border-radius: 20px;
//     overflow: hidden;
//     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//     margin-bottom: 40px;
//     page-break-inside: avoid;
//   }

//   .ticket-header {
//     background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
//     padding: 20px 30px;
//     text-align: center;
//   }

//   .brand {
//     font-size: 32px;
//     font-weight: 900;
//     letter-spacing: 8px;
//     color: white;
//     text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
//   }

//   .ticket-content {
//     display: grid;
//     grid-template-columns: 2fr 1fr;
//     min-height: 400px;
//   }

//   .ticket-left {
//     padding: 35px;
//     display: flex;
//     flex-direction: column;
//     gap: 25px;
//   }

//   .event-info {
//     padding-bottom: 20px;
//     border-bottom: 3px solid #000;
//   }

//   .event-name {
//     font-size: 26px;
//     font-weight: 900;
//     color: #000;
//     letter-spacing: 1px;
//     margin-bottom: 8px;
//   }

//   .event-date {
//     font-size: 18px;
//     font-weight: 600;
//     color: #666;
//   }

//   .guest-info {
//     display: flex;
//     flex-direction: column;
//     gap: 15px;
//   }

//   .info-item {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .info-label {
//     font-size: 12px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .info-value {
//     font-size: 20px;
//     font-weight: 700;
//     color: #000;
//   }

//   .flight-details {
//     padding: 20px 0;
//     border-top: 2px dashed #ddd;
//     border-bottom: 2px dashed #ddd;
//   }

//   .detail-row {
//     display: grid;
//     grid-template-columns: 1fr 1fr;
//     gap: 20px;
//   }

//   .detail-item {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .detail-label {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .detail-value {
//     font-size: 24px;
//     font-weight: 900;
//     color: #000;
//   }

//   .ticket-footer-info {
//     margin-top: auto;
//     display: flex;
//     flex-direction: column;
//     gap: 15px;
//   }

//   .booking-ref {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .booking-label {
//     font-size: 10px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .booking-code {
//     font-family: 'Courier New', monospace;
//     font-size: 13px;
//     font-weight: 700;
//     color: #000;
//     word-break: break-all;
//   }

//   .boarding-number {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     padding: 12px;
//     background: #f5f5f5;
//     border-radius: 8px;
//   }

//   .boarding-label {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #666;
//   }

//   .boarding-value {
//     font-size: 16px;
//     font-weight: 900;
//     color: #000;
//   }

//   .ticket-right {
//     background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
//     border-left: 3px dashed #ccc;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     padding: 30px 20px;
//     gap: 15px;
//   }

//   .qr-container {
//     background: white;
//     padding: 15px;
//     border-radius: 15px;
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//   }

//   .qr-code {
//     display: block;
//     width: 100%;
//     height: auto;
//     max-width: 250px;
//   }

//   .qr-error {
//     width: 200px;
//     height: 200px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-weight: 900;
//     color: #dc3545;
//     border: 3px solid #dc3545;
//     border-radius: 10px;
//   }

//   .qr-label {
//     font-size: 12px;
//     font-weight: 700;
//     letter-spacing: 2px;
//     color: #666;
//     text-align: center;
//   }

//   @media print {
//     body {
//       background: white;
//       padding: 0;
//     }

//     .ticket {
//       box-shadow: none;
//       margin-bottom: 0;
//       page-break-after: always;
//     }

//     .ticket:last-child {
//       page-break-after: auto;
//     }

//     .print-button {
//       display: none;
//     }
//   }

//   @media (max-width: 768px) {
//     .ticket-content {
//       grid-template-columns: 1fr;
//     }

//     .ticket-right {
//       border-left: none;
//       border-top: 3px dashed #ccc;
//     }

//     .detail-row {
//       grid-template-columns: 1fr;
//     }
//   }

//   .print-button {
//     position: fixed;
//     bottom: 30px;
//     right: 30px;
//     background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
//     color: white;
//     border: none;
//     padding: 18px 35px;
//     border-radius: 50px;
//     font-size: 14px;
//     font-weight: 700;
//     letter-spacing: 2px;
//     cursor: pointer;
//     box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
//     transition: all 0.3s ease;
//     z-index: 1000;
//   }

//   .print-button:hover {
//     background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
//     transform: translateY(-3px);
//     box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
//   }
// </style>
// </head>
// <body>
// <div class="container">
//   ${qrCardsHTML}
// </div>

// <button class="print-button" onclick="window.print()">
//   IMPRIMIR ENTRADAS
// </button>
// </body>
// </html>
//   `;
// }

// export async function generateFreeQRPDFContent(
//   qrEntries: AnonymousQRData[],
// ): Promise<string> {
//   const qrImagesPromises = qrEntries.map(async (entry) => {
//     try {
//       const qrDataURL = await QRCode.toDataURL(entry.code, {
//         width: 400,
//         margin: 1,
//         color: {
//           dark: "#000000",
//           light: "#FFFFFF",
//         },
//       });
//       return { ...entry, qrImage: qrDataURL };
//     } catch (error) {
//       console.error("Error generating QR code:", error);
//       return { ...entry, qrImage: "" };
//     }
//   });

//   const qrEntriesWithImages = await Promise.all(qrImagesPromises);

//   const formatDate = (date: Date) => {
//     return new Intl.DateTimeFormat("es-BO", {
//       day: "2-digit",
//       month: "2-digit",
//       year: "numeric",
//     }).format(new Date(date));
//   };

//   const qrCardsHTML = qrEntriesWithImages
//     .map(
//       (entry) => `
//     <div class="ticket free-ticket">
//       <div class="ticket-header free-header">
//         <div class="brand">JET NIGHTS</div>
//         <div class="free-badge">ENTRADA GRATUITA</div>
//       </div>

//       <div class="ticket-content">
//         <div class="ticket-left">
//           <div class="event-info">
//             <div class="event-name">${entry.eventName.toUpperCase()}</div>
//             <div class="event-date">${formatDate(entry.eventDate)}</div>
//           </div>

//           <div class="warning-box">
//             <div class="warning-title">PROHIBIDA LA VENTA</div>
//             <div class="warning-text">Esta entrada es un obsequio y no debe ser vendida ni transferida</div>
//           </div>

//           <div class="flight-details">
//             <div class="detail-row">
//               <div class="detail-item">
//                 <div class="detail-label">PUERTA</div>
//                 <div class="detail-value">${entry.sectorName}</div>
//               </div>
//               <div class="detail-item">
//                 <div class="detail-label">ASIENTO</div>
//                 <div class="detail-value">${entry.tableName}</div>
//               </div>
//             </div>
//           </div>

//           <div class="ticket-footer-info">
//             <div class="booking-ref">
//               <div class="booking-label">CÓDIGO DE RESERVA</div>
//               <div class="booking-code">${entry.code}</div>
//             </div>
//             <div class="boarding-number free-number">
//               <div class="boarding-label">ENTRADA GRATIS</div>
//               <div class="boarding-value">${entry.qrNumber} DE ${entry.totalQRs}</div>
//             </div>
//           </div>
//         </div>

//         <div class="ticket-right free-right">
//           <div class="qr-container">
//             ${
//               entry.qrImage
//                 ? `<img src="${entry.qrImage}" alt="Código QR" class="qr-code" />`
//                 : `<div class="qr-error">ERROR</div>`
//             }
//           </div>
//           <div class="qr-label">ESCANEAR AL INGRESAR</div>
//           <div class="not-for-sale">NO VENDER</div>
//         </div>
//       </div>
//     </div>
//   `,
//     )
//     .join("");

//   return `
// <!DOCTYPE html>
// <html lang="es">
// <head>
// <meta charset="UTF-8">
// <meta name="viewport" content="width=device-width, initial-scale=1.0">
// <title>Pase Gratuito - ${qrEntriesWithImages[0]?.eventName || "Evento"}</title>
// <style>
//   * {
//     margin: 0;
//     padding: 0;
//     box-sizing: border-box;
//   }

//   body {
//     font-family: 'Arial', sans-serif;
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 50%, #ff9ff3 100%);
//     background-image:
//       repeating-linear-gradient(45deg, transparent, transparent 35px, rgba(255,255,255,.05) 35px, rgba(255,255,255,.05) 70px),
//       linear-gradient(135deg, #ff6b6b 0%, #feca57 25%, #ff6b6b 50%, #feca57 75%, #ff6b6b 100%);
//     background-size: 100% 100%, 200% 200%;
//     animation: tropicalMove 20s ease infinite;
//     padding: 40px 20px;
//     min-height: 100vh;
//   }

//   @keyframes tropicalMove {
//     0%, 100% { background-position: 0% 0%, 0% 50%; }
//     50% { background-position: 0% 0%, 100% 50%; }
//   }

//   .container {
//     max-width: 900px;
//     margin: 0 auto;
//   }

//   .ticket {
//     background: white;
//     border-radius: 20px;
//     overflow: hidden;
//     box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
//     margin-bottom: 40px;
//     page-break-inside: avoid;
//   }

//   .free-ticket {
//     border: 4px solid #ff6b6b;
//   }

//   .ticket-header {
//     background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
//     padding: 20px 30px;
//     text-align: center;
//   }

//   .free-header {
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//   }

//   .brand {
//     font-size: 32px;
//     font-weight: 900;
//     letter-spacing: 8px;
//     color: white;
//     text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
//   }

//   .free-badge {
//     margin-top: 8px;
//     display: inline-block;
//     background: rgba(0,0,0,0.8);
//     color: white;
//     padding: 8px 20px;
//     border-radius: 20px;
//     font-size: 14px;
//     font-weight: 700;
//     letter-spacing: 2px;
//   }

//   .ticket-content {
//     display: grid;
//     grid-template-columns: 2fr 1fr;
//     min-height: 400px;
//   }

//   .ticket-left {
//     padding: 35px;
//     display: flex;
//     flex-direction: column;
//     gap: 25px;
//   }

//   .event-info {
//     padding-bottom: 20px;
//     border-bottom: 3px solid #000;
//   }

//   .event-name {
//     font-size: 26px;
//     font-weight: 900;
//     color: #000;
//     letter-spacing: 1px;
//     margin-bottom: 8px;
//   }

//   .event-date {
//     font-size: 18px;
//     font-weight: 600;
//     color: #666;
//   }

//   .warning-box {
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//     padding: 20px;
//     border-radius: 12px;
//     border: 3px solid #000;
//   }

//   .warning-title {
//     font-size: 18px;
//     font-weight: 900;
//     color: white;
//     letter-spacing: 2px;
//     text-align: center;
//     margin-bottom: 8px;
//     text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
//   }

//   .warning-text {
//     font-size: 13px;
//     font-weight: 600;
//     color: white;
//     text-align: center;
//     line-height: 1.4;
//   }

//   .flight-details {
//     padding: 20px 0;
//     border-top: 2px dashed #ddd;
//     border-bottom: 2px dashed #ddd;
//   }

//   .detail-row {
//     display: grid;
//     grid-template-columns: 1fr 1fr;
//     gap: 20px;
//   }

//   .detail-item {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .detail-label {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .detail-value {
//     font-size: 24px;
//     font-weight: 900;
//     color: #000;
//   }

//   .ticket-footer-info {
//     margin-top: auto;
//     display: flex;
//     flex-direction: column;
//     gap: 15px;
//   }

//   .booking-ref {
//     display: flex;
//     flex-direction: column;
//     gap: 5px;
//   }

//   .booking-label {
//     font-size: 10px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #999;
//   }

//   .booking-code {
//     font-family: 'Courier New', monospace;
//     font-size: 13px;
//     font-weight: 700;
//     color: #000;
//     word-break: break-all;
//   }

//   .boarding-number {
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//     padding: 12px;
//     background: #f5f5f5;
//     border-radius: 8px;
//   }

//   .free-number {
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//   }

//   .free-number .boarding-label,
//   .free-number .boarding-value {
//     color: white;
//     text-shadow: 1px 1px 2px rgba(0,0,0,0.2);
//   }

//   .boarding-label {
//     font-size: 11px;
//     font-weight: 700;
//     letter-spacing: 1.5px;
//     color: #666;
//   }

//   .boarding-value {
//     font-size: 16px;
//     font-weight: 900;
//     color: #000;
//   }

//   .ticket-right {
//     background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
//     border-left: 3px dashed #ccc;
//     display: flex;
//     flex-direction: column;
//     align-items: center;
//     justify-content: center;
//     padding: 30px 20px;
//     gap: 15px;
//   }

//   .free-right {
//     background: linear-gradient(135deg, #fff5e6 0%, #ffe6e6 100%);
//     border-left: 3px dashed #ff6b6b;
//   }

//   .qr-container {
//     background: white;
//     padding: 15px;
//     border-radius: 15px;
//     box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
//   }

//   .qr-code {
//     display: block;
//     width: 100%;
//     height: auto;
//     max-width: 250px;
//   }

//   .qr-error {
//     width: 200px;
//     height: 200px;
//     display: flex;
//     align-items: center;
//     justify-content: center;
//     font-weight: 900;
//     color: #dc3545;
//     border: 3px solid #dc3545;
//     border-radius: 10px;
//   }

//   .qr-label {
//     font-size: 12px;
//     font-weight: 700;
//     letter-spacing: 2px;
//     color: #666;
//     text-align: center;
//   }

//   .not-for-sale {
//     background: #000;
//     color: white;
//     padding: 10px 20px;
//     border-radius: 8px;
//     font-size: 13px;
//     font-weight: 900;
//     letter-spacing: 2px;
//     text-align: center;
//   }

//   @media print {
//     body {
//       background: white;
//       padding: 0;
//     }

//     .ticket {
//       box-shadow: none;
//       margin-bottom: 0;
//       page-break-after: always;
//     }

//     .ticket:last-child {
//       page-break-after: auto;
//     }

//     .print-button {
//       display: none;
//     }
//   }

//   @media (max-width: 768px) {
//     .ticket-content {
//       grid-template-columns: 1fr;
//     }

//     .ticket-right {
//       border-left: none;
//       border-top: 3px dashed #ccc;
//     }

//     .free-right {
//       border-top: 3px dashed #ff6b6b;
//     }

//     .detail-row {
//       grid-template-columns: 1fr;
//     }
//   }

//   .print-button {
//     position: fixed;
//     bottom: 30px;
//     right: 30px;
//     background: linear-gradient(135deg, #ff6b6b 0%, #feca57 100%);
//     color: white;
//     border: none;
//     padding: 18px 35px;
//     border-radius: 50px;
//     font-size: 14px;
//     font-weight: 700;
//     letter-spacing: 2px;
//     cursor: pointer;
//     box-shadow: 0 8px 24px rgba(255, 107, 107, 0.4);
//     transition: all 0.3s ease;
//     z-index: 1000;
//   }

//   .print-button:hover {
//     background: linear-gradient(135deg, #feca57 0%, #ff6b6b 100%);
//     transform: translateY(-3px);
//     box-shadow: 0 12px 32px rgba(255, 107, 107, 0.5);
//   }
// </style>
// </head>
// <body>
// <div class="container">
//   ${qrCardsHTML}
// </div>

// <button class="print-button" onclick="window.print()">
//   IMPRIMIR ENTRADAS GRATIS
// </button>
// </body>
// </html>
//   `;
// }

// src/lib/utils/qr-generator.ts

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

function buildPassportHTML(params: {
  title: string;
  ticketArt: string | undefined;
  eventName: string;
  visaPages: string[];
  printButtonLabel: string;
  accentColor: string;
  accentGradient: string;
  isFree?: boolean;
}): string {
  const {
    title,
    ticketArt,
    eventName,
    visaPages,
    printButtonLabel,
    accentColor,
    accentGradient,
    isFree = false,
  } = params;

  const totalPages = visaPages.length;

  const coverHTML = ticketArt
    ? `<img src="${ticketArt}" alt="${eventName}" class="cover-art" />`
    : `<div class="cover-fallback">
        <div class="cover-monogram">${eventName.slice(0, 2).toUpperCase()}</div>
        <div class="cover-event-name">${eventName.toUpperCase()}</div>
       </div>`;

  const pagesHTML = visaPages
    .map(
      (pageContent, index) => `
    <div class="passport-page visa-page" id="page-${index + 1}" style="display:none">
      <div class="page-header">
        <div class="page-brand">JET NIGHTS</div>
        <div class="page-number">VISA ${index + 1} / ${totalPages}</div>
      </div>
      <div class="page-watermark">${eventName.toUpperCase()}</div>
      ${pageContent}
      <div class="page-footer">
        <div class="mrz-zone">
          <div class="mrz-line">JN&lt;&lt;${eventName.replace(/\s+/g, "&lt;").toUpperCase()}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
          <div class="mrz-line">JN${String(index + 1).padStart(7, "0")}&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;</div>
        </div>
      </div>
    </div>
  `,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="es">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${title}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Share+Tech+Mono&family=Cinzel:wght@400;700;900&display=swap" rel="stylesheet">
<style>
  :root {
    --accent: ${accentColor};
    --accent-gradient: ${accentGradient};
    --passport-w: 540px;
    --passport-h: 740px;
    --cover-color: #1a1a2e;
    --page-bg: #faf8f2;
    --page-line: rgba(0,0,0,0.08);
    --stamp-color: rgba(180, 20, 20, 0.18);
    --ink-color: #2c1810;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'IM Fell English', Georgia, serif;
    background: #0d0d0d;
    background-image:
      radial-gradient(ellipse at 20% 50%, rgba(120, 40, 200, 0.08) 0%, transparent 50%),
      radial-gradient(ellipse at 80% 20%, rgba(200, 40, 100, 0.06) 0%, transparent 50%);
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 40px 20px 120px;
  }

  .passport-wrapper {
    position: relative;
    width: var(--passport-w);
    height: var(--passport-h);
    perspective: 2000px;
    margin: 20px auto;
  }

  .passport-book {
    width: 100%;
    height: 100%;
    position: relative;
    transform-style: preserve-3d;
  }

  .passport-cover {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background: var(--cover-color);
    border-radius: 8px 20px 20px 8px;
    box-shadow:
      -8px 0 20px rgba(0,0,0,0.6),
      0 0 60px rgba(0,0,0,0.4),
      inset -4px 0 12px rgba(0,0,0,0.5);
    overflow: hidden;
  }

  .cover-art {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center;
    display: block;
    opacity: 0.9;
  }

  .cover-fallback {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    gap: 24px;
  }

  .cover-monogram {
    font-family: 'Cinzel', serif;
    font-size: 100px;
    font-weight: 900;
    color: var(--accent);
    text-shadow: 0 0 40px var(--accent), 0 0 80px var(--accent);
    letter-spacing: -2px;
    line-height: 1;
  }

  .cover-event-name {
    font-family: 'Cinzel', serif;
    font-size: 18px;
    font-weight: 700;
    color: rgba(255,255,255,0.7);
    letter-spacing: 4px;
    text-align: center;
    padding: 0 40px;
  }

  .cover-overlay {
    position: absolute;
    inset: 0;
    background: linear-gradient(
      to bottom,
      rgba(0,0,0,0.5) 0%,
      rgba(0,0,0,0.1) 40%,
      rgba(0,0,0,0.1) 60%,
      rgba(0,0,0,0.7) 100%
    );
    pointer-events: none;
  }

  .cover-top-badge {
    position: absolute;
    top: 30px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .cover-country {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    font-weight: 400;
    color: rgba(255,255,255,0.85);
    letter-spacing: 5px;
    text-align: center;
  }

  .cover-brand {
    font-family: 'Cinzel', serif;
    font-size: 32px;
    font-weight: 900;
    color: #fff;
    letter-spacing: 8px;
    text-shadow: 0 2px 12px rgba(0,0,0,0.8);
  }

  .cover-emblem {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 100px;
    height: 100px;
    border: 3px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    backdrop-filter: blur(2px);
    background: rgba(255,255,255,0.05);
  }

  .cover-emblem-inner {
    font-family: 'Cinzel', serif;
    font-size: 36px;
    font-weight: 900;
    color: rgba(255,255,255,0.9);
    text-shadow: 0 2px 8px rgba(0,0,0,0.6);
  }

  .cover-bottom {
    position: absolute;
    bottom: 28px;
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .cover-doc-type {
    font-family: 'Cinzel', serif;
    font-size: 13px;
    font-weight: 700;
    color: rgba(255,255,255,0.9);
    letter-spacing: 4px;
  }

  .cover-total {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 2px;
  }

  .passport-page {
    width: 100%;
    height: 100%;
    position: absolute;
    inset: 0;
    background: var(--page-bg);
    border-radius: 8px 20px 20px 8px;
    box-shadow:
      -8px 0 20px rgba(0,0,0,0.5),
      0 0 60px rgba(0,0,0,0.3);
    overflow: hidden;
    flex-direction: column;
  }

  .page-watermark {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%) rotate(-35deg);
    font-family: 'Cinzel', serif;
    font-size: 52px;
    font-weight: 900;
    color: rgba(0,0,0,0.04);
    white-space: nowrap;
    pointer-events: none;
    letter-spacing: 4px;
    width: 120%;
    text-align: center;
    z-index: 0;
  }

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px 12px;
    border-bottom: 1.5px solid rgba(0,0,0,0.12);
    position: relative;
    z-index: 1;
  }

  .page-brand {
    font-family: 'Cinzel', serif;
    font-size: 14px;
    font-weight: 700;
    letter-spacing: 5px;
    color: #1a1a1a;
  }

  .page-number {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    color: #888;
    letter-spacing: 2px;
  }

  .visa-body {
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
    position: relative;
    z-index: 1;
    flex: 1;
  }

  .visa-stamp-area {
    position: relative;
    border: 1.5px solid rgba(0,0,0,0.12);
    border-radius: 4px;
    padding: 16px;
    background: rgba(255,255,255,0.6);
  }

  .visa-stamp-area::before {
    content: '';
    position: absolute;
    top: -1px;
    left: 20px;
    right: 20px;
    height: 3px;
    background: var(--accent-gradient);
  }

  .visa-title-row {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 14px;
  }

  .visa-title {
    font-family: 'Cinzel', serif;
    font-size: 22px;
    font-weight: 900;
    color: #1a1a1a;
    letter-spacing: 1px;
    line-height: 1.1;
  }

  .visa-type-badge {
    background: var(--accent-gradient);
    color: white;
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    padding: 4px 10px;
    border-radius: 2px;
    font-weight: 700;
    flex-shrink: 0;
  }

  ${
    isFree
      ? `
  .visa-free-badge {
    background: linear-gradient(135deg, #ff6b6b, #feca57);
    color: white;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    padding: 3px 8px;
    border-radius: 2px;
    font-weight: 700;
    margin-top: 4px;
    display: inline-block;
  }
  .visa-no-sale {
    background: #000;
    color: white;
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    padding: 3px 8px;
    border-radius: 2px;
    margin-left: 6px;
  }
  `
      : ""
  }

  .visa-fields {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 12px;
  }

  .visa-field {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .visa-field-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: #888;
    text-transform: uppercase;
  }

  .visa-field-value {
    font-family: 'IM Fell English', serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--ink-color);
    line-height: 1.2;
  }

  .visa-field-full {
    grid-column: 1 / -1;
  }

  .visa-qr-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .visa-qr-block {
    background: white;
    padding: 12px;
    border: 1px solid rgba(0,0,0,0.1);
    border-radius: 4px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .visa-qr-img {
    display: block;
    width: 220px;
    height: 220px;
  }

  .visa-qr-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 8px;
    letter-spacing: 2px;
    color: #888;
    text-align: center;
    margin-top: 8px;
  }

  .visa-code-block {
    width: 100%;
    display: flex;
    flex-direction: row;
    gap: 16px;
    align-items: flex-start;
  }

  .visa-code-label {
    font-family: 'Share Tech Mono', monospace;
    font-size: 9px;
    letter-spacing: 2px;
    color: #888;
  }

  .visa-code-value {
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    color: var(--ink-color);
    word-break: break-all;
    line-height: 1.6;
    border: 1px dashed rgba(0,0,0,0.15);
    padding: 8px;
    border-radius: 4px;
    background: rgba(0,0,0,0.02);
  }

  /* Sello principal — doble círculo, esquina superior derecha */
  .visa-stamp-circle {
    position: absolute;
    top: 14px;
    right: 18px;
    width: 100px;
    height: 100px;
    border: 3px solid var(--stamp-color);
    border-radius: 50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform: rotate(-15deg);
    pointer-events: none;
    box-shadow: inset 0 0 0 6px transparent, inset 0 0 0 8px var(--stamp-color);
  }

  .visa-stamp-circle::before {
    content: '';
    position: absolute;
    inset: 6px;
    border: 1.5px solid var(--stamp-color);
    border-radius: 50%;
  }

  .stamp-text {
    font-family: 'Cinzel', serif;
    font-size: 11px;
    letter-spacing: 1.5px;
    color: var(--stamp-color);
    text-align: center;
    font-weight: 900;
    line-height: 2;
    position: relative;
    z-index: 1;
  }

  /* Sello secundario — rectangular doble borde, esquina inferior derecha de la página */
  .visa-stamp-exclusive {
    position: absolute;
    bottom: 110px;
    right: 0px;
    transform: rotate(6deg);
    width: 110px;
    height: 62px;
    border: 2.5px solid rgba(37, 99, 235, 0.25);
    border-radius: 3px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 0;
  }

  .visa-stamp-exclusive::before {
    content: '';
    position: absolute;
    inset: 4px;
    border: 1px solid rgba(37, 99, 235, 0.18);
    border-radius: 1px;
  }

  .stamp-text-exclusive {
    font-family: 'Cinzel', serif;
    font-size: 9px;
    letter-spacing: 1.5px;
    color: rgba(37, 99, 235, 0.32);
    text-align: center;
    font-weight: 700;
    line-height: 1.7;
    position: relative;
    z-index: 1;
  }

  /* Sello terciario — círculo dentado SVG, esquina inferior izquierda de la página */
  .visa-stamp-discretion {
    position: absolute;
    bottom: 100px;
    left: 0px;
    width: 96px;
    height: 96px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transform: rotate(9deg);
    pointer-events: none;
    z-index: 0;
  }

  .visa-stamp-discretion svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }

  .stamp-text-discretion {
    font-family: 'Cinzel', serif;
    font-size: 8px;
    letter-spacing: 1px;
    color: rgba(5, 150, 105, 0.3);
    text-align: center;
    font-weight: 700;
    line-height: 1.7;
    position: relative;
    z-index: 1;
  }

  .page-footer {
    border-top: 1.5px solid rgba(0,0,0,0.1);
    padding: 10px 24px;
    background: rgba(0,0,0,0.02);
    position: relative;
    z-index: 1;
  }

  .mrz-zone {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .mrz-line {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    letter-spacing: 2px;
    color: rgba(0,0,0,0.25);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: clip;
  }

  .nav-controls {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 16px;
    z-index: 100;
  }

  .nav-btn {
    background: rgba(255,255,255,0.08);
    border: 1px solid rgba(255,255,255,0.15);
    color: white;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    font-size: 18px;
    cursor: pointer;
    backdrop-filter: blur(8px);
    transition: all 0.2s ease;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .nav-btn:hover {
    background: rgba(255,255,255,0.16);
    border-color: rgba(255,255,255,0.3);
    transform: scale(1.08);
  }

  .nav-btn:disabled {
    opacity: 0.25;
    cursor: not-allowed;
    transform: none;
  }

  .nav-counter {
    font-family: 'Share Tech Mono', monospace;
    font-size: 12px;
    color: rgba(255,255,255,0.5);
    letter-spacing: 3px;
    min-width: 80px;
    text-align: center;
  }

  .print-btn {
    background: white;
    color: #000;
    border: none;
    padding: 14px 32px;
    border-radius: 2px;
    font-family: 'Share Tech Mono', monospace;
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 3px;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0,0,0,0.4);
    transition: all 0.2s ease;
    margin-left: 8px;
  }

  .print-btn:hover {
    background: #f0f0f0;
    transform: translateY(-1px);
    box-shadow: 0 6px 24px rgba(0,0,0,0.5);
  }

  @media print {
    body {
      background: white;
      padding: 0;
      display: block;
    }

    .nav-controls { display: none; }

    .passport-wrapper {
      width: 100%;
      height: auto;
      perspective: none;
      page-break-after: always;
    }

    .passport-page {
      display: flex !important;
      position: relative !important;
      height: auto !important;
      box-shadow: none;
      page-break-after: always;
    }

    #page-0 { display: none !important; }
  }

  @media (max-width: 580px) {
    :root {
      --passport-w: calc(100vw - 32px);
      --passport-h: auto;
    }

    body {
      padding: 20px 16px 100px;
    }

    .passport-wrapper {
      height: auto;
      perspective: none;
    }

    .passport-book {
      height: auto;
    }

    .passport-cover,
    .passport-page {
      position: relative !important;
      height: auto !important;
      min-height: 480px;
      inset: auto;
    }

    .passport-cover {
      min-height: 360px;
    }

    .visa-body {
      padding: 14px 16px;
      gap: 12px;
    }

    .visa-fields { grid-template-columns: 1fr; }

    .visa-stamp-circle { display: none; }
    .visa-stamp-exclusive { display: none; }
    .visa-stamp-discretion { display: none; }

    .visa-qr-img {
      width: 180px;
      height: 180px;
    }

    .visa-title {
      font-size: 17px;
    }

    .page-watermark {
      font-size: 32px;
    }

    .mrz-line {
      font-size: 8px;
    }

    .nav-controls {
      gap: 10px;
    }

    .print-btn {
      padding: 12px 18px;
      font-size: 10px;
    }
  }
</style>
</head>
<body>

<div class="passport-wrapper">
  <div class="passport-book">

    <div class="passport-cover" id="page-0">
      ${coverHTML}
    </div>

    ${pagesHTML}

  </div>
</div>

<div class="nav-controls" id="navControls">
  <button class="nav-btn" id="btnPrev" onclick="prevPage()" disabled>&#8592;</button>
  <span class="nav-counter" id="navCounter">PORTADA</span>
  <button class="nav-btn" id="btnNext" onclick="nextPage()">&#8594;</button>
  <button class="print-btn" onclick="window.print()">${printButtonLabel}</button>
</div>

<script>
  var currentPage = 0;
  var totalPages = ${totalPages};

  function goToPage(n) {
    for (var i = 0; i <= totalPages; i++) {
      var el = document.getElementById('page-' + i);
      if (!el) continue;
      var visible = i === n;
      el.style.display = visible ? 'flex' : 'none';
      if (visible && i > 0) el.style.flexDirection = 'column';
    }
    currentPage = n;
    document.getElementById('navCounter').textContent =
      n === 0 ? 'PORTADA' : n + ' / ' + totalPages;
    document.getElementById('btnPrev').disabled = n === 0;
    document.getElementById('btnNext').disabled = n === totalPages;
  }

  function nextPage() {
    if (currentPage < totalPages) goToPage(currentPage + 1);
  }

  function prevPage() {
    if (currentPage > 0) goToPage(currentPage - 1);
  }

  goToPage(0);
</script>
</body>
</html>`;
}

function buildGearSVG(color: string): string {
  const cx = 35;
  const cy = 35;
  const outerR = 32;
  const innerR = 26;
  const teeth = 16;
  const points: string[] = [];
  for (let i = 0; i < teeth * 2; i++) {
    const angle = (Math.PI / teeth) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    points.push(
      `${(cx + r * Math.cos(angle)).toFixed(2)},${(cy + r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return `<svg viewBox="0 0 70 70" xmlns="http://www.w3.org/2000/svg">
  <polygon points="${points.join(" ")}" fill="none" stroke="${color}" stroke-width="1.5" stroke-linejoin="round"/>
  <circle cx="35" cy="35" r="18" fill="none" stroke="${color}" stroke-width="1.2"/>
</svg>`;
}

function buildVisaPageGuest(
  entry: QREntryData & { qrImage: string },
  index: number,
  total: number,
  formatDate: (d: Date) => string,
): string {
  return `
    <div class="visa-body">
      <div class="visa-stamp-exclusive">
        <div class="stamp-text-exclusive">ACCESO<br>EXCLUSIVO</div>
      </div>
      <div class="visa-stamp-discretion">
        ${buildGearSVG("rgba(5,150,105,0.22)")}
        <div class="stamp-text-discretion">MÁXIMA<br>DISCRECIÓN</div>
      </div>
      <div class="visa-stamp-area">
        <div class="visa-stamp-circle">
          <div class="stamp-text">JET<br>NIGHTS<br>ENTRADA</div>
        </div>
        <div class="visa-title-row">
          <div>
            <div class="visa-title">${entry.eventName}</div>
          </div>
          <div class="visa-type-badge">TIPO A</div>
        </div>
        <div class="visa-fields">
          <div class="visa-field visa-field-full">
            <div class="visa-field-label">PORTADOR</div>
            <div class="visa-field-value">${entry.guestName.toUpperCase()}</div>
          </div>
          <div class="visa-field">
            <div class="visa-field-label">DOCUMENTO</div>
            <div class="visa-field-value">${entry.guestIdentityCard}</div>
          </div>
          <div class="visa-field">
            <div class="visa-field-label">FECHA</div>
            <div class="visa-field-value">${formatDate(entry.eventDate)}</div>
          </div>
          <div class="visa-field">
            <div class="visa-field-label">SECTOR</div>
            <div class="visa-field-value">${entry.sectorName}</div>
          </div>
          <div class="visa-field">
            <div class="visa-field-label">MESA</div>
            <div class="visa-field-value">${entry.tableName}</div>
          </div>
        </div>
      </div>

      <div class="visa-qr-row">
        <div class="visa-qr-block">
          ${
            entry.qrImage
              ? `<img src="${entry.qrImage}" alt="QR" class="visa-qr-img" />`
              : `<div style="width:220px;height:220px;display:flex;align-items:center;justify-content:center;color:#dc3545;font-size:12px;font-weight:700;border:2px solid #dc3545;border-radius:4px">ERROR</div>`
          }
          <div class="visa-qr-label">ESCANEAR AL INGRESO</div>
        </div>
        <div class="visa-code-block">
          <div style="flex:1">
            <div class="visa-code-label">CÓDIGO DE RESERVA</div>
            <div class="visa-code-value">${entry.code}</div>
          </div>
          <div style="flex-shrink:0;text-align:right">
            <div class="visa-code-label">ENTRADA</div>
            <div style="font-family:'Share Tech Mono',monospace;font-size:22px;font-weight:700;color:#1a1a1a;margin-top:2px">${index + 1} / ${total}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function buildVisaPageAnonymous(
  entry: AnonymousQRData & { qrImage: string },
  formatDate: (d: Date) => string,
  isFree = false,
): string {
  return `
    <div class="visa-body">
      <div class="visa-stamp-exclusive">
        <div class="stamp-text-exclusive">ACCESO<br>EXCLUSIVO</div>
      </div>
      <div class="visa-stamp-discretion">
        ${buildGearSVG("rgba(5,150,105,0.22)")}
        <div class="stamp-text-discretion">MÁXIMA<br>DISCRECIÓN</div>
      </div>
      <div class="visa-stamp-area">
        <div class="visa-stamp-circle">
          <div class="stamp-text">JET<br>NIGHTS<br>ENTRADA</div>
        </div>
        <div class="visa-title-row">
          <div>
            <div class="visa-title">${entry.eventName}</div>
            ${isFree ? `<span class="visa-free-badge">ENTRADA GRATUITA</span><span class="visa-no-sale">NO VENDER</span>` : ""}
          </div>
          <div class="visa-type-badge">${isFree ? "GRATUITA" : "TIPO B"}</div>
        </div>
        <div class="visa-fields">
          <div class="visa-field visa-field-full">
            <div class="visa-field-label">PORTADOR</div>
            <div class="visa-field-value">INVITADO</div>
          </div>
          <div class="visa-field">
            <div class="visa-field-label">FECHA</div>
            <div class="visa-field-value">${formatDate(entry.eventDate)}</div>
          </div>
          <div class="visa-field">
            <div class="visa-field-label">SECTOR</div>
            <div class="visa-field-value">${entry.sectorName}</div>
          </div>
          <div class="visa-field">
            <div class="visa-field-label">MESA</div>
            <div class="visa-field-value">${entry.tableName}</div>
          </div>
        </div>
      </div>

      <div class="visa-qr-row">
        <div class="visa-qr-block">
          ${
            entry.qrImage
              ? `<img src="${entry.qrImage}" alt="QR" class="visa-qr-img" />`
              : `<div style="width:220px;height:220px;display:flex;align-items:center;justify-content:center;color:#dc3545;font-size:12px;font-weight:700;border:2px solid #dc3545;border-radius:4px">ERROR</div>`
          }
          <div class="visa-qr-label">ESCANEAR AL INGRESO</div>
        </div>
        <div class="visa-code-block">
          <div style="flex:1">
            <div class="visa-code-label">CÓDIGO DE RESERVA</div>
            <div class="visa-code-value">${entry.code}</div>
          </div>
          <div style="flex-shrink:0;text-align:right">
            <div class="visa-code-label">ENTRADA</div>
            <div style="font-family:'Share Tech Mono',monospace;font-size:22px;font-weight:700;color:#1a1a1a;margin-top:2px">${entry.qrNumber} / ${entry.totalQRs}</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

export async function generateQRPDFContent(
  qrEntries: QREntryData[],
  ticketArt?: string,
): Promise<string> {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));

  const qrEntriesWithImages = await Promise.all(
    qrEntries.map(async (entry) => {
      try {
        const qrImage = await QRCode.toDataURL(entry.code, {
          width: 400,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        return { ...entry, qrImage };
      } catch {
        return { ...entry, qrImage: "" };
      }
    }),
  );

  const visaPages = qrEntriesWithImages.map((entry, index) =>
    buildVisaPageGuest(entry, index, qrEntriesWithImages.length, formatDate),
  );

  return buildPassportHTML({
    title: `Pasaporte JET NIGHTS — ${qrEntriesWithImages[0]?.eventName ?? "Evento"}`,
    ticketArt,
    eventName: qrEntriesWithImages[0]?.eventName ?? "Evento",
    visaPages,
    printButtonLabel: "IMPRIMIR",
    accentColor: "#6366f1",
    accentGradient: "linear-gradient(135deg, #6366f1, #8b5cf6)",
  });
}

export async function generateAnonymousQRPDFContent(
  qrEntries: AnonymousQRData[],
  ticketArt?: string,
): Promise<string> {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));

  const qrEntriesWithImages = await Promise.all(
    qrEntries.map(async (entry) => {
      try {
        const qrImage = await QRCode.toDataURL(entry.code, {
          width: 400,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        return { ...entry, qrImage };
      } catch {
        return { ...entry, qrImage: "" };
      }
    }),
  );

  const visaPages = qrEntriesWithImages.map((entry) =>
    buildVisaPageAnonymous(entry, formatDate, false),
  );

  return buildPassportHTML({
    title: `Pasaporte JET NIGHTS — ${qrEntriesWithImages[0]?.eventName ?? "Evento"}`,
    ticketArt,
    eventName: qrEntriesWithImages[0]?.eventName ?? "Evento",
    visaPages,
    printButtonLabel: "IMPRIMIR",
    accentColor: "#3b82f6",
    accentGradient: "linear-gradient(135deg, #3b82f6, #6366f1)",
  });
}

export async function generateFreeQRPDFContent(
  qrEntries: AnonymousQRData[],
  ticketArt?: string,
): Promise<string> {
  const formatDate = (date: Date) =>
    new Intl.DateTimeFormat("es-BO", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(new Date(date));

  const qrEntriesWithImages = await Promise.all(
    qrEntries.map(async (entry) => {
      try {
        const qrImage = await QRCode.toDataURL(entry.code, {
          width: 400,
          margin: 1,
          color: { dark: "#000000", light: "#FFFFFF" },
        });
        return { ...entry, qrImage };
      } catch {
        return { ...entry, qrImage: "" };
      }
    }),
  );

  const visaPages = qrEntriesWithImages.map((entry) =>
    buildVisaPageAnonymous(entry, formatDate, true),
  );

  return buildPassportHTML({
    title: `Pasaporte Gratuito JET NIGHTS — ${qrEntriesWithImages[0]?.eventName ?? "Evento"}`,
    ticketArt,
    eventName: qrEntriesWithImages[0]?.eventName ?? "Evento",
    visaPages,
    printButtonLabel: "IMPRIMIR GRATIS",
    accentColor: "#ff6b6b",
    accentGradient: "linear-gradient(135deg, #ff6b6b, #feca57)",
    isFree: true,
  });
}
