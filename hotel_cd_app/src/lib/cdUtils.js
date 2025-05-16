/**
 * Formats a date string (YYYY-MM-DD) or Date object into MM月DD日 format.
 * @param {string | Date} dateInput - The date to format.
 * @returns {string} Formatted date string or '无效日期' if input is not valid.
 */
function formatDateToMMDD(dateInput) {
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return '无效日期';
  }
  const month = date.getMonth() + 1; // getMonth() is 0-indexed
  const day = date.getDate();
  return `${String(month).padStart(2, '0')}月${String(day).padStart(2, '0')}日`;
}

/**
 * Calculates the Cooldown (CD) information for a hotel entry.
 * @param {string} checkInDateString - The check-in date in ISO 8601 format (e.g., "2025-12-31").
 * @param {number} [customCD] - Optional custom CD in days.
 * @param {number} defaultCD - Default CD in days (e.g., 30).
 * @returns {{ cdEndDate: string, daysRemaining: number, isActive: boolean, cdPeriod: number, formattedCheckInDate: string, error?: string }}
 */
export function calculateCDInfo(checkInDateString, customCD, defaultCD) {
  const cdPeriodToUse = customCD !== null && customCD !== undefined && !isNaN(parseInt(customCD)) ? parseInt(customCD) : defaultCD;
  
  // Parse the checkInDateString as YYYY-MM-DD to local midnight
  const parts = checkInDateString.split('-');
  if (parts.length !== 3) {
    // console.error("Invalid check-in date string format:", checkInDateString);
    return { error: "入住日期格式无效", cdEndDate: "无效日期", daysRemaining: 0, isActive: false, cdPeriod: cdPeriodToUse, formattedCheckInDate: "无效日期" };
  }
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript Date
  const day = parseInt(parts[2], 10);

  const checkIn = new Date(year, month, day);
  if (isNaN(checkIn.getTime())) {
    // console.error("Parsed check-in date is invalid:", checkInDateString);
    return { error: "入住日期无效", cdEndDate: "无效日期", daysRemaining: 0, isActive: false, cdPeriod: cdPeriodToUse, formattedCheckInDate: "无效日期" };
  }

  const cdEndDate = new Date(checkIn);
  cdEndDate.setDate(checkIn.getDate() + cdPeriodToUse);

  const today = new Date();
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // Today at 00:00:00 local time

  // Ensure cdEndDate is also treated as 00:00:00 for fair comparison if it wasn't already
  const cdEndDateNormalized = new Date(cdEndDate.getFullYear(), cdEndDate.getMonth(), cdEndDate.getDate());

  const timeDiff = cdEndDateNormalized.getTime() - todayNormalized.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

  const isActive = daysRemaining > 0;

  return {
    cdEndDate: formatDateToMMDD(cdEndDateNormalized),
    daysRemaining: isActive ? daysRemaining : 0,
    isActive,
    cdPeriod: cdPeriodToUse,
    formattedCheckInDate: formatDateToMMDD(checkIn) 
  };
}

/**
 * Adds CD information (with formatted dates) to a hotel entry or a list of hotel entries.
 * @param {Object | Array<Object>} hotelData - A single hotel entry object or an array of hotel entry objects.
 * @returns {Object | Array<Object>} The hotel data with cdInfo, including formatted dates.
 */
export function addCDInfoToHotelData(hotelData) {
  const processEntry = (entry) => {
    if (!entry || !entry.checkInDate || entry.defaultCD === undefined || entry.defaultCD === null) { 
      // console.warn("Skipping entry due to missing checkInDate or defaultCD:", entry);
      return { 
        ...entry, 
        cdInfo: { error: "缺少计算CD所需信息", cdEndDate: "无效日期", daysRemaining: 0, isActive: false, cdPeriod: entry.defaultCD || 30, formattedCheckInDate: entry.checkInDate ? formatDateToMMDD(entry.checkInDate) : '无效日期' },
        formattedCheckInDate: entry.checkInDate ? formatDateToMMDD(entry.checkInDate) : '无效日期' 
      };
    }
    try {
      const cdInfoResult = calculateCDInfo(entry.checkInDate, entry.customCD, entry.defaultCD);
      return { ...entry, cdInfo: cdInfoResult, formattedCheckInDate: cdInfoResult.formattedCheckInDate };
    }
    catch (error) {
        // console.error("Error calculating CD for entry:", entry, error);
        return { 
          ...entry, 
          cdInfo: { error: error.message, cdEndDate: "计算错误", daysRemaining: 0, isActive: false, cdPeriod: entry.defaultCD, formattedCheckInDate: formatDateToMMDD(entry.checkInDate) }, 
          formattedCheckInDate: formatDateToMMDD(entry.checkInDate) 
        };
    }
  };

  if (Array.isArray(hotelData)) {
    return hotelData.map(processEntry);
  } else if (hotelData) {
    return processEntry(hotelData);
  } else {
    return null; // Or handle as appropriate
  }
}

export { formatDateToMMDD };

