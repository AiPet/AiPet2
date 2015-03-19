#include <SoftwareSerial.h>
#include <TinyGPS++.h>
#include <inetGSM.h>
#include <SIM900.h>
#include <string>

//Define some basic pins
#define SIM900_POWER 9
#define led 7
#define red 12

// InetGSM object
InetGSM inet;

// The TinyGPS++ object
TinyGPSPlus gps;

char msg[50];
int numdata;
boolean started = false;
const String id_num = "xh207afjkp"; // Unique code for the device
float x,y;

void setup() 
{
  
Serial.begin(9600);
Serial.println("Serial Begin");
  
  // Power on SIM900 module
  pinMode(SIM900_POWER, OUTPUT);
  digitalWrite(SIM900_POWER, HIGH);
  delay(500);
  digitalWrite(SIM900_POWER, LOW);  
  delay(5000);  
  // End
  
  //Define the pins as output
  pinMode(6, OUTPUT);
  pinMode(led, OUTPUT);
  pinMode(red, OUTPUT);
  digitalWrite(6, LOW); //Set pin 6 as Ground
  //End of definition
  
  if (gsm.begin(2400)){
    Serial.println("Status = READY");
    started = true;
  }
  else
  {
    Serial.println("Status = IDLE");
  }
  
};

void loop() 
{
  gsm.SimpleRead();
  
  while (Serial.available() > 0)
    if (gps.encode(Serial.read()))
      {
        x = gps.location.lat();
        y = gps.location.lng();
        Serial.print(x); Serial.print("/"); Serial.println(y);
        
        if(x != 0 & y != 0){
          if(started){
            if (inet.attachGPRS("internet.mtel", "", ""))
            {
            Serial.println("GPRS Attached");
            }
          }
              
          String data = "x=" +  String(x) + "&y=" +  String(y) + "&code=" + id_num;
          numdata = inet.httpPOST("178.254.240.185", 3000, "/api/pet/addlocation", data.c_str(),msg, 50);
          
          //Resset the X and Y after they are send
          x = 0; 
          y = 0;
          
          //Light the Green Led to indicate that the request is sended
          digitalWrite(led, HIGH);
          delay(2000);
          digitalWrite(led, LOW);
          delay(28000);
        }
        else
        {
          //Print and light the Red led to indicate that there is a problem with the coordinates
          Serial.println("No valid data");
          digitalWrite(red, HIGH);
          delay(2000);
          digitalWrite(red, LOW);
        }
    }
  
  if (millis() > 5000 && gps.charsProcessed() < 10)
  {
    Serial.println(F("No GPS detected: check wiring."));
    while(true);
  }
};
