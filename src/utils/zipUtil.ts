/**
 * Pure Browser ZIP File Generator
 * Generates valid standard PK-Zip archives without external dependencies.
 * Perfect for bulk export of processed visual assets.
 */

interface ZipEntry {
  filename: string;
  data: Uint8Array;
}

export class SimpleZipBuilder {
  private entries: ZipEntry[] = [];

  public addFile(filename: string, content: Uint8Array): void {
    this.entries.push({ filename, data: content });
  }

  public async addFileFromDataUrl(filename: string, dataUrl: string): Promise<void> {
    const res = await fetch(dataUrl);
    const buffer = await res.arrayBuffer();
    this.entries.push({ filename, data: new Uint8Array(buffer) });
  }

  public generateZipBlob(): Blob {
    let localHeadersSize = 0;
    let centralDirSize = 0;

    // Precalculate sizes
    for (const entry of this.entries) {
      const nameBytes = new TextEncoder().encode(entry.filename);
      localHeadersSize += 30 + nameBytes.length + entry.data.length;
      centralDirSize += 46 + nameBytes.length;
    }

    const totalSize = localHeadersSize + centralDirSize + 22;
    const buffer = new Uint8Array(totalSize);
    const view = new DataView(buffer.buffer);

    let offset = 0;
    const centralDirOffsets: { offset: number; nameBytes: Uint8Array; dataLen: number; crc: number }[] = [];

    // 1. Write Local File Records
    for (const entry of this.entries) {
      const nameBytes = new TextEncoder().encode(entry.filename);
      const crc = this.computeCRC32(entry.data);
      const fileOffset = offset;

      centralDirOffsets.push({ offset: fileOffset, nameBytes, dataLen: entry.data.length, crc });

      // Local file header signature 0x04034b50
      view.setUint32(offset, 0x04034b50, true);
      view.setUint16(offset + 4, 20, true); // version needed
      view.setUint16(offset + 6, 0, true); // general purpose bit flag
      view.setUint16(offset + 8, 0, true); // compression method (0 = stored)
      view.setUint16(offset + 10, 0, true); // file last mod time
      view.setUint16(offset + 12, 0, true); // file last mod date
      view.setUint32(offset + 14, crc, true); // crc-32
      view.setUint32(offset + 18, entry.data.length, true); // compressed size
      view.setUint32(offset + 22, entry.data.length, true); // uncompressed size
      view.setUint16(offset + 26, nameBytes.length, true); // filename length
      view.setUint16(offset + 28, 0, true); // extra field length

      offset += 30;
      buffer.set(nameBytes, offset);
      offset += nameBytes.length;
      buffer.set(entry.data, offset);
      offset += entry.data.length;
    }

    const centralDirStart = offset;

    // 2. Write Central Directory Records
    for (let i = 0; i < this.entries.length; i++) {
      const meta = centralDirOffsets[i];

      // Central file header signature 0x02014b50
      view.setUint32(offset, 0x02014b50, true);
      view.setUint16(offset + 4, 20, true); // version made by
      view.setUint16(offset + 6, 20, true); // version needed
      view.setUint16(offset + 8, 0, true); // general purpose bit flag
      view.setUint16(offset + 10, 0, true); // compression method (0 = stored)
      view.setUint16(offset + 12, 0, true); // file last mod time
      view.setUint16(offset + 14, 0, true); // file last mod date
      view.setUint32(offset + 16, meta.crc, true); // crc-32
      view.setUint32(offset + 20, meta.dataLen, true); // compressed size
      view.setUint32(offset + 24, meta.dataLen, true); // uncompressed size
      view.setUint16(offset + 28, meta.nameBytes.length, true); // filename length
      view.setUint16(offset + 30, 0, true); // extra field length
      view.setUint16(offset + 32, 0, true); // comment length
      view.setUint16(offset + 34, 0, true); // disk number
      view.setUint16(offset + 36, 0, true); // internal file attributes
      view.setUint32(offset + 38, 0, true); // external file attributes
      view.setUint32(offset + 42, meta.offset, true); // relative offset of local header

      offset += 46;
      buffer.set(meta.nameBytes, offset);
      offset += meta.nameBytes.length;
    }

    const centralDirEnd = offset;
    const centralDirLength = centralDirEnd - centralDirStart;

    // 3. Write End of Central Directory Record (EOCD)
    view.setUint32(offset, 0x06054b50, true); // EOCD signature
    view.setUint16(offset + 4, 0, true); // disk number
    view.setUint16(offset + 6, 0, true); // disk with start of central directory
    view.setUint16(offset + 8, this.entries.length, true); // total entries on this disk
    view.setUint16(offset + 10, this.entries.length, true); // total entries
    view.setUint32(offset + 12, centralDirLength, true); // size of central directory
    view.setUint32(offset + 16, centralDirStart, true); // offset of central directory
    view.setUint16(offset + 20, 0, true); // zip comment length

    return new Blob([buffer], { type: 'application/zip' });
  }

  // Fast standard CRC32 table
  private computeCRC32(bytes: Uint8Array): number {
    let crc = 0 ^ -1;
    for (let i = 0; i < bytes.length; i++) {
      crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
    }
    return (crc ^ -1) >>> 0;
  }
}

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
