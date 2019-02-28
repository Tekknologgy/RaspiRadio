import { Component, OnInit } from '@angular/core';
import { AlertController, NavController, LoadingController,MenuController} from '@ionic/angular';
import { WebsocketService } from '../services/websocket.service';
import { PlayState } from '@angular/core/src/render3/interfaces/player';
import { resource } from 'selenium-webdriver/http';

//const RaspiRadio_URL = "ws://teilchen.ddns.net:8765";
const RaspiRadio_URL = "";
@Component({
  selector: 'app-player',
  templateUrl: './player.page.html',
  styleUrls: ['./player.page.scss'],
})
export class PlayerPage implements OnInit {

  private mywebsocket;

  constructor(
    public alertCtrl: AlertController,
    public loadingCtrl: LoadingController,
    public navCtrl : NavController,
    public menCtrl: MenuController,
    private wsService: WebsocketService
  ){}

  loading; Songname; Playerstate; Interpret; Playerstate_label;Playerstate_icon //playervariablen
  Songduration; currsongtime; currDuration;  //zeiten

  private sliderMax;
  private sliderValue;

  async SliderChanged() {
    this.secToTime(this.sliderValue).then((result) => this.currDuration = result);
    var data = JSON.stringify({"Action": "setElapsed","newElapsed": this.sliderValue});
    this.mywebsocket.next(data);
}

  async backward() { 
    var data = JSON.stringify({"Action": "Previous"});
    this.mywebsocket.next(data);
  }

  async playpause(){ 
    if(this.Playerstate == 'Play') {
      this.Playerstate = 'Pause';
      this.Playerstate_label = 'Pause';
      this.Playerstate_icon = 'pause';
      var data = JSON.stringify({"Action": "Pause","PauseStatus": 0});
      this.mywebsocket.next(data);
    }
    else if(this.Playerstate == 'Pause') {
      this.Playerstate = 'Play';
      this.Playerstate_label = 'Play';
      this.Playerstate_icon = 'play';
      var data = JSON.stringify({"Action": "Pause","PauseStatus": 1});
      this.mywebsocket.next(data);
    }
   /* kommt weg weil oarasch
      else if(this.Playerstate == 'Stop') { 
      this.Playerstate = 'Play';
      this.Playerstate_label ='play';
      var data = JSON.stringify({"Action": "Play"});
      this.mywebsocket.next(data);
    }*/
  }

  async stop() {

    this.Playerstate = "Stop";
    var data = JSON.stringify({"Action": "Stop"});
    this.mywebsocket.next(data);
  }

  async forward(){ 

    var data = JSON.stringify({"Action": "Next"});
    this.mywebsocket.next(data);
  }

  async delay(ms: number) {
    return new Promise( resolve => setTimeout(resolve, ms) );
  }

  async secToTime(onlyseconds): Promise<string> {

    let seconds = onlyseconds%60; //Berechnet den reinen Sekunden-Anteil
    let str_seconds = ""; //Speichert die Sekunden als String mit führenden Nullen für die Ausgabe am Ende
    let minutes = Math.floor(onlyseconds/60); //Berechnet den reinen Minuten-Anteil
    let str_minutes = ""; //Speichert die Minuten als String mit führenden Nullen für die Ausgabe am Ende
    let hours = Math.floor(onlyseconds/3600); //berechnet den reinen Stunden-Anteil
    let str_hours = ""; //Speichert die Stunden als String mit führenden Nullen für die Ausgabe am Ende
    let time = "";  //Speichert die zusammengesetzte Zeit als String für das Return
  
    if(seconds < 10) {
      str_seconds = '0'+seconds;

    }
    else if(seconds >= 10) {
      str_seconds = String(seconds);
    }

    if(hours >= 1){
      hours = minutes - (60*hours);
    }

    if(minutes < 10){
      str_minutes = '0'+minutes;
    }
    else if(minutes >= 10) {
      str_minutes = String(minutes);
    }

    if(hours < 10){
      str_hours = '0'+hours;
    }
    else if(hours >= 10) {
      str_hours = String(hours);
    }

    time = str_hours+":"+str_minutes+":"+str_seconds;

    return time;
  }

  ngOnInit() {
    this.Playerstate = 'Play'; //zum testen für sebi
    this.Playerstate_label = 'Play';
    this.Playerstate_icon = 'play';
    this.mywebsocket = this.wsService.connect(RaspiRadio_URL);
    this.mywebsocket.subscribe(
      (next) => {
        let parsed = JSON.parse(next.data);
      
        if(parsed['Action'] == 'State') {
          this.Songname = parsed['Title']; //Setzt den Songnamen
          this.Interpret = parsed['Artist']; //Setzt den Interpreten
          this.sliderMax = parsed['Duration']; //setzt den Maximalwert des Sliders in Sekunden
          this.sliderValue = parsed['Elapsed'];  //setzt den Slider-Value damit der Slider an der aktuellen Abspielposition steht
          this.secToTime(parsed['Duration']).then((result) => this.Songduration = result) //setzt die Anzeige der Titeldauer rechts neben dem Slider
          this.secToTime(parsed['Elapsed']).then((result) => this.currDuration = result);  //setzt den aktuellen Fortschritt des Titels links neben dem Slider
          if(parsed['State'] == 'Playing') {
            this.Playerstate = "Pause"; //etwas verwirrend, weil mit Playerstate "Pause" gemeint ist, dass das Pause-Symbol angezeigt werden soll und der Player gerade spielt
          }
          else if(parsed['State'] == 'Paused') {
            this.Playerstate = "Play"; //etwas verwirrend, weil mit Playerstate "Play" gemeint ist, dass das Play-Symbol angezeigt werden soll und der Player gerade pausiert
          }
          else if(parsed['State'] == 'Stopped') {
            this.Playerstate = "Stop"; //etwas verwirrend, weil mit Playerstate "Stop" gemeint ist, dass das Play-Symbol angezeigt werden soll und der Player gerade gestoppt ist
          }
        }
      }
    )
  }
  async ngAfterViewInit() {
    await this.delay(500);
    var data = JSON.stringify({"Action": "getState"});
    this.mywebsocket.next(data);
  //  console.log("Jetzt");
  }
}