// Game layout constants
export const GAME_WIDTH = 320;
export const GAME_HEIGHT = 288;  // Main game/map area
export const UI_HEIGHT = 200;    // Bottom UI panel
export const TOTAL_HEIGHT = GAME_HEIGHT + UI_HEIGHT;  // 488

// UI Panel boundaries
export const UI_PANEL_Y = GAME_HEIGHT;  // Where UI panel starts (288)
export const UI_PANEL_CENTER_Y = GAME_HEIGHT + (UI_HEIGHT / 2);  // Center of UI panel (388)

// Common UI positions within the panel
export const UI_TEXT_START_Y = GAME_HEIGHT + 20;  // First line of text in UI
export const UI_COMMANDS_Y = GAME_HEIGHT + 100;   // Command buttons area
