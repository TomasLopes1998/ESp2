import React from "react";
import MicRecorder from "mic-recorder-to-mp3";
import { BrowserRouter as Router } from "react-router-dom";
import CheckConvertion from "./checkConversion";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

var AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: "ASIAQ7GA5VOF3BIL3A72",
  secretAccessKey: "snv2Y+jfAK5v4zTdVbhN6Jnj4jOJwCcbYSFiwwtK",
  sessionToken:
    "FwoGZXIvYXdzEEwaDHjgiDt0067lPx/BfCLJAemqw+WhUfyaygN3jPgCeYkhitMa+A8bfXbldI9g8vjr2tMy7wDw1Mfq0ZrhPvRS7etYqNVK+jUDTaS2YmF/kjIHzgpdMnFUsFEr0RhTh2kxia3NMiaE1QIP3IAVmfywk4fcLeI0VcEJD3vBlUDA3/PulAZyd2T0y2KyoQkBH30wXC7rXyT3VLKWLmI0Aru11ErnlkgCeDzMiDg0b3Eln6q62dDI8P6F+qx3SFnOuvPHV9uApMsY9V2HJHVbglJzfhCO9xAaVLZp+yjgxej2BTItGG3Xgix2i1oa5g3Ldr3VZXIs+ZDw1O41K6KatBRlKMMGmim9brp5sfbYiBQX"
  });
const visible_style = {
  visibility: "visible",
};

class MainPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isRecording: false,
      blobURL: "",
      isBlocked: false,
      errormessage: "",
      audioBlob: "",
      token: "",
    };
    this.button_record = React.createRef();
    this.button_stop = React.createRef();
  }

  handleClick() {
    this.setState((previousState) => {
      return {
        isRecording: !previousState.isRecording,
      };
    });
  }

  componentDidMount() {
    this.setState({ token: localStorage.getItem("token") });
    navigator.getUserMedia(
      { audio: true },
      () => {
        console.log("Permission Granted");
        this.setState({ isBlocked: false });
      },
      () => {
        console.log("Permission Denied");
        this.setState({ isBlocked: true });
      }
    );
  }

  start = () => {
    if (this.state.isBlocked) {
      console.log("Permission Denied");
    } else {
      Mp3Recorder.start()
        .then(() => {
          this.setState({ isRecording: true });
        })
        .catch((e) => console.error(e));
    }
  };

  stop = () => {
    Mp3Recorder.stop()
      .getMp3()
      .then(([buffer, blob]) => {
        this.setState({ audioBlob: blob });
        const blobURL = URL.createObjectURL(blob);
        this.setState({ blobURL, isRecording: false });
      })
      .catch((e) => console.log(e));
  };

  getTranscriptionJob = () => {
    console.log(this.state.token);
    var formparameters = {
      method: "GET", // or 'PUT'
      headers: {
        //AuthorizationToken: this.state.token,
        "Content-Type": "application/json",
      },
    };
    fetch(
      "https://jzijzhved1.execute-api.us-east-1.amazonaws.com/firstStage/uploadToS3",
      formparameters
    )
      .then((resp) => {
        return resp.json();
      })
      .then((json) => {
        localStorage.setItem("nameOfFile", json["job_name"]);
        this.setState({ data: json["job_name"] });
        console.log(json);
      });
  };
  sendToS3 = () => {
    var uploadParams = { Bucket: "audiosbucket1", Key: "audio.mp3", Body: "" };
    if (this.state.audioBlob !== "") {
      var fileStream = this.state.audioBlob;
      uploadParams.Body = fileStream;
      s3.upload(uploadParams, function (s3Err, data) {
        if (s3Err) throw s3Err;
        console.log(`File uploaded successfully at ${data.Location}`);
      });
      this.getTranscriptionJob();
    } else {
      this.setState({ errormessage: "Por favor grave uma mensagem primeiro!" });
    }
  };

  render() {
    if (this.state.data !== undefined) {
      return (
        <Router>
          <CheckConvertion />
        </Router>
      );
    }
    const isRecordingButton = (
      <button
        className="buttonMenu"
        style={visible_style}
        onClick={this.stop}
        disabled={!this.state.isRecording}
        ref={this.button_stop}
      >
        Stop
      </button>
    );
    const isNotRecordingButton = (
      <div>
        <button
          className="buttonMenu"
          style={visible_style}
          onClick={this.start}
          disabled={this.state.isRecording}
          ref={this.button_record}
        >
          Record
        </button>
      </div>
    );

    return (
      <>
        <div className="body">
          <nav className="menubar">
            <h2 className="textNav">Welcome to ESUber</h2>
          </nav>
          {this.state.errormessage}
          <button className="backbuttonMenu">Go Back</button>
          <div onClick={this.handleClick.bind(this)}>
            {this.state.isRecording ? isRecordingButton : isNotRecordingButton}
          </div>
          <audio src={this.state.blobURL} controls="controls" />
        </div>
        <div>
          <button className="buttonLets" onClick={this.sendToS3}>
            Let's Go
          </button>
        </div>
      </>
    );
  }
}

export default MainPage;
