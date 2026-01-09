/*
 * ESP32 Remote Control – Live Party Wall
 * TFT 1.8" SPI 128x160
 * UI Console DJ / Régie événement
 */

 #include <WiFi.h>
 #include <HTTPClient.h>
 #include <ArduinoJson.h>
 #include <Adafruit_GFX.h>
 #include <Adafruit_ST7735.h>
 #include <SPI.h>
 #include <string.h>
 
 // ==================================================
 // TFT CONFIG
 // ==================================================
 #define TFT_CS   15
 #define TFT_DC   2
 #define TFT_RST  4
 
 Adafruit_ST7735 tft = Adafruit_ST7735(TFT_CS, TFT_DC, TFT_RST);
 
// ==================================================
// DJ UI COLORS (utilise uniquement couleurs existantes)
// ==================================================
#define DJ_BG        ST7735_BLACK
#define DJ_PANEL     ST7735_BLUE
#define DJ_ACCENT    ST7735_MAGENTA
#define DJ_GREEN     ST7735_GREEN
#define DJ_RED       ST7735_RED
#define DJ_YELLOW    ST7735_YELLOW
#define DJ_TEXT      ST7735_WHITE
#define DJ_CYAN      0x07FF  // Cyan custom (RGB 565)
#define DJ_ORANGE    0xFD20  // Orange custom (RGB 565)
 
 // ==================================================
 // WIFI
 // ==================================================
 const char* WIFI_SSID     = "Bbox-4C3BF6DA";
 const char* WIFI_PASSWORD = "2PapyAndreMarcelOise";
 
 // ==================================================
 // SUPABASE
 // ==================================================
 const char* SUPABASE_URL      = "https://izkytczkzkqxvylujwqo.supabase.co";
 const char* SUPABASE_ANON_KEY = "sb_publishable_9n9o9TS-jhYexS2_XypICg_S7_VPuh3";
 const char* EVENT_ID          = "345c0eef-bdd8-40d5-a75a-24c836beebdc";
 
 // ==================================================
 // BUTTONS
 // ==================================================
 #define BUTTON_AUTO_SCROLL   14
 #define BUTTON_AR_EFFECT     27
 #define BUTTON_QR_CODES      26
 #define BUTTON_RANDOM_PHOTO  25
 #define BUTTON_CLOSE_RANDOM  33
 
 #define DEBOUNCE_DELAY 50
 
 struct Button {
   uint8_t pin;
   const char* command;
   const char* label;
   bool lastState;
 };
 
 Button buttons[] = {
   {BUTTON_AUTO_SCROLL,  "TOGGLE_AUTO_SCROLL", "AUTO SCROLL", HIGH},
   {BUTTON_AR_EFFECT,    "TRIGGER_AR_EFFECT",  "AR EFFECT", HIGH},
   {BUTTON_QR_CODES,     "TOGGLE_QR_CODES",    "QR CODES", HIGH},
   {BUTTON_RANDOM_PHOTO, "SHOW_RANDOM_PHOTO",  "RANDOM PHOTO", HIGH},
   {BUTTON_CLOSE_RANDOM, "CLOSE_RANDOM_PHOTO", "CLOSE PHOTO", HIGH}
 };
 
 const uint8_t NUM_BUTTONS = sizeof(buttons) / sizeof(Button);
 
// ==================================================
// UI – HEADER DJ (Design Premium)
// ==================================================
void drawDJHeader() {
  // Fond avec dégradé (simulé avec panneaux)
  tft.fillRect(0, 0, 160, 20, DJ_BG);
  tft.fillRect(0, 0, 160, 16, DJ_PANEL);
  
  // Titre principal avec effet 3D
  tft.setTextColor(DJ_TEXT);
  tft.setCursor(5, 4);
  tft.setTextSize(1);
  tft.print("LIVE PARTY");
  
  // Sous-titre accentué
  tft.setTextColor(DJ_ACCENT);
  tft.setCursor(5, 12);
  tft.setTextSize(1);
  tft.print("WALL");
  
  // LEDs style régie professionnel (3 LEDs avec glow)
  uint16_t ledColors[] = {DJ_GREEN, DJ_YELLOW, DJ_RED};
  for (int i = 0; i < 3; i++) {
    int x = 125 + i * 11;
    // Glow externe
    tft.fillCircle(x, 10, 4, ledColors[i]);
    // LED centrale
    tft.fillCircle(x, 10, 2, DJ_TEXT);
  }
  
  // Ligne de séparation stylisée
  tft.drawFastHLine(0, 19, 160, DJ_ACCENT);
}
 
