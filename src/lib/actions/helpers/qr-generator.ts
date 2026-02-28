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
  holderName: string;
  holderIdentityCard: string;
}

interface AnonymousQRData {
  code: string;
  eventName: string;
  eventDate: Date;
  tableName: string;
  sectorName: string;
  qrNumber: number;
  totalQRs: number;
  holderName: string;
  holderIdentityCard: string;
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
    holderName: string;
    holderIdentityCard: string;
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
        holderName: eventInfo.holderName,
        holderIdentityCard: eventInfo.holderIdentityCard,
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
    holderName: string;
    holderIdentityCard: string;
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
      holderName: eventInfo.holderName,
      holderIdentityCard: eventInfo.holderIdentityCard,
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

  .page-holder-bar {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    padding: 6px 24px 8px;
    border-bottom: 1px solid rgba(0,0,0,0.07);
    background: rgba(0,0,0,0.02);
    position: relative;
    z-index: 1;
    gap: 12px;
  }

  .page-holder-name {
    font-family: 'Cinzel', serif;
    font-size: 12px;
    font-weight: 700;
    color: #1a1a1a;
    letter-spacing: 0.5px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .page-holder-ci {
    font-family: 'Share Tech Mono', monospace;
    font-size: 10px;
    color: #666;
    letter-spacing: 1.5px;
    white-space: nowrap;
    flex-shrink: 0;
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
    <div class="page-holder-bar">
      <div class="page-holder-name">${entry.holderName.toUpperCase()}</div>
      <div class="page-holder-ci">CI ${entry.holderIdentityCard}</div>
    </div>
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
    <div class="page-holder-bar">
      <div class="page-holder-name">${entry.holderName.toUpperCase()}</div>
      <div class="page-holder-ci">CI ${entry.holderIdentityCard}</div>
    </div>
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
