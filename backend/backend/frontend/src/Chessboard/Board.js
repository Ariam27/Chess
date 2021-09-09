import React, { Component, createRef, createContext } from "react";
import Row from "./Row";
import "./styles.css";
import { clamp, isEqual } from "lodash";
import reducer, { initialState } from "./reducers";
import { boardContext } from "./BoardContext";

export default class Board extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ...initialState,
      dispatch: (action) => {
        this.setState((state) => reducer(state, action));
      },
    };
    this.boardRef = createRef();
    this.handleRef = createRef();
  }

  render() {
    const style = {
      width: `${this.state.width}px`,
      height: `${this.state.height}px`,
    };

    return (
      <div className="board" style={style} ref={this.boardRef}>
        <boardContext.Provider
          value={{
            ...this.state,
            width: this.state.width / 8,
            height: this.state.height / 8,
          }}
        >
          {this.props.board.board.tolist().map((row) => (
            <Row board={this.props.board} row={row} key={row[0].square[0]} />
          ))}

          {!isEqual(this.state.handle, {}) && (
            <img
              src={this.state.handle.src}
              className="dragged"
              width={this.state.handle.width}
              height={this.state.handle.height}
              style={{
                top: this.state.handle.top,
                left: this.state.handle.left,
              }}
              onDragStart={(e) => false}
              ref={this.handleRef}
            ></img>
          )}
        </boardContext.Provider>
      </div>
    );
  }

  componentDidMount() {
    this.removeHandleEventListeners = this.addHandleEventListeners();
  }

  componentDidUpdate() {
    this.removeHandleEventListeners();
    this.removeHandleEventListeners = this.addHandleEventListeners();
  }

  addHandleEventListeners() {
    let mousemove = (e) => {
      let handle = this.handleRef.current;

      if (!handle) return;

      let boardRect = this.boardRef.current.getBoundingClientRect();

      [handle.style.top, handle.style.left] = [
        `${clamp(
          e.pageY - this.state.height / 16,
          boardRect.top - this.state.height / 16,
          boardRect.bottom - this.state.height / 16
        )}px`,
        `${clamp(
          e.pageX - this.state.width / 16,
          boardRect.left - this.state.width / 16,
          boardRect.right - this.state.width / 16
        )}px`,
      ];
    };
    document.addEventListener("mousemove", mousemove);

    let mouseup = (e) => {
      let handle = this.handleRef.current;

      if (handle) {
        this.state.dispatch({
          type: "UPDATE_HANDLE",
          payload: {},
        });

        this.state.dispatch({
          type: "UPDATE_GRABBED",
          payload: [],
        });
      }
    };
    document.addEventListener("mouseup", mouseup);

    return () => {
      document.removeEventListener("mousemove", mousemove);
      document.removeEventListener("mouseup", mouseup);
    };
  }
}