// ==================================================
// UI – LEVEL METER (Animation fluide style VU Meter)
// ==================================================
void drawLevelMeter() {
  tft.fillRect(6, 22, 148, 24, DJ_BG);
  tft.drawRoundRect(6, 22, 148, 24, 3, DJ_PANEL);
  
  // Barres verticales VU Meter avec gradient
  int barWidth = 4;
  int spacing = 1;
  int numBars = 20;
  int startX = 8;
  int startY = 24;
  int maxHeight = 20;
  
  for (int i = 0; i < numBars; i++) {
    int x = startX + i * (barWidth + spacing);
    int h = random(2, maxHeight + 1);
    
    // Gradient de couleur selon la hauteur (vert → jaune → rouge)
    uint16_t color;
    if (h < 7) {
      color = DJ_GREEN;
    } else if (h < 14) {
      color = DJ_YELLOW;
    } else {
      color = DJ_RED;
    }
    
    // Barre avec highlight
    int y = startY + maxHeight - h;
    tft.fillRect(x, y, barWidth, h, color);
    // Highlight en haut
    tft.drawFastHLine(x, y, barWidth, DJ_TEXT);
  }
  
  // Label stylisé
  tft.setTextColor(DJ_ACCENT);
  tft.setCursor(8, 24);
  tft.setTextSize(1);
  tft.print("ACTIVITY");
}
 
// ==================================================
// UI – NOW PLAYING (Design Premium)
// ==================================================
void drawNowPlaying(const char* label) {
  // Fond avec bordure double
  tft.fillRoundRect(6, 48, 148, 32, 4, DJ_BG);
  tft.drawRoundRect(6, 48, 148, 32, 4, DJ_PANEL);
  tft.fillRoundRect(7, 49, 146, 30, 3, DJ_PANEL);
  
  // Header "NOW PLAYING" avec accent
  tft.fillRoundRect(6, 48, 148, 11, 4, DJ_ACCENT);
  tft.setTextColor(DJ_TEXT);
  tft.setCursor(10, 50);
  tft.setTextSize(1);
  tft.print("NOW PLAYING");
  
  // Contenu avec scroll si nécessaire
  tft.setTextColor(DJ_TEXT);
  tft.setCursor(10, 62);
  tft.setTextSize(1);
  
  // Tronquer le label si trop long (max 18 caractères)
  char displayLabel[19];
  int len = strlen(label);
  if (len > 18) {
    strncpy(displayLabel, label, 15);
    displayLabel[15] = '.';
    displayLabel[16] = '.';
    displayLabel[17] = '.';
    displayLabel[18] = '\0';
  } else {
    strncpy(displayLabel, label, 18);
    displayLabel[len] = '\0';
  }
  tft.print(displayLabel);
  
  // Indicateur de lecture (pulsant) avec animation
  static uint8_t pulseCounter = 0;
  pulseCounter++;
  bool pulse = (pulseCounter / 5) % 2;
  tft.fillCircle(145, 62, 3, pulse ? DJ_GREEN : DJ_BG);
  tft.drawCircle(145, 62, 3, DJ_GREEN);
}
 
// ==================================================
// UI – STATUS BAR (Design Compact et Informatif)
// ==================================================
void drawStatusBar(bool wifiOK) {
  tft.fillRect(0, 82, 160, 46, DJ_BG);
  tft.drawFastHLine(0, 82, 160, DJ_PANEL);
  
  // Ligne 1: STATUS READY
  tft.setTextColor(DJ_TEXT);
  tft.setCursor(6, 86);
  tft.setTextSize(1);
  tft.print("STATUS");
  
  // LED READY avec glow effect
  tft.fillCircle(58, 88, 4, DJ_GREEN);
  tft.fillCircle(58, 88, 2, DJ_TEXT);
  tft.setCursor(66, 86);
  tft.print("READY");
  
  // Ligne 2: WIFI avec signal strength
  tft.setCursor(6, 96);
  tft.print("WIFI");
  uint16_t wifiColor = wifiOK ? DJ_GREEN : DJ_RED;
  tft.fillCircle(58, 98, 4, wifiColor);
  tft.fillCircle(58, 98, 2, DJ_TEXT);
  
  // Signal strength bars (si WiFi OK)
  if (wifiOK) {
    int rssi = WiFi.RSSI();
    int bars = 0;
    if (rssi > -50) bars = 4;
    else if (rssi > -60) bars = 3;
    else if (rssi > -70) bars = 2;
    else if (rssi > -80) bars = 1;
    
    int barX = 66;
    int barY = 96;
    for (int i = 0; i < bars; i++) {
      int barH = (i + 1) * 2;
      tft.fillRect(barX + i * 3, barY + 4 - barH, 2, barH, DJ_GREEN);
    }
  } else {
    tft.setCursor(66, 96);
    tft.print("OFF");
  }
  
  // Ligne 3: IP Address (compact)
  if (wifiOK) {
    IPAddress ip = WiFi.localIP();
    tft.setCursor(6, 106);
    tft.setTextColor(DJ_ACCENT);
    tft.setTextSize(1);
    // Format compact: 192.168.1.69
    tft.print(ip[0]);
    tft.print(".");
    tft.print(ip[1]);
    tft.print(".");
    tft.print(ip[2]);
    tft.print(".");
    tft.print(ip[3]);
  } else {
    tft.setCursor(6, 106);
    tft.setTextColor(DJ_RED);
    tft.print("DISCONNECTED");
  }
  
  // Ligne 4: Event ID (tronqué)
  tft.setCursor(6, 116);
  tft.setTextColor(DJ_PANEL);
  tft.setTextSize(1);
  tft.print("EVENT: ");
  // Afficher les 8 premiers caractères de l'event ID
  String eventShort = String(EVENT_ID).substring(0, 8);
  tft.print(eventShort);
  
  // Ligne de séparation bas
  tft.drawFastHLine(0, 127, 160, DJ_PANEL);
}
 
