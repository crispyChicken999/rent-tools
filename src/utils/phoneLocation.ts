/**
 * 手机号归属地查询工具
 */

export interface PhoneLocationInfo {
  province: string;
  city: string;
  sp: string; // 运营商
}

/**
 * 查询手机号归属地
 * @param phoneNumber 手机号码
 * @returns 归属地信息，查询失败返回空字符串
 */
export async function queryPhoneLocation(phoneNumber: string): Promise<string> {
  if (!phoneNumber || phoneNumber.trim().length === 0) {
    return "";
  }

  // 移除空格和特殊字符
  const cleanPhone = phoneNumber.replace(/\s+|-/g, "");

  // 验证是否为有效的手机号（11位数字）
  if (!/^1\d{10}$/.test(cleanPhone)) {
    return "";
  }

  try {
    const response = await fetch(
      `https://uapis.cn/api/v1/misc/phoneinfo?phone=${cleanPhone}`
    );

    if (!response.ok) {
      console.error("Phone location query failed:", response.statusText);
      return "";
    }

    const data: PhoneLocationInfo = await response.json();

    if (data.province && data.city) {
      const { province, city } = data;
      // 如果省份和城市相同（如北京），只显示一次
      return province === city ? city : `${province} ${city}`;
    }

    return "";
  } catch (error) {
    console.error("Error querying phone location:", error);
    return "";
  }
}

/**
 * 批量查询手机号归属地
 * @param phoneNumbers 手机号数组
 * @param onProgress 进度回调
 * @returns 归属地信息数组
 */
export async function batchQueryPhoneLocation(
  phoneNumbers: string[],
  onProgress?: (current: number, total: number) => void
): Promise<string[]> {
  const results: string[] = [];

  for (let i = 0; i < phoneNumbers.length; i++) {
    const location = await queryPhoneLocation(phoneNumbers[i]);
    results.push(location);

    if (onProgress) {
      onProgress(i + 1, phoneNumbers.length);
    }

    // 添加延迟以避免请求过快
    if (i < phoneNumbers.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  return results;
}
