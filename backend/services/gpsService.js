// Tính khoảng cách giữa 2 toạ độ GPS (đơn vị: mét)
export const calcDistance = (coordA, coordB) => {
  const toRad = (v) => (v * Math.PI) / 180;
  const R = 6371e3; // bán kính Trái Đất (m)

  const φ1 = toRad(coordA.lat);
  const φ2 = toRad(coordB.lat);
  const Δφ = toRad(coordB.lat - coordA.lat);
  const Δλ = toRad(coordB.lng - coordA.lng);

  const a =
    Math.sin(Δφ / 2) ** 2 +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d; // khoảng cách tính theo mét
};

// Kiểm tra hợp lệ trong bán kính
export const isWithinRadius = (coordA, coordB, radius) => {
  const dist = calcDistance(coordA, coordB);
  return dist <= radius;
};
