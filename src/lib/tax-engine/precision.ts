import Decimal from 'decimal.js';

// Configure high precision for tax arithmetic
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Creates a high precision Decimal instance from number or string.
 */
export function D(value: number | string | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Section 288B of Income Tax Act: Round off total taxable income or tax liability to nearest multiple of ₹10.
 * If the last digit is 5 or more, rounded to next higher multiple of 10; otherwise to lower multiple.
 */
export function roundToNearest10(value: Decimal | number): number {
  const d = D(value);
  return d.dividedBy(10).round().times(10).toNumber();
}

/**
 * Standard rounding to 2 decimal places for financial reporting.
 */
export function roundCurrency(value: Decimal | number): number {
  return D(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}
