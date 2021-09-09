import { Component, createRef } from "react";
import { boardContext } from "./BoardContext";
import "./styles.css";

export default class PromotionOptions extends Component {
  static contextType = boardContext;

  constructor(props) {
    super(props);
    this.innerRef = createRef();
  }

  render() {
    const promotionOptionCancelBR = "15%";

    const style = {
      width: `${this.context.width}px`,
      height: `${this.context.height * 4.5}px`,
      top: `${this.props.color === "white" ? "0%" : "-350%"}`,
      left: "0%",
      display: "flex",
      flexDirection: `${
        this.props.color === "white" ? "column" : "column-reverse"
      }`,
    };

    return (
      <div
        className="promotionOptions"
        style={style}
        ref={this.innerRef}
        onLoad={(e) => document.addEventListener("click", this.handleClick)}
      >
        {["Q", "R", "B", "N"].map((piece) => (
          <img
            src={`./img/${this.props.color}/${
              this.props.color === "white" ? piece : piece.toLowerCase()
            }.png`}
            className="promotionOption"
            width={this.context.width}
            height={this.context.height}
            onClick={(e) => this.props.promotionCallback(e, piece)}
            key={piece}
          ></img>
        ))}
        <div
          className="promotionOption promotionOptionCancel"
          style={{
            width: `${this.context.width}px`,
            height: `${this.context.height / 2}px`,
            lineHeight: `${this.context.height / 2}px`,
            borderRadius: `${
              this.props.color === "white"
                ? `0% 0% ${promotionOptionCancelBR} ${promotionOptionCancelBR}`
                : `${promotionOptionCancelBR} ${promotionOptionCancelBR} 0% 0%`
            }`,
          }}
          onClick={this.onCancel}
        >
          X
        </div>
      </div>
    );
  }

  onCancel = (e) => {
    document.removeEventListener("click", this.handleClick);

    this.context.dispatch({
      type: "UPDATE_PROMOTION_OPTIONS",
      payload: [],
    });

    this.context.dispatch({
      type: "UPDATE_ACTIVE",
      payload: [],
    });

    this.context.dispatch({
      type: "HIGHLIGHT_SQUARES",
      payload: [],
    });
  };

  handleClick = (e) => {
    if (this.innerRef.current && !this.innerRef.current.contains(e.target)) {
      this.onCancel(e);
    }
  };
}
