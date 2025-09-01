import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Languages } from "lucide-react";

const LANGUAGES = [
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली' },
  { code: 'gbm', name: 'Garhwali', nativeName: 'गढ़वाली' },
  { code: 'jns', name: 'Jaunsari', nativeName: 'जौनसारी' },
  { code: 'rnp', name: 'Rongpo', nativeName: 'Rongpo' },
  { code: 'kfy', name: 'Kumaoni', nativeName: 'कुमाऊँनी' },
  { code: 'gbj', name: 'Gutob', nativeName: 'Gutob' },
  { code: 'srb', name: 'Sora', nativeName: 'Sora' },
  { code: 'juy', name: 'Juray', nativeName: 'Juray' },
  { code: 'rji', name: 'Raji', nativeName: 'Raji' },
  { code: 'thq', name: 'Kochila Tharu', nativeName: 'Kochila Tharu' },
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी' },
];

interface LanguageSelectorProps {
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export const LanguageSelector = ({ selectedLanguage, onLanguageChange }: LanguageSelectorProps) => {
  const selectedLang = LANGUAGES.find(lang => lang.code === selectedLanguage);

  return (
    <div className="flex items-center gap-2">
      <Languages className="w-4 h-4 text-muted-foreground" />
      <Select value={selectedLanguage} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-48">
          <SelectValue>
            {selectedLang && (
              <span className="flex items-center gap-2">
                <span className="font-medium">{selectedLang.name}</span>
                <span className="text-sm text-muted-foreground">({selectedLang.code})</span>
              </span>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {LANGUAGES.map((language) => (
            <SelectItem key={language.code} value={language.code}>
              <div className="flex items-center justify-between w-full gap-3">
                <span className="font-medium">{language.name}</span>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{language.nativeName}</span>
                  <span>({language.code})</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};