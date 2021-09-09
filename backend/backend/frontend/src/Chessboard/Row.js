import React, { Component } from "react";
import Square from "./Square";
import "./styles.css";

export default class Row extends Component {
  render() {
    return (
      <div className="boardRow">
        {this.props.row.map((square) => (
          <Square
            board={this.props.board}
            square={square}
            key={square.square}
          />
        ))}
      </div>
    );
  }
}
