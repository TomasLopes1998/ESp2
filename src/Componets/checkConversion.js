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
  accessKeyId: "ASIAQ7GA5VOFUAOYMIUY",
  secretAccessKey: "r1y5czTxBYnhVCV38ajmvu8r8TRti0SvI4Fkh6cx",
  sessionToken:
    "FwoGZXIvYXdzECQaDD0EPUQwzPJ1V93T+SLJAfWi5Qnel6unVUsroTN4+seOfHhMX4a1D5LUgowbqpdVqn4Ov9mQ+ElXao6HI6MFvA2JHDPKDCXlJHwrT4+T72esu1wbj/jigEZ8Zd56WjOEU7Z2dCiwKbecq3hMDjv1HhXjuLf60rjjDUlTIzL6CqPZRaZl8UvvIIyJepihFdaIOKh/Who/5OtgJnmKkCTMjmFZWgL8DHep9NUFaJPpWCFXPzE/ZSYsdSv5c50Mz6+SuhMzbjNOl02rNeryoWWYI8bTNRg0XFbzvijd1t/2BTItrSAvF6ttco3MzaN/em7+9fLqfYv9jgxOP8w5HCItv+THnXg+fRZQ4lt6g7DQ",
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
      token: localStorage.getItem("token"),
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
      var token = localStorage.getItem("token");
      this.setState({ token: token });
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
    var formparameters = new Headers({
      method: "GET", // or 'PUT'
      headers: {
        "Content-Type": "application/json",
        //AuthorizationToken: this.state.token,
      },
    });
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

  getJson = () => {
    var formparameters = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //"AuthorizationToken":this.state.token
      },
      body: JSON.stringify({ file_name: "test973167379" }),
      //body: JSON.stringify({ file_name: this.state.fileName }),
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
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        //AuthorizationToken: this.state.token,
      },
      body: JSON.stringify({ location: this.state.message }),
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
        //AuthorizationToken: this.state.token,
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
      headers: {
        "Content-Type": "application/json",
        AuthorizationToken: this.state.token,
      },
      method: "POST", // or 'PUT'
      body: JSON.stringify({
        destination: this.state.destination,
        taxiLocation: this.state.randomLocation[0],
        personLocation: this.state.randomLocation[1],
      }),
    };
    console.log(formparameters);
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
      headers: {
        "Content-Type": "application/json",
        AuthorizationToken: this.state.token,
      },
      method: "POST", // or 'PUT'
      body: JSON.stringify({
        DriverName: this.state.driverName,
        eval: this.state.value,
      }),
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
          <div className="card">
            <h1 className="titleA">Avalie a sua viagem:</h1>
            <select
              className="selectA"
              value={this.state.value}
              onChange={this.handleChange2}
            >
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <button className="buttonAvalie" onClick={this.everythingDone}>
              Avaliar
            </button>
          </div>
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
          <div>
            <div className="leftColumn">
              <h1>
                Nome do Condutor: {this.state.driverName}
                <br />
                Avaliação do Condutor: {this.state.driverRating}
              </h1>
            </div>
            <div className="rightColumn">
              <p id="myP"></p>
              {this.addingLines()}
            </div>
          </div>
          <button onClick={this.evaluateDiver}>Terminar Viagem</button>
        </>
      );
    } else if (this.state.confirmed) {
      return (
        <>
          <div class="card">
            <h5 className="titleCardD">Deseja aceitar a viagem?</h5>
            <h2>
              Preço: {this.state.tripPrice}
              <br />
              Nome do Condutor: {this.state.driverName}
              <br />
              Avaliação do Condutor: {this.state.driverRating}
            </h2>
            <button className="buttonA" onClick={this.tripAccepted}>
              Aceito!
            </button>
            <button className="buttonN" onClick={this.triprefused}>
              Não quero esta Viagem!
            </button>
          </div>
        </>
      );
    } else if (this.state.PossibleLocations !== undefined) {
      return (
        <div className="custom-select">
          <select className="selectC" onChange={this.handleChange}>
            {this.createSelectItems()}
          </select>
          <button className="confirmLocB" onClick={this.selectedLocation}>
            Confirm Location
          </button>
        </div>
      );
    } else {
      const isRecordingButton = (
        <button
          className="buttonMenuV"
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
            className="buttonMenuV"
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
            <h5 className="verLoc">Verify The Location</h5>
            <StyledEdiText
              type="text"
              value={this.state.message}
              onSave={this.onSave}
            />
            <button className="confirmB" onClick={this.confirmed}>
              Confirm!
            </button>
          </div>
          <div>
            {this.state.errormessage}
            <button className="backbuttonMenuV "></button>
            <div onClick={this.handleClick.bind(this)}>
              {this.state.isRecording
                ? isRecordingButton
                : isNotRecordingButton}
            </div>
            <audio
              className="audioV"
              src={this.state.blobURL}
              controls="controls"
            />
          </div>
          <div>
            <button className="letsBV" onClick={this.sendToS3}>
              Let's Go
            </button>
          </div>
        </>
      );
    }
  }
}

export default checkConvertion;
