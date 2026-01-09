/*
 * ESP32 Remote Control – Live Party Wall CLEAN PRO
 * TFT 1.8" SPI 128x160
 * UI Console DJ / Régie événement - Interface Simple & Professionnelle
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
 // PALETTE PROFESSIONNELLE MINIMALISTE
 // ==================================================
 #define COLOR_BG         0x0000  // Noir
 #define COLOR_PANEL      0x2945  // Gris foncé
 #define COLOR_BORDER     0x4A49  // Gris moyen
 #define COLOR_SUCCESS    0x07E0  // Vert
 #define COLOR_ERROR      0xF800  // Rouge
 #define COLOR_WARNING    0xFD20  // Orange
 #define COLOR_TEXT       0xFFFF  // Blanc
 #define COLOR_TEXT_DIM   0x7BEF  // Gris clair
 #define COLOR_ACCENT     0x051D  // Bleu foncé
  
 // ==================================================
 // WIFI & SUPABASE
 // ==================================================
 const char* WIFI_SSID     = "Bbox-4C3BF6DA";
 const char* WIFI_PASSWORD = "2PapyAndreMarcelOise";
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
 #define BUTTON_START_BATTLE  32
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
   {BUTTON_CLOSE_RANDOM, "CLOSE_RANDOM_PHOTO", "CLOSE PHOTO", HIGH},
   {BUTTON_START_BATTLE, "START_BATTLE",       "START BATTLE", HIGH}
 };
  
 const uint8_t NUM_BUTTONS = sizeof(buttons) / sizeof(Button);
 
 // Variables globales
 uint8_t vuMeterLevels[20];
 
 // ==================================================
 // UI – HEADER SIMPLE & PRO
 // ==================================================
 void drawHeader() {
   // Barre de titre sobre
   tft.fillRect(0, 0, 160, 18, COLOR_PANEL);
   tft.drawFastHLine(0, 18, 160, COLOR_BORDER);
   
   // Titre
   tft.setTextColor(COLOR_TEXT);
   tft.setTextSize(1);
   tft.setCursor(8, 5);
   tft.print("LIVE PARTY WALL");
   
   // Status indicator (simple LED)
   tft.fillCircle(148, 9, 4, COLOR_SUCCESS);
 }
 
 // ==================================================
 // UI – VU METER SIMPLE
 // ==================================================
 void drawVUMeter() {
   // Cadre simple
   tft.fillRect(4, 22, 152, 26, COLOR_BG);
   tft.drawRect(4, 22, 152, 26, COLOR_BORDER);
   
   // Label
   tft.setTextColor(COLOR_TEXT_DIM);
   tft.setTextSize(1);
   tft.setCursor(8, 25);
   tft.print("ACTIVITY");
   
   // VU Meter - barres simples
   int barWidth = 4;
   int spacing = 2;
   int numBars = 20;
   int startX = 8;
   int startY = 35;
   int maxHeight = 10;
   
   // Initialiser si nécessaire
   static bool initialized = false;
   if (!initialized) {
     for (int i = 0; i < 20; i++) {
       vuMeterLevels[i] = random(2, maxHeight + 1);
     }
     initialized = true;
   }
   
   // Mise à jour smooth
   for (int i = 0; i < numBars; i++) {
     if (vuMeterLevels[i] > 2) {
       vuMeterLevels[i] -= random(0, 2);
     }
     if (random(100) < 10) {
       vuMeterLevels[i] = random(6, maxHeight + 1);
     }
     
     int x = startX + i * (barWidth + spacing);
     int h = vuMeterLevels[i];
     
     // Couleur simple selon hauteur
     uint16_t color;
     if (h < 4) color = COLOR_SUCCESS;
     else if (h < 7) color = COLOR_WARNING;
     else color = COLOR_ERROR;
     
     int y = startY + maxHeight - h;
     tft.fillRect(x, y, barWidth, h, color);
   }
 }
 
 // ==================================================
 // UI – NOW PLAYING SIMPLE
 // ==================================================
 void drawNowPlaying(const char* label) {
   // Cadre simple
   tft.fillRect(4, 52, 152, 28, COLOR_BG);
   tft.drawRect(4, 52, 152, 28, COLOR_BORDER);
   
   // Header
   tft.fillRect(4, 52, 152, 10, COLOR_PANEL);
   tft.setTextColor(COLOR_TEXT_DIM);
   tft.setTextSize(1);
   tft.setCursor(8, 54);
   tft.print("NOW PLAYING");
   
   // Contenu
   tft.setTextColor(COLOR_TEXT);
   tft.setCursor(8, 66);
   
   // Tronquer si trop long
   char displayLabel[23];
   int len = strlen(label);
   if (len > 22) {
     strncpy(displayLabel, label, 19);
     displayLabel[19] = '.';
     displayLabel[20] = '.';
     displayLabel[21] = '.';
     displayLabel[22] = '\0';
   } else {
     strncpy(displayLabel, label, 22);
     displayLabel[len] = '\0';
   }
   tft.print(displayLabel);
 }
 
 // ==================================================
 // UI – STATUS BAR PROPRE
 // ==================================================
 void drawStatus(bool wifiOK) {
   int statusY = 84;
   
   // Ligne de séparation
   tft.drawFastHLine(0, statusY, 160, COLOR_BORDER);
   
   // Fond
   tft.fillRect(0, statusY + 1, 160, 44, COLOR_BG);
   
   // WiFi Status
   tft.setTextColor(COLOR_TEXT_DIM);
   tft.setTextSize(1);
   tft.setCursor(8, statusY + 5);
   tft.print("WiFi:");
   
   if (wifiOK) {
     int rssi = WiFi.RSSI();
     
     // Signal strength
     tft.setTextColor(COLOR_TEXT);
     tft.setCursor(38, statusY + 5);
     
     if (rssi > -50) tft.print("Excellent");
     else if (rssi > -60) tft.print("Good");
     else if (rssi > -70) tft.print("Fair");
     else tft.print("Weak");
     
     // Barres de signal
     int barX = 110;
     int barY = statusY + 5;
     for (int i = 0; i < 4; i++) {
       bool filled = (rssi > (-80 + i * 10));
       uint16_t color = filled ? COLOR_SUCCESS : COLOR_PANEL;
       int barH = (i + 1) * 2;
       tft.fillRect(barX + i * 4, barY + 8 - barH, 3, barH, color);
     }
   } else {
     tft.setTextColor(COLOR_ERROR);
     tft.setCursor(38, statusY + 5);
     tft.print("Disconnected");
   }
   
   // System Status
   tft.setTextColor(COLOR_TEXT_DIM);
   tft.setCursor(8, statusY + 17);
   tft.print("System:");
   
   bool sysReady = wifiOK;
   tft.setTextColor(sysReady ? COLOR_SUCCESS : COLOR_WARNING);
   tft.setCursor(50, statusY + 17);
   tft.print(sysReady ? "Ready" : "Initializing");
   
   // IP Address
   if (wifiOK) {
     tft.setTextColor(COLOR_TEXT_DIM);
     tft.setCursor(8, statusY + 29);
     tft.print("IP:");
     
     IPAddress ip = WiFi.localIP();
     tft.setTextColor(COLOR_TEXT);
     tft.setCursor(26, statusY + 29);
     char ipStr[16];
     sprintf(ipStr, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
     tft.print(ipStr);
   }
 }
 
 // ==================================================
 // UI – SPLASH SCREEN SIMPLE
 // ==================================================
 void drawSplash() {
   tft.fillScreen(COLOR_BG);
   
   // Logo simple - rectangle avec texte centré
   tft.fillRect(30, 30, 100, 60, COLOR_PANEL);
   tft.drawRect(30, 30, 100, 60, COLOR_BORDER);
   
   // Titre
   tft.setTextColor(COLOR_TEXT);
   tft.setTextSize(2);
   tft.setCursor(38, 45);
   tft.print("LIVE");
   tft.setCursor(38, 65);
   tft.print("PARTY");
   
   // Sous-titre
   tft.setTextSize(1);
   tft.setTextColor(COLOR_TEXT_DIM);
   tft.setCursor(50, 100);
   tft.print("ESP32 Remote");
   
   // Version
   tft.setCursor(60, 115);
   tft.print("v2.0");
 }
 
 // ==================================================
 // UI – ACTION FEEDBACK SIMPLE
 // ==================================================
 void showFeedback(const char* label, bool success) {
   uint16_t color = success ? COLOR_SUCCESS : COLOR_ERROR;
   
   // Flash rapide
   tft.fillRect(0, 60, 160, 30, color);
   delay(100);
   tft.fillRect(0, 60, 160, 30, COLOR_BG);
   
   // Redessiner interface
   drawHeader();
   drawVUMeter();
   drawNowPlaying(label);
   drawStatus(success);
   
   // Message simple
   tft.fillRect(30, 60, 100, 20, COLOR_PANEL);
   tft.drawRect(30, 60, 100, 20, color);
   
   tft.setTextColor(COLOR_TEXT);
   tft.setTextSize(1);
   tft.setCursor(45, 67);
   tft.print(success ? "SUCCESS" : "ERROR");
   
   delay(800);
   
   // Effacer message
   tft.fillRect(30, 60, 100, 20, COLOR_BG);
   drawNowPlaying(label);
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
     showFeedback("WIFI OFF", false);
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
   showFeedback(label, ok);
   return ok;
 }
 
 // ==================================================
 // SETUP
 // ==================================================
 void setup() {
   Serial.begin(115200);
   
   tft.initR(INITR_BLACKTAB);
   tft.setRotation(1);
   tft.fillScreen(COLOR_BG);
   
   // Splash screen simple - 2 secondes
   drawSplash();
   delay(2000);
   
   // Interface principale
   tft.fillScreen(COLOR_BG);
   drawHeader();
   drawVUMeter();
   drawNowPlaying("System Ready");
   drawStatus(false);
   
   // Initialisation boutons
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
   static unsigned long lastUpdate = 0;
   
   // WiFi check toutes les 10s
   if (millis() - lastWiFiCheck > 10000) {
     connectWiFi();
     lastWiFiCheck = millis();
   }
   
   // Mise à jour interface toutes les 300ms
   if (millis() - lastUpdate > 300) {
     drawVUMeter();
     drawStatus(WiFi.status() == WL_CONNECTED);
     lastUpdate = millis();
   }
   
   // Lecture boutons
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
   
   delay(10);
 }