import { Injectable } from '@angular/core';
import * as Rx from 'rxjs';
import { Observable, Observer } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class WebsocketService {

  constructor() { }

  private subject: Rx.Subject<MessageEvent>;

  public connect(url): Rx.Subject<MessageEvent> {
    if (!this.subject) {
      this.subject = this.create(url);
      //console.log("Successfully connected: " + url);    Wird auch ausgegeben, wenn das Connect nicht funktioniert - ergo: sinnlos - wenn ein connect misslingt gibts eh ne fehlermeldung in der console...
    }
    return this.subject;
  }

  private create(url): Rx.Subject<MessageEvent> {
    let ws = new WebSocket(url);
    
    let observable = Observable.create(
      (obs: Observer<MessageEvent>) => {
        ws.onmessage = obs.next.bind(obs);
        ws.onerror = obs.error.bind(obs);
        ws.onclose = obs.complete.bind(obs);
        return ws.close.bind(ws);
      }
    )

    let observer = {
      next: (data: string) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(data);
          console.log(`WS sent: ${data}`);
        }
      }
    }
    
    return Rx.Subject.create(observer, observable);
  }
}
