export function reconstructChallengeRating(dateSerial: number): { match: string | null, ambiguous: string[] } {
  // Only process realistic current-era dates (approx 1999 to 2036)
  if (dateSerial < 40000 || dateSerial > 50000) {
    return { match: null, ambiguous: [] };
  }

  // Google Sheets epoch is December 30, 1899
  const epoch = new Date(Date.UTC(1899, 11, 30)); 
  const targetDate = new Date(epoch.getTime() + dateSerial * 86400000);
  
  const m = targetDate.getUTCMonth() + 1;
  const d = targetDate.getUTCDate();
  
  const v1 = `${m}/${d}`;
  const v2 = `${d}/${m}`;
  
  const validCRs = ['1/8', '1/4', '1/2'];
  const v1Valid = validCRs.includes(v1);
  const v2Valid = validCRs.includes(v2);
  
  if (v1Valid && !v2Valid) return { match: v1, ambiguous: [] };
  if (v2Valid && !v1Valid) return { match: v2, ambiguous: [] };
  if (v1Valid && v2Valid) return { match: null, ambiguous: [v1, v2] };
  
  return { match: null, ambiguous: [] };
}
