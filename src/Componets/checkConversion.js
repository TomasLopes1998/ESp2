import React from "react";
import MicRecorder from "mic-recorder-to-mp3";
import EdiText from "react-editext";
import styled from "styled-components";
import randomLocation from "random-location";
import { Markup } from "interweave";
import { BrowserRouter as Router } from "react-router-dom";
import MainPage from "./mainPage";

//var polyline = require("polyline");

const Mp3Recorder = new MicRecorder({ bitRate: 128 });

const priceKM = 3;

var AWS = require("aws-sdk");

AWS.config.update({ region: "us-east-1" });
const s3 = new AWS.S3({
  apiVersion: "2006-03-01",
  accessKeyId: "ASIAQ7GA5VOFXW7GRZZP",
  secretAccessKey: "2wGtEIY7ASc27EZRoU97olJhAMAuJ4AvNtTvya2r",
  sessionToken:
    "FwoGZXIvYXdzENn//////////wEaDBHKFowhhopHmwJQyCLJAR/r9emhrcRXMdwZnyzwQjuAsRSXr7HpbtSE45D01wM3+DVZCtquH2UULH+FoH1/KZh+HrMtfxK0PEYsLplED/8M6g2qOkAxPO6V/sIuojeu5EsEzZ6leXRPKIN6dzlt1LiWTR9o9/vdlWdAjY5hnvhnAM8Nfv72ItUcBl6tLJ+xUR3b1jT+fjyTJIpPXh0J+Q3oCtqJuY3tJkXlHhKZg6Q6ZOOo0GGHinOEmszvDWpVUohf6gcINg9mLJ5sG7deDGajFKxBojUs7SjCpc/2BTItymQ1/8zAeEQ+4sj8aG14k14n1WdsAkW+gA0OtZ9JEBRONJHHT0ArrqWXRP7C",
});

const visible_style = {
  visibility: "visible",
};
const StyledEdiText = styled(EdiText)`
  button {
    border-radius: 5px;
  }
  button[editext="edit-button"] {
    color: #000;
    width: 50px;
  }
  button[editext="save-button"] {
    width: 50px;
    &:hover {
      background: greenyellow;
    }
  }
  button[editext="cancel-button"] {
    &:hover {
      background: crimson;
      color: #fff;
    }
  }
  input,
  textarea {
    background: #1d2225;
    color: #f4c361;
    font-weight: bold;
    border-radius: 5px;
  }
  div[editext="view-container"],
  div[editext="edit-container"] {
    background: #6293c3;
    padding: 15px;
    border-radius: 5px;
    color: #fff;
  }
`;

