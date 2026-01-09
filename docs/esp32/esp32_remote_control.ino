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
  // PALETTE PROFESSIONNELLE
  // ==================================================
  #define COLOR_BG         0x0000  // Noir
  #define COLOR_PANEL      0x2104  // Gris très foncé
  #define COLOR_BORDER      0x4208  // Gris moyen
  #define COLOR_SUCCESS     0x07E0  // Vert
  #define COLOR_ERROR       0xF800  // Rouge
  #define COLOR_TEXT        0xFFFF  // Blanc
  #define COLOR_TEXT_DIM  0x8410   // Gris clair
  #define COLOR_ACCENT      0x001F  // Bleu foncé
  
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
 
  // ==================================================
  // UI – HEADER
  // ==================================================
  void drawHeader() {
    tft.fillRect(0, 0, 160, 20, COLOR_PANEL);
    tft.drawFastHLine(0, 20, 160, COLOR_BORDER);
    
    tft.setTextColor(COLOR_TEXT);
    tft.setTextSize(1);
    tft.setCursor(4, 6);
    tft.print("LIVE PARTY WALL");
    
    // Status LED
    tft.fillCircle(150, 10, 3, COLOR_SUCCESS);
  }
 
  // ==================================================
  // UI – STATUS INFO
  // ==================================================
  void drawStatusInfo(bool wifiOK) {
    tft.fillRect(0, 22, 160, 30, COLOR_BG);
    
    // WiFi Status
    tft.setTextColor(COLOR_TEXT_DIM);
    tft.setTextSize(1);
    tft.setCursor(4, 24);
    tft.print("WiFi:");
    
    if (wifiOK) {
      tft.setTextColor(COLOR_SUCCESS);
      tft.setCursor(32, 24);
      tft.print("Connected");
      
      // Signal strength
      int rssi = WiFi.RSSI();
      int bars = 0;
      if (rssi > -50) bars = 4;
      else if (rssi > -60) bars = 3;
      else if (rssi > -70) bars = 2;
      else if (rssi > -80) bars = 1;
      
      int barX = 100;
      int barY = 26;
      for (int i = 0; i < 4; i++) {
        uint16_t color = (i < bars) ? COLOR_SUCCESS : COLOR_PANEL;
        int barH = (i + 1) * 2;
        tft.fillRect(barX + i * 4, barY + 6 - barH, 2, barH, color);
      }
    } else {
      tft.setTextColor(COLOR_ERROR);
      tft.setCursor(32, 24);
      tft.print("Disconnected");
    }
    
    // IP Address
    if (wifiOK) {
      IPAddress ip = WiFi.localIP();
      tft.setTextColor(COLOR_TEXT_DIM);
      tft.setCursor(4, 36);
      tft.print("IP:");
      tft.setTextColor(COLOR_TEXT);
      tft.setCursor(20, 36);
      char ipStr[16];
      sprintf(ipStr, "%d.%d.%d.%d", ip[0], ip[1], ip[2], ip[3]);
      tft.print(ipStr);
    }
    
    // Separator
    tft.drawFastHLine(0, 51, 160, COLOR_BORDER);
  }
 
  // ==================================================
  // UI – COMMAND STATUS
  // ==================================================
  void drawCommandStatus(const char* label) {
    tft.fillRect(0, 54, 160, 20, COLOR_BG);
    
    tft.setTextColor(COLOR_TEXT_DIM);
    tft.setTextSize(1);
    tft.setCursor(4, 56);
    tft.print("Last:");
    
    tft.setTextColor(COLOR_TEXT);
    tft.setCursor(32, 56);
    
    // Tronquer si trop long
    char displayLabel[20];
    int len = strlen(label);
    if (len > 19) {
      strncpy(displayLabel, label, 16);
      displayLabel[16] = '.';
      displayLabel[17] = '.';
      displayLabel[18] = '.';
      displayLabel[19] = '\0';
    } else {
      strncpy(displayLabel, label, 19);
      displayLabel[len] = '\0';
    }
    tft.print(displayLabel);
    
    // Separator
    tft.drawFastHLine(0, 73, 160, COLOR_BORDER);
  }
 
  // ==================================================
  // UI – SYSTEM INFO
  // ==================================================
  void drawSystemInfo() {
    tft.fillRect(0, 76, 160, 52, COLOR_BG);
    
    // Event ID (tronqué)
    tft.setTextColor(COLOR_TEXT_DIM);
    tft.setTextSize(1);
    tft.setCursor(4, 78);
    tft.print("Event:");
    tft.setTextColor(COLOR_TEXT);
    tft.setCursor(38, 78);
    String eventShort = String(EVENT_ID).substring(0, 12);
    tft.print(eventShort);
    
    // System status
    tft.setTextColor(COLOR_TEXT_DIM);
    tft.setCursor(4, 90);
    tft.print("Status:");
    tft.setTextColor(COLOR_SUCCESS);
    tft.setCursor(48, 90);
    tft.print("Ready");
    
    // Separator
    tft.drawFastHLine(0, 127, 160, COLOR_BORDER);
  }
 
  // ==================================================
  // UI – SPLASH SCREEN
  // ==================================================
  void drawSplash() {
    tft.fillScreen(COLOR_BG);
    
    // Logo zone
    tft.fillRect(40, 40, 80, 50, COLOR_PANEL);
    tft.drawRect(40, 40, 80, 50, COLOR_BORDER);
    
    // Titre
    tft.setTextColor(COLOR_TEXT);
    tft.setTextSize(2);
    tft.setCursor(50, 50);
    tft.print("LIVE");
    tft.setCursor(50, 70);
    tft.print("PARTY");
    
    // Info
    tft.setTextSize(1);
    tft.setTextColor(COLOR_TEXT_DIM);
    tft.setCursor(50, 100);
    tft.print("ESP32 Remote");
    
    tft.setCursor(65, 115);
    tft.print("v2.0");
  }
 
  // ==================================================
  // UI – FEEDBACK
  // ==================================================
  void showFeedback(const char* label, bool success) {
    // Flash visuel minimal
    uint16_t flashColor = success ? COLOR_SUCCESS : COLOR_ERROR;
    tft.fillRect(0, 54, 160, 20, flashColor);
    delay(80);
    
    // Redessiner interface
    drawHeader();
    drawStatusInfo(WiFi.status() == WL_CONNECTED);
    drawCommandStatus(label);
    drawSystemInfo();
    
    // Message de confirmation
    tft.fillRect(50, 54, 60, 20, COLOR_PANEL);
    tft.drawRect(50, 54, 60, 20, flashColor);
    
    tft.setTextColor(COLOR_TEXT);
    tft.setTextSize(1);
    tft.setCursor(58, 61);
    tft.print(success ? "OK" : "ERR");
    
    delay(500);
    
    // Restaurer
    drawCommandStatus(label);
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
   
    // Splash screen - 5 secondes
    drawSplash();
    delay(5000);
    
    // Interface principale
    tft.fillScreen(COLOR_BG);
    drawHeader();
    drawStatusInfo(false);
    drawCommandStatus("Ready");
    drawSystemInfo();
   
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
   
    // Mise à jour interface toutes les 2 secondes
    if (millis() - lastUpdate > 2000) {
      drawStatusInfo(WiFi.status() == WL_CONNECTED);
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