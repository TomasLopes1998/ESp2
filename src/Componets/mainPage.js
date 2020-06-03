import React from "react";
import MicRecorder from "mic-recorder-to-mp3";
import { BrowserRouter as Router } from "react-router-dom";
import CheckConvertion from "./checkConversion";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

var AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: "ASIAQ7GA5VOFUAOYMIUY",
  secretAccessKey: "r1y5czTxBYnhVCV38ajmvu8r8TRti0SvI4Fkh6cx",
  sessionToken:
    "FwoGZXIvYXdzECQaDD0EPUQwzPJ1V93T+SLJAfWi5Qnel6unVUsroTN4+seOfHhMX4a1D5LUgowbqpdVqn4Ov9mQ+ElXao6HI6MFvA2JHDPKDCXlJHwrT4+T72esu1wbj/jigEZ8Zd56WjOEU7Z2dCiwKbecq3hMDjv1HhXjuLf60rjjDUlTIzL6CqPZRaZl8UvvIIyJepihFdaIOKh/Who/5OtgJnmKkCTMjmFZWgL8DHep9NUFaJPpWCFXPzE/ZSYsdSv5c50Mz6+SuhMzbjNOl02rNeryoWWYI8bTNRg0XFbzvijd1t/2BTItrSAvF6ttco3MzaN/em7+9fLqfYv9jgxOP8w5HCItv+THnXg+fRZQ4lt6g7DQ",
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
