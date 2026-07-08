import { useCallback, useEffect, useRef } from "react";

export function useObjectUrls() {
  const objectUrls = useRef<Set<string>>(new Set());

  const revokeObjectUrl = useCallback((url: string) => {
    if (!objectUrls.current.has(url)) return;
    URL.revokeObjectURL(url);
    objectUrls.current.delete(url);
  }, []);

  const objectUrl = useCallback((blob: Blob) => {
    const url = URL.createObjectURL(blob);
    objectUrls.current.add(url);
    return url;
  }, []);

  useEffect(() => () => {
    objectUrls.current.forEach((url) => URL.revokeObjectURL(url));
    objectUrls.current.clear();
  }, []);

  return { objectUrl, revokeObjectUrl };
}
