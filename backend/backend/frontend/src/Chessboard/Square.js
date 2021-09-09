import React, { Component } from "react";
import { isEqual } from "lodash";
import PromotionOptions from "./PromotionOptions";
import { boardContext } from "./BoardContext";
import "./styles.css";

const isIn = (i, o) => o.some((row) => isEqual(row, i));

export default class Square extends Component {
  static contextType = boardContext;

  render() {
    let backgroundColor;
    let highlight = null;

    if (isEqual(this.props.square.square, this.context.active)) {
      backgroundColor = this.context.preferences["active_highlight"];
    } else if (isIn(this.props.square.square, this.context.last_move)) {
      backgroundColor = this.context.preferences["last_move_highlight"];
    } else {
      backgroundColor = this.context.preferences[this.props.square.color];
    }

    if (isIn(this.props.square.square, this.context.highlighted_squares)) {
      highlight = this.props.square.piece !== null ? "piece" : "empty";
    }

    const style = {
      backgroundColor: backgroundColor,
      height: `${this.context.height}px`,
      width: `${this.context.width}px`,
      position: "relative",
      userSelect: "none",
    };

    return (
      <div
        style={style}
        className="boardSquare"
        data-square={JSON.stringify(this.props.square.square)}
        onClick={(e) => this.onSquareClick(e, this.props.square.square)}
        onMouseUp={(e) => this.onMouseUp(e, this.props.square.square)}
      >
        {this.props.square.piece !== null &&
          !isEqual(this.props.square.square, this.context.grabbed) && (
            <img
              className="boardPiece"
              data-square={JSON.stringify(this.props.square.square)}
              src={`./img/${this.props.square.piece.color}/${this.props.square.piece.symbol}.png`}
              height={this.context.height}
              width={this.context.width}
              onMouseDown={(e) => this.onMouseDown(e, this.props.square.square)}
              onDragStart={(e) => false}
            ></img>
          )}

        {highlight === "piece" && (
          <div
            className="pieceHighlight"
            style={{ border: `${0.06 * this.context.width}px solid black` }}
          ></div>
        )}
        {highlight === "empty" && <div className="emptyHighlight"></div>}

        {isEqual(this.props.square.square, this.context.promotion_options) &&
          !isEqual(this.context.active, []) && (
            <PromotionOptions
              color={
                this.props.board.board.get(...this.context.active).piece.color
              }
              promotionCallback={(e, piece) =>
                this.promotionCallback(e, piece, this.props.square.square)
              }
            />
          )}
      </div>
    );
  }

  onMouseDown = (ev, ogsqr) => {
    if (isIn(ogsqr, this.context.highlighted_squares)) return;

    let board = this.props.board;
    let final_squares = [];

    if (board.board.get(...ogsqr).piece.color === board.to_move) {
      let moves = board
        .generate_legal_moves()
        .get(board.board.get(...ogsqr).piece);

      for (let move of moves) {
        final_squares.push(move.final_square);
      }
    }

    this.context.dispatch({
      type: "UPDATE_ACTIVE",
      payload: ogsqr,
    });

    this.context.dispatch({
      type: "HIGHLIGHT_SQUARES",
      payload: final_squares,
    });

    let callback = (e) => {
      document.removeEventListener("click", callback);

      if (
        (e.target.className !== "boardSquare" &&
          e.target.className !== "boardPiece" &&
          e.target.className !== "promotionOptions" &&
          e.target.className !== "promotionOption") ||
        !isIn(
          JSON.parse(e.target.dataset.square),
          this.context.highlighted_squares
        )
      ) {
        if (!isEqual(this.context.promotion_options, [])) return;
        this.context.dispatch({
          type: "UPDATE_ACTIVE",
          payload: [],
        });

        this.context.dispatch({
          type: "HIGHLIGHT_SQUARES",
          payload: [],
        });
      }
    };
    document.addEventListener("click", callback);

    this.context.dispatch({
      type: "UPDATE_HANDLE",
      payload: {
        src: ev.target.src,
        top: `${ev.pageY - this.context.height / 2}px`,
        left: `${ev.pageX - this.context.width / 2}px`,
        width: this.context.width,
        height: this.context.height,
      },
    });

    this.context.dispatch({
      type: "UPDATE_GRABBED",
      payload: ogsqr,
    });
  };

