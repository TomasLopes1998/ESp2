import React from 'react';
import ReactDOM from 'react-dom';
import Mainpage from './mainPage'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Link,
    useRouteMatch,
    useParams
  } from "react-router-dom";

class Login extends React.Component {
    constructor(props) {
        super(props);
        this.state = {login : '', password : ''}

        this.handleLoginChange = this.changeLogin.bind(this);
        this.handlePasswordChange = this.changePassword.bind(this);
    }

    changeLogin(event) {
        this.setState({ login : event.target.value })
    }

    changePassword(event) {
        this.setState({ password : event.target.value })
    }

    render () {
        return (
            <form>
                Login <input type="text" value={this.state.login} onChange={this.handleLoginChange}/> <br/>
                Password <input type="password" value={this.state.password} onChange={this.handlePasswordChange}/> <br/>
                <input type="button" value="submit" onClick={this.props.login.bind(this.props.parent, this.state.login, this.state.password)}/>
            </form>
        )
    }
}

class Page extends React.Component {
    constructor(props) {
        super(props);
        this.state = {token : undefined, errormessage : undefined };
    }

    authenticated(token) {
        this.setState({ token : token, errormessage : undefined })
    }

    failedauthenticated() {
        this.setState({ token : undefined, errormessage : 'Authentication Error' })
    }

    doLogin(login, password) {
        var theobject = this
        var formparameters = {
            method: 'POST', // or 'PUT'
            body: JSON.stringify({'login' : login, 'password' : password}),
            headers:{
              'Content-Type': 'application/json',
            }
        }
  fetch(" https://jzijzhved1.execute-api.us-east-1.amazonaws.com/firstStage/login", formparameters).then(function(data) {
            if(data.status!==200) {
                theobject.failedauthenticated()
                throw new Error(data.status)
            }
            else {
                var json = data.json();
                return json;
            }
  }).then(function(thetoken) {
            console.log('message =', thetoken)
            if ('token' in thetoken)
                theobject.authenticated(thetoken['token'])
  }).catch(function(error) {
            console.log('There has been a problem with your fetch operation: ', error.message);
        });
    }

    render() {
        console.log(this.state.token)
        if (this.state.errormessage != undefined)
            var errormessage = <h2>{this.state.errormessage}</h2>
        else
            var errormessage = <div/>
        if (this.state.token == undefined)
            return (
                <div>
                    <h1>Welcome to ESUber</h1>
                    {errormessage}
                    <Login parent={this} login={this.doLogin}/>
                </div>
            )
        else
            return(
                <Router>
                    <Mainpage/>
                </Router>
            )
    }
}
export default Page;