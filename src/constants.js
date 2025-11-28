// Game layout constants
export const GAME_WIDTH = 320;
export const BANNER_HEIGHT = 30; // Top safe area for iPhone notch/dynamic island
export const GAME_HEIGHT = 288;  // Main game/map area
export const UI_HEIGHT = 200;    // Bottom UI panel
export const DPAD_HEIGHT = 120;  // D-pad controls area at bottom
export const TOTAL_HEIGHT = BANNER_HEIGHT + GAME_HEIGHT + UI_HEIGHT + DPAD_HEIGHT;  // 638

// UI Panel boundaries (offset by banner)
export const UI_PANEL_Y = BANNER_HEIGHT + GAME_HEIGHT;  // Where UI panel starts
export const UI_PANEL_CENTER_Y = BANNER_HEIGHT + GAME_HEIGHT + (UI_HEIGHT / 2);  // Center of UI panel

// Common UI positions within the panel
export const UI_TEXT_START_Y = BANNER_HEIGHT + GAME_HEIGHT + 20;  // First line of text in UI
export const UI_COMMANDS_Y = BANNER_HEIGHT + GAME_HEIGHT + 100;   // Command buttons area