  onMouseUp = (ev, sqr) => {
    if (
      isIn(sqr, this.context.highlighted_squares) &&
      !isEqual(this.context.grabbed, []) &&
      this.props.board.board.get(...this.context.grabbed).piece &&
      this.props.board.board.get(...this.context.grabbed).piece.color ===
        this.props.board.to_move
    ) {
      let ogsqr = this.context.grabbed;
      let moves = this.props.board
        .generate_legal_moves()
        .get(this.props.board.board.get(...ogsqr).piece)
        .filter((m) => isEqual(sqr, m.final_square));

      if (moves.length > 1) {
        this.context.dispatch({
          type: "UPDATE_PROMOTION_OPTIONS",
          payload: sqr,
        });

        this.context.dispatch({
          type: "HIGHLIGHT_SQUARES",
          payload: [],
        });

        this.context.dispatch({
          type: "UPDATE_GRABBED",
          payload: [],
        });

        this.context.dispatch({
          type: "UPDATE_HANDLE",
          payload: {},
        });
      } else {
        let move = moves[0];
        this.props.board.execute(move);
        this.context.dispatch({
          type: "UPDATE_LAST_MOVE",
          payload: [move.original_square, move.final_square],
        });

        this.context.dispatch({
          type: "HIGHLIGHT_SQUARES",
          payload: [],
        });

        this.context.dispatch({
          type: "UPDATE_GRABBED",
          payload: [],
        });

        this.context.dispatch({
          type: "UPDATE_HANDLE",
          payload: {},
        });
      }
    }
  };

  onSquareClick = (ev, sqr) => {
    if (
      isIn(sqr, this.context.highlighted_squares) &&
      this.props.board.board.get(...this.context.active).piece &&
      this.props.board.board.get(...this.context.active).piece.color ===
        this.props.board.to_move
    ) {
      let ogsqr = this.context.active;
      let moves = this.props.board
        .generate_legal_moves()
        .get(this.props.board.board.get(...ogsqr).piece)
        .filter((m) => isEqual(sqr, m.final_square));

      if (moves.length > 1) {
        this.context.dispatch({
          type: "UPDATE_PROMOTION_OPTIONS",
          payload: sqr,
        });

        this.context.dispatch({
          type: "HIGHLIGHT_SQUARES",
          payload: [],
        });
      } else {
        let move = moves[0];
        this.props.board.execute(move);
        this.context.dispatch({
          type: "UPDATE_LAST_MOVE",
          payload: [move.original_square, move.final_square],
        });

        this.context.dispatch({
          type: "HIGHLIGHT_SQUARES",
          payload: [],
        });
      }
    }
  };

  promotionCallback = (ev, piece, square) => {
    let ogsqr = this.context.active;
    let fnsqr = square;
    let board = this.props.board;

    let moves = board
      .generate_legal_moves()
      .get(board.board.get(...ogsqr).piece)
      .filter((m) => isEqual(fnsqr, m.final_square));

    let move = moves.filter(
      (m) => m.name[m.name.indexOf("=") + 1] === piece
    )[0];

    board.execute(move);

    this.context.dispatch({
      type: "UPDATE_LAST_MOVE",
      payload: [move.original_square, move.final_square],
    });

    this.context.dispatch({
      type: "HIGHLIGHT_SQUARES",
      payload: [],
    });

    this.context.dispatch({
      type: "UPDATE_PROMOTION_OPTIONS",
      payload: [],
    });
  };
}
