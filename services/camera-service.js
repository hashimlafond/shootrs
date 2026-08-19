export const cameraPermissionStates = [
  "not requested",
  "granted",
  "denied",
  "unavailable",
  "camera in use",
  "no camera detected",
  "unsupported browser",
];

export async function requestCamera({ facingMode = "environment" } = {}) {
  if (!navigator.mediaDevices?.getUserMedia) {
    return { state: "unsupported browser", stream: null };
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode },
      audio: false,
    });
    return { state: "granted", stream };
  } catch (error) {
    const state = error.name === "NotFoundError"
      ? "no camera detected"
      : error.name === "NotReadableError"
        ? "camera in use"
        : error.name === "NotAllowedError"
          ? "denied"
          : "unavailable";
    return { state, stream: null };
  }
}

export function stopCamera(stream) {
  stream?.getTracks().forEach((track) => track.stop());
}

export function cameraFallbackInput({ environment = true } = {}) {
  const capture = environment ? "environment" : "user";
  return `<input type="file" accept="image/heic,image/jpeg,image/png,image/*" capture="${capture}" />`;
}
