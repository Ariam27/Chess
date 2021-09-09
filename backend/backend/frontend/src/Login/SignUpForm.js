import React, { Component } from "react";
import "./styles.css";

export default class SignUpForm extends Component {
  render() {
    return (
      <div className="signupForm">
        <div className="labelContainer">
          <div
            className="signupLogin"
            onClick={(e) => this.props.formChangeCallback()}
          >
            Login
          </div>

          <div className="signupSignUp">Sign Up</div>
        </div>

        <div className="formContainer">
          <form>
            <div className="signupInputs">
              <input type="text" id="signupUsername" placeholder="Username" />

              <input type="text" id="signupEmail" placeholder="Email" />

              <input
                type="password"
                id="signupPassword"
                placeholder="Password"
              />

              <input
                type="password"
                id="signupRepeatpassword"
                placeholder="Repeat Password"
              />

              <button type="submit" id="signupSubmit">
                Sign Up
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
}
