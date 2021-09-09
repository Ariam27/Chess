import React, { Component } from "react";
import ChessBoard from "../Chessboard/Board";
import LoginForm from "./LoginForm";
import SignUpForm from "./SignUpForm";
import Board from "../Chessboard/chess";
import "./styles.css";

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = { form: "login" };
  }

  render() {
    return (
      <div className="Login">
        <h1 className="title">Chess</h1>
        <div className="leftPanel">
          <ChessBoard
            board={new Board("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w")}
          />
        </div>
        <div className="rightPanel">
          {this.state.form === "login" && (
            <LoginForm
              formChangeCallback={() => this.setState({ form: "signup" })}
            />
          )}
          {this.state.form === "signup" && (
            <SignUpForm
              formChangeCallback={() => this.setState({ form: "login" })}
            />
          )}
        </div>
      </div>
    );
  }
}
