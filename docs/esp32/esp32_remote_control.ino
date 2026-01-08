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
 // UI – HEADER DJ
 // ==================================================
 void drawDJHeader() {
   tft.fillRect(0, 0, 160, 20, DJ_PANEL);
   tft.setTextColor(DJ_TEXT);
   tft.setCursor(6, 5);
   tft.print("LIVE PARTY WALL");
 
   // LEDs style régie
   tft.fillCircle(135, 10, 4, DJ_GREEN);
   tft.fillCircle(145, 10, 4, DJ_YELLOW);
   tft.fillCircle(155, 10, 4, DJ_RED);
 }
 
 // ==================================================
 // UI – LEVEL METER (animation DJ)
 /// amélioration : barres verticales animées
 // ==================================================
 void drawLevelMeter() {
   tft.fillRect(10, 25, 140, 20, DJ_BG);
   tft.drawRect(10, 25, 140, 20, DJ_TEXT);
 
   for (int i = 0; i < 140; i += 8) {
     int h = random(5, 18);
     uint16_t color = (h < 12) ? DJ_GREEN : DJ_RED;
     tft.fillRect(12 + i, 25 + 20 - h, 6, h, color);
   }
 }
 
 // ==================================================
 // UI – NOW PLAYING
 // ==================================================
 void drawNowPlaying(const char* label) {
   tft.fillRoundRect(10, 50, 140, 40, 6, DJ_PANEL);
   tft.setTextColor(DJ_ACCENT);
   tft.setCursor(20, 55);
   tft.print("NOW PLAYING");
 
   tft.setTextColor(DJ_TEXT);
   tft.setCursor(20, 70);
   tft.print(label);
 }
 
 // ==================================================
 // UI – STATUS BAR
 // ==================================================
 void drawStatusBar(bool wifiOK) {
   tft.fillRect(0, 95, 160, 30, DJ_BG);
 
   tft.setCursor(10, 105);
   tft.setTextColor(DJ_TEXT);
   tft.print("READY");
   tft.fillCircle(55, 110, 4, DJ_GREEN);
 
   tft.setCursor(90, 105);
   tft.print("WIFI");
   tft.fillCircle(135, 110, 4, wifiOK ? DJ_GREEN : DJ_RED);
 }
 
 // ==================================================
 // UI – ACTION FEEDBACK (flash)
 /// amélioration : flash rapide et retour console
 // ==================================================
 void showDJAction(const char* label, bool success) {
   uint16_t flash = success ? DJ_GREEN : DJ_RED;
 
   tft.fillRect(0, 0, 160, 160, flash);
   delay(50);  // flash rapide
   tft.fillScreen(DJ_BG);
 
   drawDJHeader();
   drawNowPlaying(label);
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
 
   drawDJHeader();
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
 
   // animation level meter toutes les 300ms
   if (millis() - lastAnim > 300) {
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
 