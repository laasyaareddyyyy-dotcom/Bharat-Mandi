import { Language } from '../types';

export interface IndianLanguage {
  code: Language;
  nativeName: string;
  englishName: string;
  region: string;
  script: string;
  flagSymbol: string;
}

export const INDIAN_LANGUAGES: IndianLanguage[] = [
  {
    code: 'en',
    nativeName: 'English',
    englishName: 'English',
    region: 'National / All India',
    script: 'Latin',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'hi',
    nativeName: 'हिंदी',
    englishName: 'Hindi',
    region: 'North & Central India',
    script: 'Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'te',
    nativeName: 'తెలుగు',
    englishName: 'Telugu',
    region: 'Andhra Pradesh & Telangana',
    script: 'Telugu',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'kn',
    nativeName: 'ಕನ್ನಡ',
    englishName: 'Kannada',
    region: 'Karnataka',
    script: 'Kannada',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'ta',
    nativeName: 'தமிழ்',
    englishName: 'Tamil',
    region: 'Tamil Nadu & Puducherry',
    script: 'Tamil',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'mr',
    nativeName: 'मराठी',
    englishName: 'Marathi',
    region: 'Maharashtra & Goa',
    script: 'Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'gu',
    nativeName: 'ગુજરાતી',
    englishName: 'Gujarati',
    region: 'Gujarat & Daman',
    script: 'Gujarati',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'bn',
    nativeName: 'বাংলা',
    englishName: 'Bengali',
    region: 'West Bengal & Tripura',
    script: 'Bengali',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'pa',
    nativeName: 'ਪੰਜਾਬੀ',
    englishName: 'Punjabi',
    region: 'Punjab & Chandigarh',
    script: 'Gurmukhi',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'ml',
    nativeName: 'മലയാളം',
    englishName: 'Malayalam',
    region: 'Kerala & Lakshadweep',
    script: 'Malayalam',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'or',
    nativeName: 'ଓଡ଼ିଆ',
    englishName: 'Odia',
    region: 'Odisha',
    script: 'Odia',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'as',
    nativeName: 'অসমীয়া',
    englishName: 'Assamese',
    region: 'Assam',
    script: 'Bengali-Assamese',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'ur',
    nativeName: 'اردو',
    englishName: 'Urdu',
    region: 'Jammu & Kashmir, UP, Telangana, Bihar',
    script: 'Perso-Arabic',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'mai',
    nativeName: 'मैथिली',
    englishName: 'Maithili',
    region: 'Bihar & Jharkhand',
    script: 'Devanagari / Mithilakshar',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'sat',
    nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ',
    englishName: 'Santali',
    region: 'Jharkhand, Odisha, West Bengal',
    script: 'Ol Chiki',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'ks',
    nativeName: 'कॉशुर / کٲشُر',
    englishName: 'Kashmiri',
    region: 'Jammu & Kashmir',
    script: 'Perso-Arabic / Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'ne',
    nativeName: 'नेपाली',
    englishName: 'Nepali',
    region: 'Sikkim & West Bengal',
    script: 'Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'kok',
    nativeName: 'कोंकणी',
    englishName: 'Konkani',
    region: 'Goa, Karnataka, Maharashtra',
    script: 'Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'doi',
    nativeName: 'डोगरी',
    englishName: 'Dogri',
    region: 'Jammu & Kashmir & Himachal Pradesh',
    script: 'Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'mni',
    nativeName: 'ꯃꯦꯇꯩꯂꯣꯟ',
    englishName: 'Manipuri (Meitei)',
    region: 'Manipur',
    script: 'Meitei Mayek / Bengali',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'brx',
    nativeName: 'बड़ो',
    englishName: 'Bodo',
    region: 'Assam (Bodoland)',
    script: 'Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'sa',
    nativeName: 'संस्कृतम्',
    englishName: 'Sanskrit',
    region: 'Pan-India',
    script: 'Devanagari',
    flagSymbol: '🇮🇳'
  },
  {
    code: 'sd',
    nativeName: 'सिंधी / سنڌي',
    englishName: 'Sindhi',
    region: 'Gujarat, Rajasthan, Maharashtra',
    script: 'Devanagari / Perso-Arabic',
    flagSymbol: '🇮🇳'
  }
];

export function getLanguageInfo(code: Language): IndianLanguage {
  return (
    INDIAN_LANGUAGES.find((lang) => lang.code === code) || INDIAN_LANGUAGES[0]
  );
}
