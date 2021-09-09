import { createContext } from "react";
import { initialState } from "./reducers";

export const boardContext = createContext(initialState);
