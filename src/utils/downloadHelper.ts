/**
 * Reliable file downloader that converts URLs to blobs before triggering download.
 * Prevents Chrome from opening or blocking internal PDF plugins in iframe environments.
 */
export async function downloadPdfFile(url: string, filename: string): Promise<boolean> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const blob = await response.blob();
    const objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = objectUrl;
    a.download = filename.endsWith('.pdf') ? filename : `${filename}.pdf`;
    document.body.appendChild(a);
    a.click();

    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
    }, 15000);

    return true;
  } catch (error) {
    console.warn('Blob download fallback triggered:', error);
    // Fallback: standard anchor click
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
    }, 5000);
    return false;
  }
}
