/*
 * ESP32 Remote Control – Live Party Wall
 * Connexion WiFi WPA2 2.4GHz + envoi commandes Supabase
 * Version stable + bouton fermeture photo random
 */

 #include <WiFi.h>
 #include <HTTPClient.h>
 #include <ArduinoJson.h>
 
 // ==================================================
 // CONFIGURATION WIFI (2.4 GHz WPA2)
 // ==================================================
 const char* WIFI_SSID     = "Bbox-4C3BF6DA";
 const char* WIFI_PASSWORD = "2PapyAndreMarcelOise";
 
 // ==================================================
 // CONFIGURATION SUPABASE
 // ==================================================
 const char* SUPABASE_URL      = "https://izkytczkzkqxvylujwqo.supabase.co";
 const char* SUPABASE_ANON_KEY = "sb_publishable_9n9o9TS-jhYexS2_XypICg_S7_VPuh3";
 const char* EVENT_ID          = "345c0eef-bdd8-40d5-a75a-24c836beebdc";
 
 // ==================================================
 // GPIO BOUTONS
 // ==================================================
 #define BUTTON_AUTO_SCROLL     16
 #define BUTTON_AR_EFFECT       17
 #define BUTTON_QR_CODES         5
 #define BUTTON_RANDOM_PHOTO    18
 #define BUTTON_CLOSE_RANDOM    21   // ⬅️ NOUVEAU
 
 #define DEBOUNCE_DELAY 50
 
 struct Button {
   uint8_t pin;
   const char* command;
   bool lastState;
 };
 
 Button buttons[] = {
   {BUTTON_AUTO_SCROLL,   "TOGGLE_AUTO_SCROLL",  HIGH},
   {BUTTON_AR_EFFECT,     "TRIGGER_AR_EFFECT",   HIGH},
   {BUTTON_QR_CODES,      "TOGGLE_QR_CODES",     HIGH},
   {BUTTON_RANDOM_PHOTO,  "SHOW_RANDOM_PHOTO",   HIGH},
   {BUTTON_CLOSE_RANDOM,  "CLOSE_RANDOM_PHOTO",  HIGH} // ⬅️ NOUVEAU
 };
 
 const uint8_t NUM_BUTTONS = sizeof(buttons) / sizeof(Button);
 
 // ==================================================
 // WIFI
 // ==================================================
 void connectWiFi() {
   if (WiFi.status() == WL_CONNECTED) return;
 
   Serial.println("\nConnexion WiFi...");
   WiFi.mode(WIFI_STA);
   WiFi.setSleep(false);
   WiFi.disconnect(true);
   delay(100);
 
   WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
 
   unsigned long start = millis();
   while (WiFi.status() != WL_CONNECTED && millis() - start < 20000) {
     delay(500);
     Serial.print(".");
   }
 
   if (WiFi.status() == WL_CONNECTED) {
     Serial.println("\nWiFi connecté");
     Serial.print("IP : ");
     Serial.println(WiFi.localIP());
   } else {
     Serial.println("\nÉchec WiFi");
   }
 }
 
 // ==================================================
 // SUPABASE – ENVOI COMMANDE
 // ==================================================
 bool sendCommand(const char* commandType) {
   if (WiFi.status() != WL_CONNECTED) return false;
 
   HTTPClient http;
   String url = String(SUPABASE_URL) + "/rest/v1/remote_commands";
 
   http.begin(url);
   http.addHeader("Content-Type", "application/json");
   http.addHeader("apikey", SUPABASE_ANON_KEY);
   http.addHeader("Authorization", "Bearer " + String(SUPABASE_ANON_KEY));
 
   StaticJsonDocument<256> doc;
   doc["event_id"] = EVENT_ID;
   doc["command_type"] = commandType;
   doc["processed"] = false;
 
   String payload;
   serializeJson(doc, payload);
 
   int code = http.POST(payload);
 
   if (code >= 200 && code < 300) {
     Serial.printf("Commande envoyée : %s\n", commandType);
   } else {
     Serial.printf("Erreur HTTP %d\n", code);
     Serial.println(http.getString());
   }
 
   http.end();
   return code >= 200 && code < 300;
 }
 
 // ==================================================
 // SETUP
 // ==================================================
 void setup() {
   Serial.begin(115200);
 
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
 
   if (millis() - lastWiFiCheck > 10000) {
     if (WiFi.status() != WL_CONNECTED) connectWiFi();
     lastWiFiCheck = millis();
   }
 
   for (uint8_t i = 0; i < NUM_BUTTONS; i++) {
     bool currentState = digitalRead(buttons[i].pin);
 
     if (currentState != buttons[i].lastState) {
       delay(DEBOUNCE_DELAY);
       currentState = digitalRead(buttons[i].pin);
 
       if (currentState == LOW && buttons[i].lastState == HIGH) {
         sendCommand(buttons[i].command);
       }
 
       buttons[i].lastState = currentState;
     }
   }
 }
 