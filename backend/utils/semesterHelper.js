export function getCurrentSemester() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  // Mỗi kỳ 4 tháng
  let semesterIndex;
  if (month >= 9 && month <= 12) semesterIndex = 1; // K1: Sep–Dec
  else if (month >= 1 && month <= 4) semesterIndex = 2; // K2: Jan–Apr
  else semesterIndex = 3; // K3: May–Aug

  // Nếu là tháng 9–12 thì năm học là "năm nay - năm sau"
  const schoolYear =
    month >= 9
      ? `${year}-${year + 1}`
      : `${year - 1}-${year}`;

  return `${schoolYear}_K${semesterIndex}`;
}
