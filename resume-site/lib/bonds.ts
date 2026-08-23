export type Bond = {
  isin: string;
  issuer: string;
  securityName: string;
  coupon: number;
  maturity: string;
  faceValue: number;
  rating: string;
  sector: string;
  duration: number;
  price: number;
  yield: number;
};

export const bonds: Bond[] = [
  ["INE001A08024", "HDFC Bank Limited", "HDFC Bank 7.95% 2031 Senior Bond", 7.95, "2031-08-15", 1000, "AAA", "Financial Services", 4.62, 1018.5, 7.58],
  ["INE001A08032", "HDFC Bank Limited", "HDFC Bank 8.10% 2033 Infrastructure Bond", 8.1, "2033-03-20", 1000, "AAA", "Financial Services", 5.75, 1026.4, 7.62],
  ["INE002A08018", "Reliance Industries Limited", "Reliance Industries 7.65% 2030 Bond", 7.65, "2030-11-10", 1000, "AAA", "Energy", 3.82, 1009.25, 7.39],
  ["INE020B08815", "Rural Electrification Corporation Limited", "REC 8.05% 2032 Bond", 8.05, "2032-09-18", 1000, "AAA", "Infrastructure", 5.21, 1023.7, 7.55],
  ["INE134E08KA2", "Power Finance Corporation Limited", "PFC 8.11% 2034 Bond", 8.11, "2034-01-25", 1000, "AAA", "Infrastructure", 6.37, 1028.9, 7.66],
  ["INE261F08AA1", "National Bank for Agriculture and Rural Development", "NABARD 7.58% 2031 Bond", 7.58, "2031-05-28", 1000, "AAA", "Government", 4.48, 1007.4, 7.39],
  ["INE053F07AB5", "Indian Railway Finance Corporation Limited", "IRFC 8.00% 2040 Bond", 8, "2040-07-30", 1000, "AAA", "Government", 10.42, 1029.75, 7.71],
  ["INE115A07AA4", "LIC Housing Finance Limited", "LIC Housing Finance 8.05% 2032 NCD", 8.05, "2032-02-14", 1000, "AAA", "Financial Services", 5.05, 1017.9, 7.72],
  ["INE121A08AA2", "Cholamandalam Investment and Finance Company", "Chola Finance 8.55% 2029 Secured NCD", 8.55, "2029-09-05", 1000, "AA+", "Financial Services", 2.81, 1014.1, 8.02],
  ["INE414G07AA6", "Muthoot Finance Limited", "Muthoot Finance 8.90% 2028 Secured NCD", 8.9, "2028-12-18", 1000, "AA", "Financial Services", 2.14, 1011.3, 8.35],
  ["INE296A07AA0", "Bajaj Finance Limited", "Bajaj Finance 8.18% 2031 NCD", 8.18, "2031-01-09", 1000, "AAA", "Financial Services", 4.17, 1020.6, 7.66],
  ["INE155A08357", "Tata Motors Limited", "Tata Motors 8.25% 2030 NCD", 8.25, "2030-06-17", 1000, "AA+", "Industrial", 3.55, 1013.25, 7.89],
  ["INE081A08AA7", "Tata Steel Limited", "Tata Steel 8.03% 2032 Bond", 8.03, "2032-11-02", 1000, "AA+", "Industrial", 5.45, 1009.9, 7.85],
  ["INE522F07AA8", "NTPC Limited", "NTPC 7.76% 2033 Bond", 7.76, "2033-08-08", 1000, "AAA", "Energy", 5.98, 1011.75, 7.55],
  ["INE733E07AA8", "Adani Ports and Special Economic Zone Limited", "Adani Ports 8.45% 2030 NCD", 8.45, "2030-10-03", 1000, "AA", "Infrastructure", 3.91, 1007.1, 8.22],
  ["INE148I07AA9", "Indiabulls Housing Finance Limited", "Indiabulls Housing 9.10% 2028 NCD", 9.1, "2028-06-29", 1000, "A", "Financial Services", 1.71, 988.75, 9.88],
  ["INE031B07AA9", "Axis Bank Limited", "Axis Bank 8.00% 2032 Basel III Bond", 8, "2032-07-05", 1000, "AA+", "Financial Services", 5.34, 1008.95, 7.82],
  ["INE090A08AA8", "ICICI Bank Limited", "ICICI Bank 7.85% 2031 Senior Bond", 7.85, "2031-10-19", 1000, "AAA", "Financial Services", 4.86, 1012.45, 7.54],
  ["INE095A07AA0", "IndusInd Bank Limited", "IndusInd Bank 8.35% 2029 Bond", 8.35, "2029-07-16", 1000, "AA+", "Financial Services", 2.68, 1004.1, 8.19],
  ["INE028A07AA5", "Bank of Baroda", "Bank of Baroda 7.99% 2034 Basel III Bond", 7.99, "2034-02-28", 1000, "AA+", "Financial Services", 6.45, 1007.55, 7.86],
  ["INE062A07AA7", "State Bank of India", "SBI 7.83% 2033 Infrastructure Bond", 7.83, "2033-09-21", 1000, "AAA", "Financial Services", 5.93, 1011.6, 7.6],
].map(([isin, issuer, securityName, coupon, maturity, faceValue, rating, sector, duration, price, latestYield]) => ({
  isin,
  issuer,
  securityName,
  coupon,
  maturity,
  faceValue,
  rating,
  sector,
  duration,
  price,
  yield: latestYield,
})) as Bond[];

export function findBond(isin: string) {
  return bonds.find((bond) => bond.isin === isin.toUpperCase());
}