// ==================================================
// UI – ACTION FEEDBACK (Animation Premium)
// ==================================================
void showDJAction(const char* label, bool success) {
  uint16_t flashColor = success ? DJ_GREEN : DJ_RED;
  uint16_t borderColor = success ? DJ_GREEN : DJ_RED;
  
  // Animation zoom-in avec bordure
  for (int i = 0; i < 4; i++) {
    int offset = i * 3;
    tft.drawRoundRect(15 - offset, 35 - offset, 130 + offset*2, 90 + offset*2, 6, flashColor);
    delay(25);
  }
  
  // Flash complet avec effet
  tft.fillScreen(flashColor);
  delay(60);
  
  // Retour à l'interface
  tft.fillScreen(DJ_BG);
  
  // Redessiner l'interface complète
  drawDJHeader();
  drawLevelMeter();
  drawNowPlaying(label);
  drawStatusBar(success);
  
  // Message de feedback stylisé
  tft.fillRect(0, 128, 160, 32, DJ_BG);
  tft.fillRoundRect(35, 130, 90, 28, 4, DJ_BG);
  tft.drawRoundRect(35, 130, 90, 28, 4, borderColor);
  tft.fillRoundRect(36, 131, 88, 26, 3, borderColor);
  
  tft.setTextColor(DJ_TEXT);
  tft.setCursor(45, 138);
  tft.setTextSize(1);
  if (success) {
    tft.print("OK");
    // Checkmark symbolique
    tft.fillCircle(75, 138, 2, DJ_TEXT);
  } else {
    tft.print("ERROR");
  }
  
  delay(400);
  
  // Effacer le message de feedback
  tft.fillRect(0, 128, 160, 32, DJ_BG);
  drawStatusBar(success);
}
 
 // ==================================================
 // WIFI
 // ==================================================
 void connectWiFi() {
   if (WiFi.status() == WL_CONNECTED) return;
 
   WiFi.mode(WIFI_STA);
   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
 
   unsigned long start = millis();
   while (WiFi.status() != WL_CONNECTED && millis() - start < 15000) {
     delay(300);
   }
 }
 
 // ==================================================
 // SUPABASE
 // ==================================================
 bool sendCommand(const char* command, const char* label) {
   if (WiFi.status() != WL_CONNECTED) {
     showDJAction("WIFI OFF", false);
     return false;
   }
 
   HTTPClient http;
   http.begin(String(SUPABASE_URL) + "/rest/v1/remote_commands");
   http.addHeader("Content-Type", "application/json");
   http.addHeader("apikey", SUPABASE_ANON_KEY);
   http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
 
   StaticJsonDocument<256> doc;
   doc["event_id"] = EVENT_ID;
   doc["command_type"] = command;
   doc["processed"] = false;
 
   String payload;
   serializeJson(doc, payload);
 
   int code = http.POST(payload);
   http.end();
 
   bool ok = (code >= 200 && code < 300);
   showDJAction(label, ok);
   return ok;
 }
 
 // ==================================================
 // SETUP
 // ==================================================
 void setup() {
   Serial.begin(115200);
 
   tft.initR(INITR_BLACKTAB);
   tft.setRotation(1);
   tft.fillScreen(DJ_BG);
 
  // Écran de démarrage
  drawDJHeader();
  drawLevelMeter();
  drawNowPlaying("INITIALIZING...");
  drawStatusBar(false);
 
   for (uint8_t i = 0; i < NUM_BUTTONS; i++) {
     pinMode(buttons[i].pin, INPUT_PULLUP);
     buttons[i].lastState = digitalRead(buttons[i].pin);
   }
 
   connectWiFi();
 }
 
 // ==================================================
 // LOOP
 // ==================================================
 void loop() {
   static unsigned long lastWiFiCheck = 0;
   static unsigned long lastAnim = 0;
 
   // check WiFi toutes les 10s
   if (millis() - lastWiFiCheck > 10000) {
     connectWiFi();
     lastWiFiCheck = millis();
   }
 
  // animation level meter toutes les 200ms (plus fluide)
  if (millis() - lastAnim > 200) {
    drawLevelMeter();
    drawStatusBar(WiFi.status() == WL_CONNECTED);
    lastAnim = millis();
  }
 
   // lecture boutons
   for (uint8_t i = 0; i < NUM_BUTTONS; i++) {
     bool state = digitalRead(buttons[i].pin);
 
     if (state != buttons[i].lastState) {
       delay(DEBOUNCE_DELAY);
       state = digitalRead(buttons[i].pin);
 
       if (state == LOW && buttons[i].lastState == HIGH) {
         sendCommand(buttons[i].command, buttons[i].label);
       }
       buttons[i].lastState = state;
     }
   }
 }
 