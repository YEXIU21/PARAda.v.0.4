export interface ThemeColors {
  background: string;
  card: string;
  primary: string;
  secondary: string;
  text: string;
  textSecondary: string;
  border: string;
  marker: string;
  error: string;
  success: string;
  warning: string;
  gradientColors: readonly [string, string];
  cardShadow: string;
  inputBackground: string;
  modalOverlay: string;
  divider: string;
  activeItem: string;
  inactiveItem: string;
}

export interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: ThemeColors;
} 