import React, { Component } from "react";
import "./index.css";

class Login extends Component {
  constructor(props) {
    super(props);
    this.state = { login: "", password: "" };

    this.handleLoginChange = this.changeLogin.bind(this);
    this.handlePasswordChange = this.changePassword.bind(this);
  }

  changeLogin(event) {
    this.setState({ login: event.target.value });
  }

  changePassword(event) {
    this.setState({ password: event.target.value });
  }

  render() {
    return (
      <div className="body">
        <img
          classname="img"
          alt=""
          src="data:image/png;base64,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"
        />
        <form>
          <label className="labelLogin">
            Login
            <input
              className="input"
              type="text"
              value={this.state.login}
              onChange={this.handleLoginChange}
            />
          </label>
          <br />
          <label className="labelPass">
            Password
            <input
              className="input"
              type="password"
              value={this.state.password}
              onChange={this.handlePasswordChange}
            />
          </label>
          <br />
          <button
            className="button"
            onClick={this.props.login.bind(
              this.props.parent,
              this.state.login,
              this.state.password
            )}
          >
            submit
          </button>
        </form>
      </div>
    );
  }
}

class Page extends React.Component {
  constructor(props) {
    super(props);
    this.state = { token: undefined, errormessage: undefined };
  }

  authenticated(token) {
    this.setState({ token: token, errormessage: undefined });
  }

  failedauthenticated() {
    this.setState({ token: undefined, errormessage: "Authentication Error" });
  }

  doLogin(login, password) {
    var theobject = this;
    var formparameters = {
      method: "POST", // or 'PUT'
      body: JSON.stringify({ login: login, password: password }),
      headers: {
        "Content-Type": "application/json",
      },
    };
    fetch(this.props.loginserver, formparameters)
      .then(function (data) {
        if (data.status !== 200) {
          theobject.failedauthenticated();
          throw new Error(data.status);
        } else {
          var json = data.json();
          return json;
        }
      })
      .then(function (thetoken) {
        console.log("message =", thetoken);
        if ("token" in thetoken) theobject.authenticated(thetoken["token"]);
      })
      .catch(function (error) {
        console.log(
          "There has been a problem with your fetch operation: ",
          error.message
        );
      });
  }

  render() {
    var errormessage;
    console.log(this.state.token);
    if (this.state.errormessage !== undefined)
      errormessage = <h2>{this.state.errormessage}</h2>;
    else errormessage = <div />;
    if (this.state.token === undefined)
      return (
        <div>
          {errormessage}
          <Login parent={this} login={this.doLogin} />
        </div>
      );
  }
}

export default Page;
