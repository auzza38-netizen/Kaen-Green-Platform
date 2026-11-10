/**
 Converts a number to Thai Baht text representation
 Example: 1250.50 -> "หนึ่งพันสองร้อยห้าสิบบาทห้าสิบสตางค์"
*/
export function thaiBahtText(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return 'ศูนย์บาทถ้วน';

  // Format to 2 decimal places
  const numberStr = Math.abs(num).toFixed(2);
  const [integerPartStr, decimalPartStr] = numberStr.split('.');

  if (Number(integerPartStr) === 0 && Number(decimalPartStr) === 0) {
    return 'ศูนย์บาทถ้วน';
  }

  const numbers = ['ศูนย์', 'หนึ่ง', 'สอง', 'สาม', 'สี่', 'ห้า', 'หก', 'เจ็ด', 'แปด', 'เก้า'];
  const units = ['', 'สิบ', 'ร้อย', 'พัน', 'หมื่น', 'แสน'];

  function convertGroup(digits: string): string {
    let result = '';
    const length = digits.length;

    for (let i = 0; i < length; i++) {
      const digit = parseInt(digits[i], 10);
      const position = length - i - 1;

      if (digit !== 0) {
        if (position === 1 && digit === 1) {
          result += 'สิบ';
        } else if (position === 1 && digit === 2) {
          result += 'ยี่สิบ';
        } else if (position === 0 && digit === 1 && length > 1) {
          result += 'เอ็ด';
        } else {
          result += numbers[digit] + units[position];
        }
      }
    }
    return result;
  }

  function convertInteger(integerStr: string): string {
    if (Number(integerStr) === 0) return '';
    let result = '';
    let len = integerStr.length;

    while (len > 0) {
      const groupLen = len % 6 === 0 ? 6 : len % 6;
      const groupStr = integerStr.substring(0, groupLen);
      integerStr = integerStr.substring(groupLen);
      len = integerStr.length;

      const groupText = convertGroup(groupStr);
      result += groupText;
      if (len > 0) {
        result += 'ล้าน';
      }
    }
    return result;
  }

  let text = '';
  const intVal = parseInt(integerPartStr, 10);
  const decVal = parseInt(decimalPartStr, 10);

  if (intVal > 0) {
    text += convertInteger(integerPartStr) + 'บาท';
  }

  if (decVal > 0) {
    if (decVal === 10) {
      text += 'สิบสตางค์';
    } else {
      text += convertGroup(decimalPartStr) + 'สตางค์';
    }
  } else {
    text += 'ถ้วน';
  }

  if (num < 0) {
    text = 'ลบ' + text;
  }

  return text;
}
