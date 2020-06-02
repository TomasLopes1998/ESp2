import React from "react";
import MicRecorder from "mic-recorder-to-mp3";
import { BrowserRouter as Router } from "react-router-dom";
import CheckConvertion from "./checkConversion";

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

var AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: "ASIAQ7GA5VOFXW7GRZZP",
  secretAccessKey: "2wGtEIY7ASc27EZRoU97olJhAMAuJ4AvNtTvya2r",
  sessionToken:
    "FwoGZXIvYXdzENn//////////wEaDBHKFowhhopHmwJQyCLJAR/r9emhrcRXMdwZnyzwQjuAsRSXr7HpbtSE45D01wM3+DVZCtquH2UULH+FoH1/KZh+HrMtfxK0PEYsLplED/8M6g2qOkAxPO6V/sIuojeu5EsEzZ6leXRPKIN6dzlt1LiWTR9o9/vdlWdAjY5hnvhnAM8Nfv72ItUcBl6tLJ+xUR3b1jT+fjyTJIpPXh0J+Q3oCtqJuY3tJkXlHhKZg6Q6ZOOo0GGHinOEmszvDWpVUohf6gcINg9mLJ5sG7deDGajFKxBojUs7SjCpc/2BTItymQ1/8zAeEQ+4sj8aG14k14n1WdsAkW+gA0OtZ9JEBRONJHHT0ArrqWXRP7C",
});

const logostyle = {
  width: "100px",
  height: "50px",
};
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
    var formparameters = {
      method: "GET", // or 'PUT'
      headers: {
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
    }
    else{
      this.setState({errormessage : "Por favor grave uma mensagem primeiro!"});
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
            <div className="logoBar">
              <img
                className="imgBar"
                src="data:image/png;base64,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"
                style={logostyle}
                alt=""
              />
            </div>
          </nav>
          {this.state.errormessage}
          <button className="backbuttonMenu">Go Back</button>
          <div onClick={this.handleClick.bind(this)}>
            {this.state.isRecording ? isRecordingButton : isNotRecordingButton}
          </div>
          <audio src={this.state.blobURL} controls="controls" />
        </div>
        <div>
          <button onClick={this.sendToS3}>Let's Go</button>
        </div>
      </>
    );
  }
}

export default MainPage;
