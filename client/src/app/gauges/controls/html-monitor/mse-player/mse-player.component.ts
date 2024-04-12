import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-mse-player',
  templateUrl: './mse-player.component.html',
  styleUrls: ['./mse-player.component.css']
})
export class MsePlayerComponent implements OnInit {

  id: string;
  mseQueue = [];
  mseSourceBuffer;
  mseStreamingStarted = false;
  ws: WebSocket;
  mseUrl: string;

  constructor() { }

  ngOnInit(): void {
    if(this.mseUrl){
      this.startPlay();
    }
  }

  ngOnDestroy(): void {
    if (this.ws) {
      this.ws.close(); // Close WebSocket connection
    }
    if (this.mseSourceBuffer) {
      this.mseSourceBuffer.removeEventListener('updateend', this.pushPacket); // Remove event listener
    }
    if (this.mseSourceBuffer && typeof this.mseSourceBuffer.endOfStream === 'function') {
      this.mseSourceBuffer.endOfStream();
    }
    this.mseSourceBuffer = null;
  }


  startPlay(): void {
    const videoEl: HTMLVideoElement = document.querySelector('#mse-video');
    // let mseUrl = this.data.ga.property.variableValue;
    // if (this.data.ga.property.variableId){
    //     let variable = this.hmiService.getMappedVariable(this.data.ga.property.variableId, false);
    //     if (!Utils.isNullOrUndefined(variable?.value)) {
    //       mseUrl = '' + variable.value;
    //     }
    // }

    const mse = new MediaSource();
    videoEl.src = window.URL.createObjectURL(mse);
    videoEl.addEventListener('pause', () => {
      if (videoEl.currentTime > videoEl.buffered.end(videoEl.buffered.length - 1)) {
        videoEl.currentTime = videoEl.buffered.end(videoEl.buffered.length - 1) - 0.1;
        videoEl.play();
      }
    });


    mse.addEventListener('sourceopen', () => {
      this.ws = new WebSocket(this.mseUrl);
      this.ws.binaryType = 'arraybuffer';
      this.ws.onopen = (event) => {
        console.log('Connect to ws');
      };
      this.ws.onmessage = (event) => {
        const data = new Uint8Array(event.data);
        if (data[0] === 9) {
          let mimeCodec;
          const decodedArr = data.slice(1);
          if (window.TextDecoder) {
            mimeCodec = new TextDecoder('utf-8').decode(decodedArr);
          } else {
            mimeCodec = this.Utf8ArrayToStr(decodedArr);
          }
          this.mseSourceBuffer = mse.addSourceBuffer('video/mp4; codecs="' + mimeCodec + '"');
          this.mseSourceBuffer.mode = 'segments';
          this.mseSourceBuffer.addEventListener('updateend', this.pushPacket);
        } else {
          this.readPacket(event.data);
        }
      };
    });


  }

  pushPacket(): void {
    const videoEl = document.querySelector('#mse-video') as HTMLVideoElement;
    let packet;
    if (this.mseSourceBuffer !== undefined && !this.mseSourceBuffer.updating) {
      if (this.mseQueue.length > 0) {
        packet = this.mseQueue.shift();
        this.mseSourceBuffer.appendBuffer(packet);
      } else {
        this.mseStreamingStarted = false;
      }
    }
    if (videoEl !== null && videoEl.buffered.length > 0) {
      if (typeof document.hidden !== 'undefined' && document.hidden) {
        // no sound, browser paused video without sound in background
        videoEl.currentTime = videoEl.buffered.end((videoEl.buffered.length - 1)) - 0.5;
      }
    }
  }

  readPacket(packet: any): void {
    if (!this.mseStreamingStarted) {
      this.mseSourceBuffer.appendBuffer(packet);
      this.mseStreamingStarted = true;
      return;
    }
    this.mseQueue.push(packet);
    if (!this.mseSourceBuffer.updating) {
      this.pushPacket();
    }
  }


  Utf8ArrayToStr(array) {
    var out, i, len, c;
    var char2, char3;
    out = "";
    len = array.length;
    i = 0;
    while (i < len) {
      c = array[i++];
      switch (c >> 4) {
        case 7:
          out += String.fromCharCode(c);
          break;
        case 13:
          char2 = array[i++];
          out += String.fromCharCode(((c & 0x1F) << 6) | (char2 & 0x3F));
          break;
        case 14:
          char2 = array[i++];
          char3 = array[i++];
          out += String.fromCharCode(((c & 0x0F) << 12) |
            ((char2 & 0x3F) << 6) |
            ((char3 & 0x3F) << 0));
          break;
      }
    }
    return out;
  }

  closeVide(){
    console.log('Video ended');
  }

  // private onClose($event) {
  //   if (this.onclose) {
  //       this.onclose.emit($event);
  //   }
  // }
}
