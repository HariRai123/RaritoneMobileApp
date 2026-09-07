export const COLORS = {
  background: "#FFFFFF",
  surface: "#F7F7F5",
  surfaceElevated: "#F1F1EF",
  primary: "#111111",
  secondary: "#5F5F5B",
  muted: "#8D8D87",
  border: "#E8E8E3",
  accent: "#111111",
  success: "#1E8E5A",
  warning: "#B7791F",
  danger: "#C53030",
  white: "#FFFFFF",
  black: "#000000",
  overlay: "rgba(0,0,0,0.42)",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  huge: 64,
};

export const RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 30,
  pill: 999,
};

export const FONT_SIZE = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 20,
  xxl: 26,
  xxxl: 34,
  display: 46,
};

export const FONT_WEIGHT = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
  extraBold: "800",
} as const;

export const SCREEN = {
  horizontalPadding: 20,
  maxContentWidth: 1200,
};

export const SHADOW = {
  card: {
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 3,
  },
};


// Backwards-compatible exports for the Expo starter components that remain in the project.
export const Colors = {
  light: { text: COLORS.primary, background: COLORS.background, backgroundElement: COLORS.surface, backgroundSelected: COLORS.surfaceElevated, textSecondary: COLORS.secondary },
  dark: { text: COLORS.white, background: COLORS.black, backgroundElement: COLORS.surface, backgroundSelected: COLORS.surfaceElevated, textSecondary: COLORS.secondary },
} as const;
export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;
export const Fonts = { sans: "normal", serif: "serif", rounded: "normal", mono: "monospace" };
export const Spacing = { half: 2, one: 4, two: 8, three: 16, four: 24, five: 32, six: 64 } as const;
export const BottomTabInset = 80;
export const MaxContentWidth = 800;
