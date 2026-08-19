export function createUploadBatch({ bookingId, files = [] }) {
  return {
    id: `upload-${bookingId}-${Date.now()}`,
    bookingId,
    status: "prepared",
    directToStorage: true,
    resumable: true,
    items: files.map((file, index) => ({
      id: `upload-item-${index + 1}`,
      file,
      signedUrl: `mock-signed-upload://${bookingId}/${index + 1}`,
      status: "pending",
      retries: 0,
      duplicate: false,
    })),
  };
}

export function retryUpload(batch, itemId) {
  return {
    ...batch,
    items: batch.items.map((item) => item.id === itemId ? { ...item, status: "retrying", retries: item.retries + 1 } : item),
  };
}

export function markUploadComplete(batch, itemId) {
  return {
    ...batch,
    status: "uploading",
    items: batch.items.map((item) => item.id === itemId ? { ...item, status: "complete" } : item),
  };
}
