import {
  UPDATE_PREFERENCE,
  HIGHLIGHT_SQUARES,
  UPDATE_LAST_MOVE,
  UPDATE_WIDTH,
  UPDATE_HEIGHT,
  UPDATE_ACTIVE,
  UPDATE_PROMOTION_OPTIONS,
  UPDATE_GRABBED,
  UPDATE_HANDLE,
} from "./actions";

export const initialState = {
  preferences: {
    white: "#eeeed2",
    black: "#769638",
    whiteHighlight: "",
    blackHighlight: "",
    last_move_highlight: "#edff5f",
    active_highlight: "#edff5f",
  },
  highlighted_squares: [],
  last_move: [],
  active: [],
  promotion_options: [],
  grabbed: [],
  handle: {},
  width: 400,
  height: 400,
};

function reducer(state = initialState, action) {
  switch (action.type) {
    case UPDATE_PREFERENCE:
      return {
        ...state,
        preference: action.payload,
      };

    case HIGHLIGHT_SQUARES:
      return {
        ...state,
        highlighted_squares: action.payload,
      };

    case UPDATE_LAST_MOVE:
      return {
        ...state,
        last_move: action.payload,
      };

    case UPDATE_WIDTH:
      return {
        ...state,
        width: action.payload,
      };

    case UPDATE_HEIGHT:
      return {
        ...state,
        height: action.payload,
      };

    case UPDATE_ACTIVE:
      return {
        ...state,
        active: action.payload,
      };

    case UPDATE_PROMOTION_OPTIONS:
      return {
        ...state,
        promotion_options: action.payload,
      };

    case UPDATE_GRABBED:
      return {
        ...state,
        grabbed: action.payload,
      };

    case UPDATE_HANDLE:
      return {
        ...state,
        handle: action.payload,
      };

    default:
      return state;
  }
}

export default reducer;
