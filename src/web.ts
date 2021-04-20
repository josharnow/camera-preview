import { WebPlugin } from "@capacitor/core";
import { 
  CameraPreviewOptions, 
  CameraPreviewPictureOptions, 
  CameraPreviewPlugin, 
  CameraPreviewFlashMode, 
  CameraSampleOptions 
} from "./definitions";

export class CameraPreviewWeb extends WebPlugin implements CameraPreviewPlugin {

  /**
   *  track which camera is used based on start options
   *  used in capture
   */
  private isBackCamera: boolean;

  constructor() {
    super({
      name: "CameraPreview",
      platforms: ["web"],
    });
  }

  async start(options: CameraPreviewOptions): Promise<{}> {
    return new Promise(async(resolve, reject) => {

      await navigator.mediaDevices.getUserMedia({
        audio:!options.disableAudio,  
        video:true}
      ).then((stream: MediaStream) => {
        // Stop any existing stream so we can request media with different constraints based on user input
        stream.getTracks().forEach((track) => track.stop());
      }).catch(error => {
        reject(error);
      });

      const video = document.getElementById("video");
      const parent = document.getElementById(options.parent);

      if (!video) {
        const videoElement = document.createElement("video");
        videoElement.id = "video";
        videoElement.setAttribute("class", options.className || "");

        // Don't flip video feed if camera is rear facing
        if(options.position !== 'rear'){
          videoElement.setAttribute(
            "style",
            "-webkit-transform: scaleX(-1); transform: scaleX(-1);"
          );
        }

        parent.appendChild(videoElement);

        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const constraints: MediaStreamConstraints = {
            video: true,
          };

          if (options.position === 'rear') {
            constraints.video = { facingMode: 'environment' };
            this.isBackCamera = true;
          } else {
            this.isBackCamera = false;
          }

          navigator.mediaDevices.getUserMedia(constraints).then(
            function (stream) {
              //video.src = window.URL.createObjectURL(stream);
              videoElement.srcObject = stream;
              videoElement.play();
              resolve({});
            },
            (err) => {
              reject(err);
            }
          );
        }
      } else {
        reject({ message: "camera already started" });
      }
    });
  }

  async stop(): Promise<any> {
    const video = <HTMLVideoElement>document.getElementById("video");
    if (video) {
      video.pause();

      const st: any = video.srcObject;
      const tracks = st.getTracks();

      for (var i = 0; i < tracks.length; i++) {
        var track = tracks[i];
        track.stop();
      }
      video.remove();
    }
  }

  async capture(_options: CameraPreviewPictureOptions): Promise<any> {
    return new Promise((resolve, _) => {
      const video = <HTMLVideoElement>document.getElementById("video");
      const canvas = document.createElement("canvas");

      // video.width = video.offsetWidth;

      const context = canvas.getContext("2d");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // flip horizontally back camera isn't used
      if(!this.isBackCamera){
        context.translate(video.videoWidth, 0);
        context.scale(-1, 1);
      }
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      resolve({
        value: canvas
          .toDataURL("image/png")
          .replace("data:image/png;base64,", ""),
      });
    });
  }

  async captureSample(_options: CameraSampleOptions): Promise<any> {
    return this.capture(_options);
  }

  async getSupportedFlashModes(): Promise<{
    result: CameraPreviewFlashMode[]
  }> {
    throw new Error('getSupportedFlashModes not supported under the web platform');
  }

  async setFlashMode(_options: { flashMode: CameraPreviewFlashMode | string }): Promise<void> {
    throw new Error('setFlashMode not supported under the web platform');
  }

  async flip(): Promise<void> {
    throw new Error('flip not supported under the web platform');
  }
}

const CameraPreview = new CameraPreviewWeb();

export { CameraPreview };

import { registerWebPlugin } from "@capacitor/core";
registerWebPlugin(CameraPreview);