//var route = "";
class checkConvertion extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      fileExists: false,
      confirmed: false,
      message: "",
      fileName: "",
      isRecording: false,
      newMessage: false,
      noDestinationFound: false,
      destination: [],
      driverRating: "",
      driverName: "",
      LocationToInsert: 0,
      carToPersonRoute: [],
      PersonToDestinationRoute: [],
      tripAccepted: false,
      tripRejected: false,
      trip: "",
      timeToEval: false,
      done: false,
      value: 1,
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

    if (!this.state.newMessage) {
      this.setState({ fileName: localStorage.getItem("nameOfFile") });
      this.getJson();
      this.setState({ newMessage: true });
    }
  }

  stringToHTML = function (str) {
    var parser = new DOMParser();
    var doc = parser.parseFromString(str, "text/html");
    return doc.body;
  };

  confirmed = () => {
    this.getCoord();
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
        this.setState({ fileName: json["job_name"] });
        console.log(json["job_name"]);
        console.log("changed Name = " + this.state.fileName);
        this.setState({ fileExists: false });
        this.getJson();
      });
  };

  sendToS3 = () => {
    var uploadParams = { Bucket: "audiosbucket1", Key: "audio.mp3", Body: "" };
    var fileStream = this.state.audioBlob;
    uploadParams.Body = fileStream;
    s3.upload(uploadParams, function (s3Err, data) {
      if (s3Err) throw s3Err;
      console.log(`File uploaded successfully at ${data.Location}`);
    });
    this.getTranscriptionJob();
  };

  getJson = () => {
    console.log("Entrei!");
    console.log("File a enviar   " + this.state.fileName);
    var formparameters = {
      method: "POST", // or 'PUT'
      body: JSON.stringify({ file_name: this.state.fileName }),
      //body: JSON.stringify({ file_name: "test973167379" }), 
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(
      "https://jzijzhved1.execute-api.us-east-1.amazonaws.com/firstStage/json",
      formparameters
    )
      .then((resp) => {
        if (resp.status !== 200) {
          var wait = new Date().getTime();
          while (new Date().getTime() < wait + 30000);
          this.getJson();
        } else {
          console.log(resp.status);
          this.setState({ fileExists: true });
          console.log(this.state.message);
        }
        return resp.json();
      })
      .then((json) => {
        if (this.state.fileExists) {
          console.log(json["output"]);
          this.setState({ message: json["output"] });
        }
      });
  };

  onSave = (value) => {
    this.setState({ message: value });
  };

  getCoord = () => {
    //console.log("mensagem to get coords : " + this.state.message);
    var formparameters = {
      method: "POST", // or 'PUT'
      body: JSON.stringify({ location: this.state.message }),
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(
      "https://jzijzhved1.execute-api.us-east-1.amazonaws.com/firstStage/coord",
      formparameters
    )
      .then((resp) => {
        if (resp.status !== 200) {
          this.setState({ noDestinationFound: true });
        } else {
        }
        return resp.json();
      })
      .then((json) => {
        if (this.state.noDestinationFound) {
        } else {
          this.setState({ PossibleLocations: json });
        }
      });
  };

  getThe2Coord() {
    var points = []; //1 localização do taxi //2 localização do utilizador
    console.log(this.state.destination);
    const P = {
      latitude: this.state.destination["lat"],
      longitude: this.state.destination["lng"],
    };
    var R = 5000;
    points.push(randomLocation.randomCirclePoint(P, R));
    points.push(randomLocation.randomCirclePoint(P, R));
    console.log(points);
    this.setState({ randomLocation: points });
  }

  getTripPrice = () => {
    const P1 = {
      latitude: this.state.destination["lat"],
      longitude: this.state.destination["lng"],
    };

    console.log(P1);
    console.log(this.state.randomLocation[1]);

    var distance = randomLocation.distance(P1, this.state.randomLocation[1]);

    this.setState({
      tripPrice: ((distance / 1000.0) * priceKM).toFixed(2),
    });
  };

  getDriver = () => {
    var formparameters = {
      method: "GET", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(
      "https://jzijzhved1.execute-api.us-east-1.amazonaws.com/firstStage/driver",
      formparameters
    )
      .then((resp) => {
        return resp.json();
      })
      .then((json) => {
        console.log(json);
        this.setState({
          driverName: json["Driver"]["Name"],
          driverRating: json["Driver"]["rating"],
        });
        console.log(this.state.Driver);
      })
      .then(() => {
        this.getThe2Coord();
        this.getTripPrice();
        this.setState({ confirmed: true });
      });
  };

  createSelectItems() {
    var items = [];
    for (var i = 0; i < this.state.PossibleLocations["items"].length; i++) {
      console.log(this.state.PossibleLocations["items"][i]);
      items.push(
        <option key={i} value={i}>
          {this.state.PossibleLocations["items"][i]["title"]}
        </option>
      );
    }
    return items;
  }

  selectedLocation = () => {
    console.log(this.state.PossibleLocations["items"][0]["position"]);
    console.log(this.state.LocationToInsert);
    this.setState({
      destination: {
        lat: this.state.PossibleLocations["items"][this.state.LocationToInsert][
          "position"
        ]["lat"],
        lng: this.state.PossibleLocations["items"][this.state.LocationToInsert][
          "position"
        ]["lng"],
      },
    });
    this.getDriver();
  };

  handleChange = (e) => {
    console.log("Am i called?");
    console.log(e.target.value);
    this.setState({ LocationToInsert: e.target.value });
  };

  tripAccepted = () => {
    console.log(this.state.destination);
    var formparameters = {
      method: "POST", // or 'PUT'
      body: JSON.stringify({
        destination: this.state.destination,
        taxiLocation: this.state.randomLocation[0],
        personLocation: this.state.randomLocation[1],
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(
      "https://jzijzhved1.execute-api.us-east-1.amazonaws.com/firstStage/pathwithdirections",
      formparameters
    )
      .then((resp) => {
        return resp.json();
      })
      .then((json) => {
        this.setState({ carToPersonRoute: json["toPerson"] });
        this.setState({ PersonToDestinationRoute: json["toDestination"] });
        console.log(json);
      })
      .then(() => {
        this.setState({ tripAccepted: true });
        //this.doingTheTrip();
      });
  };

  triprefused = () => {
    this.setState({ tripRejected: true });
  };

  addingLines() {
    //document.getElementById("myP").innerHTML = txt.length;
    var linesOfTheRoude = [];
    var i = 0;
    var j = 0;
    console.log("I pass here!");
    while (this.state.carToPersonRoute.length > i) {
      linesOfTheRoude.push(
        <h4 key={i + j + 1} value={i + j + 1}>
          <Markup content={this.state.carToPersonRoute[i] + "<br>"}></Markup>
        </h4>
      );
      i = i + 1;
    }

    linesOfTheRoude.push(
      <h3 key={i + j + 1} value={i + j + 1}>
        <Markup content={"<br> Entrou no nosso Taxi <br>"}></Markup>
      </h3>
    );
    while (this.state.PersonToDestinationRoute.length > j) {
      linesOfTheRoude.push(
        <h4 key={i + j + 2} value={i + j + 1}>
          <Markup
            content={this.state.PersonToDestinationRoute[j] + "<br>"}
          ></Markup>
        </h4>
      );
      j = j + 1;
    }
    //document.getElementById("myP").innerHTML = myStr;
    console.log(linesOfTheRoude);
    return linesOfTheRoude;
  }

  evaluateDiver = () => {
    this.setState({ timeToEval: true });
  };

  everythingDone = () => {
    console.log(this.state.driverName);
    console.log(this.state.value);
    var formparameters = {
      method: "POST", // or 'PUT'
      body: JSON.stringify({
        DriverName: this.state.driverName,
        eval: this.state.value,
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(
      "https://jzijzhved1.execute-api.us-east-1.amazonaws.com/firstStage/evaluation",
      formparameters
    )
      .then((resp) => {
        return resp.json();
      })
      .then((json) => {
        console.log(json);
      })
      .then(() => {
        this.setState({ done: true });
        //this.doingTheTrip();
      });
  };

  handleChange2 = (event) => {
    this.setState({ value: event.target.value });
  };

  render() {
    if (!this.state.fileExists) {
      return <h1>Loading...</h1>;
    } else if (this.state.done) {
      return (
        <Router>
          <MainPage />
        </Router>
      );
    } else if (this.state.timeToEval) {
      return (
        <>
          <h1>Avalie a sua viagem:</h1>
          <select value={this.state.value} onChange={this.handleChange2}>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
          </select>
          <button onClick={this.everythingDone}>Avaliar</button>
        </>
      );
    } else if (this.state.tripRejected) {
      return (
        <Router>
          <MainPage />
        </Router>
      );
    } else if (this.state.tripAccepted) {
      return (
        <>
          <h1>
            Nome do Condutor: {this.state.driverName}
            <br />
            Avaliação do Condutor: {this.state.driverRating}
          </h1>
          <p id="myP"></p>
          {this.addingLines()}
          <button onClick={this.evaluateDiver}>Terminar Viagem</button>
        </>
      );
    } else if (this.state.confirmed) {
      return (
        <>
          <h1>Deseja aceitar a viagem?</h1>
          <h2>
            Preço: {this.state.tripPrice}
            <br />
            Nome do Condutor: {this.state.driverName}
            <br />
            Avaliação do Condutor: {this.state.driverRating}
          </h2>
          <button onClick={this.tripAccepted}>Aceito!</button>
          <button onClick={this.triprefused}>Não quero esta Viagem!</button>
        </>
      );
    } else if (this.state.PossibleLocations !== undefined) {
      return (
        <div className="custom-select">
          <select onChange={this.handleChange}>
            {this.createSelectItems()}
          </select>
          <button onClick={this.selectedLocation}>Confirm Location</button>
        </div>
      );
    } else {
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
          <div>
            <h1>Verify The Location</h1>
            <StyledEdiText
              type="text"
              value={this.state.message}
              onSave={this.onSave}
            />
            <button onClick={this.confirmed}>Confirm!</button>
          </div>
          <div>
            {this.state.errormessage}
            <button className="backbuttonMenu">Go Back</button>
            <div onClick={this.handleClick.bind(this)}>
              {this.state.isRecording
                ? isRecordingButton
                : isNotRecordingButton}
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
}

export default checkConvertion;
