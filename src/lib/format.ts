/**
 * 通用日期格式化工具
 *
 * 统一全站日期显示格式，避免各页面内联定义重复的 formatDate / formatDateRange。
 */

export function formatDate(value: Date) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(value);
}

export function formatDateRange(startDate: Date, endDate: Date) {
  return `${formatDate(startDate)} - ${formatDate(endDate)}`;
}
