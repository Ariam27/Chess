import React, { Component } from "react";
import "./styles.css";

export default class LoginForm extends Component {
  render() {
    return (
      <div className="loginForm">
        <div className="labelContainer">
          <div className="loginLogin">Login</div>

          <div
            className="loginSignUp"
            onClick={(e) => this.props.formChangeCallback()}
          >
            Sign Up
          </div>
        </div>

        <div className="formContainer">
          <form>
            <div className="loginInputs">
              <input type="text" id="loginEmail" placeholder="Email" />

              <input
                type="password"
                id="loginPassword"
                placeholder="Password"
              />

              <button id="forgotPassword">Forgot Your Password?</button>

              <button type="submit" id="loginSubmit">
                Login
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
