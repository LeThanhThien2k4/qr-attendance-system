import { useEffect, useState } from "react";

/**
 * Hook lấy vị trí GPS hiện tại của thiết bị
 * @param {boolean} enabled - chỉ bật khi cần
 */
export default function useGeo(enabled) {
  const [state, setState] = useState({
    loading: enabled,
    coords: null,
    error: null,
  });

  useEffect(() => {
    if (!enabled) return;

    if (!navigator.geolocation) {
      setState({
        loading: false,
        coords: null,
        error: "Trình duyệt không hỗ trợ GPS",
      });
      return;
    }

    const watcher = navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          loading: false,
          coords: {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          },
          error: null,
        });
      },
      (err) => {
        setState({ loading: false, coords: null, error: err.message });
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );

    return () => clearTimeout(watcher);
  }, [enabled]);

  return state;
}
