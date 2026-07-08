import { useCallback, useEffect, useState } from "react";
import type { Dispatch, RefObject, SetStateAction } from "react";
import { track } from "@vercel/analytics";
import type { LoadSource, Pt, SurfaceId } from "../types";
import { SURFACES } from "../constants";
import { buzz } from "../helpers";

interface CameraArgs {
  videoRef: RefObject<HTMLVideoElement | null>;
  objectUrl: (blob: Blob) => string;
  setSnapMessage: Dispatch<SetStateAction<string | null>>;
  surface: SurfaceId;
  onCapture: (
    src: string,
    from: LoadSource,
    nextQuad?: Pt[],
    nextSurface?: SurfaceId,
    acceptedFit?: boolean,
    nextPieceSlug?: string
  ) => void;
}

export function useCamera({ videoRef, objectUrl, setSnapMessage, surface, onCapture }: CameraArgs) {
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const clearCameraError = useCallback(() => setCameraError(null), []);

  const stopCamera = useCallback(() => {
    cameraStream?.getTracks().forEach((track) => track.stop());
    setCameraStream(null);
    setCameraOpen(false);
    setCameraError(null);
    setSnapMessage(null);
  }, [cameraStream, setSnapMessage]);

  const openCamera = async () => {
    setCameraError(null);
    if (!navigator.mediaDevices?.getUserMedia) {
      setCameraError("Camera needs a secure browser. Choose a photo instead.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setCameraStream(stream);
      setCameraOpen(true);
      setSnapMessage("Camera ready. Capture once, then refine the still.");
      buzz(6);
      track("viz_camera_open", {});
    } catch {
      setCameraError("Camera did not open. Choose a photo instead.");
    }
  };

  const snapCamera = async () => {
    const video = videoRef.current;
    if (!video || !cameraStream) return;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || !video.videoWidth || !video.videoHeight) {
      setCameraError("Camera is warming up. Try again.");
      return;
    }
    setCameraError(null);
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (blob) onCapture(objectUrl(blob), "camera", undefined, surface);
        else onCapture(canvas.toDataURL("image/jpeg", 0.92), "camera", SURFACES[surface].quad, surface);
        track("viz_camera_snap", { method: "capture" });
        stopCamera();
      },
      "image/jpeg",
      0.92
    );
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !cameraStream) return;
    video.srcObject = cameraStream;
    void video.play().catch(() => {
      setCameraError("Camera preview did not start. Choose a photo instead.");
    });
    return () => {
      video.srcObject = null;
    };
  }, [cameraStream, videoRef]);

  useEffect(() => () => {
    cameraStream?.getTracks().forEach((track) => track.stop());
  }, [cameraStream]);

  return { cameraOpen, cameraError, clearCameraError, openCamera, snapCamera, stopCamera };
}
