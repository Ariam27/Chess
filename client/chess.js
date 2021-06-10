var nj = require("numjs");
var $ = require("lodash");
const { thru } = require("lodash");

var names_rows = [8, 7, 6, 5, 4, 3, 2, 1];
var names_columns = ["a", "b", "c", "d", "e", "f", "g", "h"];

function square_exists(board, square){
    if (square[0] >= 0 && square[0] < board.board.shape[0] && square[1] >= 0 && square[1] < board.board.shape[1]){
        return true;
    };
    return false;
};

class Move {
    constructor(original_square, final_square, piece, board, test=false){
        this.original_square = original_square;
        this.final_square = final_square;
        this.piece = piece;
        this.board = board;
        this.name = "";

        if (test === false){
            let to_move = (this.board.to_move === "white") ? this.board.white : this.board.black;

            if (this.piece instanceof Pawn){
                if (this.board.board.get(...this.final_square).piece !== null){
                    this.name += names_columns[self.original_square[1]];
                };
            } else {
                this.name += this.piece.symbol.toUpperCase();
                
                let pieces = to_move.attacking[this.final_square].filter(i => i instanceof this.piece.constructor && ! i === this.piece)
                let file_ambi = "";
                let rank_ambi = "";
                for (let i of pieces){
                    let ambiguation = true;
                    if (this.board.is_pinned(i, to_move.pieces.filter(o => o instanceof King)[0])[0]){
                        let [_, pinner, series] = this.board.is_pinned(i, to_move.pieces.filter(o => o instanceof King)[0]);
                        if (! this.final_square in [pinner.square, ...pinner.attacking[series].slice(0, -1), ...pinner.xray[series].slice(0, -1)]){
                            ambiguation = false;
                        };
                    };

                    if (ambiguation){
                        if (i.square[1] === this.piece.square[1]){
                            rank_ambi = String(names_row[this.piece.square[0]]);
                        } else {
                            file_ambi = String(names_columns[self.piece.square[1]]);
                        };
                    };
                };
                this.name += file_ambi + rank_ambi;
            };

            if (! this.board.board.get(...this.final_square).piece === null){
                this.name += "x";
            };

            this.name += names_columns[this.final_square[1]] + String(names_rows[self.final_square[0]]);
            
            let test_board = $.cloneDeep(this.board);
            let test_move = new Move(this.original_square, this.final_square, test_board.board.get(...this.original_square).piece, test_board, true);
            test_board.execute(test_move);

            to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;

            if (to_move.check){
                let result = test_board.calc_result();
                if (! result === "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
                    this.name += "#";
                } else {
                    this.name += "+";
                };
            };
        };
    };

    execute() {
        if (! this.board.board.get(...this.final_square).piece === null){
            let to_remove = (this.board.board.get(...this.final_square).piece.color === "white") ? this.board.white : this.board.black;
            to_remove.pieces.splice(to_remove.pieces.indexOf(this.board.board.get(...this.final_square).piece), 1);
            this.board.board.get(...this.final_square).piece = null;
        };

        this.piece.square = this.final_square;
        this.board.board.get(...this.original_square).piece = null;
        this.board.board.get(...this.final_square).piece = this.piece;

        if (this.piece instanceof Rook || this.piece instanceof King){
            let change = (this.board.to_move === "white") ? this.board.white : this.board.black;
            if (this.original_square[1] === 7){
                change.kingside_castle = false;
            } else if (this.original_square[1] === 0) {
                change.queenside_castle = false;
            };
        };
    };

    toString() {
        return this.name;
    };
};

class KingSideCastle {
    constructor(board, test=false) {
        this.board = board;
        this.rank = (this.board.to_move === "white") ? 7 : 0;
        this.king = this.board.board.get(this.rank, 4).piece;
        this.rook = this.board.board.get(this.rank, 7).piece;
        this.piece = [this.king, this.rook];

        this.name = "0-0";

        if (! test) {
            let test_board = $.cloneDeep(this.board);
            let test_move = new KingSideCastle(test_board, true);
            test_board.execute(test_move);

            let to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;
            
            if (to_move.check) {
                let result = test_board.calc_result();
                if (! result === "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
                    this.name += "#";
                } else {
                    this.name += "+";
                };
            };
        };
    };

    execute() {
        this.board.board.get(...this.rook.square).piece = null;
        this.board.board.get(...this.king.square).piece = null;

        this.king.square = [this.rank, 6];
        this.rook.square = [this.rank, 5];

        this.board.board.get(...this.king.square).piece = this.king;
        this.board.board.get(...this.rook.square).piece = this.rook;

        let change = (this.board.to_move === "white") ? this.board.white : this.board.black;
        change.kingside_castle = false;
        change.queenside_castle = false;
    };

    toString() {
        return this.name;
    };
};

class QueenSideCastle {
    constructor(board, test=false) {
        this.board = board;
        this.rank = (this.board.to_move === "white") ? 7 : 0;
        this.king = this.board.board.get(this.rank, 4).piece;
        this.rook = this.board.board.get(this.rank, 0).piece;
        this.piece = [this.king, this.rook];

        this.name = "0-0-0";

        if (! test) {
            let test_board = $.cloneDeep(this.board);
            let test_move = new QueenSideCastle(test_board, true);
            test_board.execute(test_move);

            let to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;
            
            if (to_move.check) {
                let result = test_board.calc_result();
                if (! result === "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
                    this.name += "#";
                } else {
                    this.name += "+";
                };
            };
        };
    };

    execute() {
        this.board.board.get(...this.rook.square).piece = null;
        this.board.board.get(...this.king.square).piece = null;

        this.king.square = [this.rank, 2];
        this.rook.square = [this.rank, 3];

        this.board.board.get(...this.king.square).piece = this.king;
        this.board.board.get(...this.rook.square).piece = this.rook;

        let change = (this.board.to_move === "white") ? this.board.white : this.board.black;
        change.kingside_castle = false;
        change.queenside_castle = false;
    }; 

    toString() {
        return this.name;
    };
};

class Promotion extends Move {
    constructor(original_square, final_square, piece, board, promote_to, test=false) {
        super(original_square, final_square, piece, board, test);
        this.promote_to = promote_to;

        if (! test) {
            let symbols = {[Knight]: "N", [Bishop]: "B", [Queen]: "Q", [Rook]: "R"};

            this.name += "=" + symbols[this.promote_to];

            let test_board = $.cloneDeep(this.board);
            let test_move = new Promotion(this.original_square, this.final_square, test_board.board.get(...this.original_square).piece, test_board, this.promote_to, true);
            test_board.execute(test_move);

            let to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;
            
            if (to_move.check) {
                let result = test_board.calc_result();
                if (! result === "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
                    this.name += "#";
                } else {
                    this.name += "+";
                };
            };
        };
    };

    execute() {
        if (this.board.board.get(...this.final_square).piece !== null) {
            let to_remove = (this.board.board.get(...this.final_square).piece.color === "white") ? this.board.white : this.board.black;
            to_remove.pieces.splice(to_remove.pieces.indexOf(this.board.board.get(...this.final_square).piece), 1);
            this.board.board.get(...this.final_square).piece = null;
        };

        this.piece.square = this.final_square;
        this.board.board.get(...this.original_square).piece = null;
        this.board.board.get(...this.final_square).piece = this.piece;

        let to_remove = (this.piece.color === "white") ? this.board.white : this.board.black;
        to_remove.pieces.splice(to_remove.pieces.indexOf(this.piece), 1);

        let promoted_to = new this.promote_to(this.final_square, this.piece.color, this.board);
        this.board.board.get(...this.final_square).piece = promoted_to;
        to_remove.pieces.push(promoted_to);
    }; 

    toString() {
        return this.name;
    };
};

class EnPassant extends Move {
    constructor(original_square, final_square, piece, board, test=false) {
        super(original_square, final_square, piece, board, test);
        this.name = "";

        if (! test) {
            this.name += names_columns[this.original_square[1]];
            this.name += "x";
            this.name += names_columns[this.final_square[1]] + String(names_rows[this.final_square[0]]);

            let test_board = $.cloneDeep(this.board);
            let test_move = new EnPassant(this.original_square, this.final_square, test_board.board.get(...this.original_square).piece, test_board, true);
            test_board.execute(test_move);

            to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;

            if (to_move.check){
                let result = test_board.calc_result();
                if (! result === "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
                    this.name += "#";
                } else {
                    this.name += "+";
                };
            };
        };
    };

    execute() {
        let to_remove = (this.board.board.get(this.original_square[0], this.final_square[1]).piece.color === "white") ? this.board.white : this.board.black;
        to_remove.pieces.splice(to_remove.pieces.indexOf(this.board.board.get(this.original_square[0], this.final_square[1]).piece), 1);
        this.board.board.get(this.original_square[0], this.final_square[1]).piece = null;

        this.piece.square = this.final_square;
        this.board.board.get(...this.original_square).piece = null;
        this.board.board.get(...this.final_square).piece = this.piece;
    };

    toString() {
        return this.name;
    };
};

class Square {
    constructor(square, color, piece=null) {
        this.color = color;
        this.piece = piece;
        this.square = square;
    };

    toString() {
        return (this.piece !== null) ? this.piece.symbol : "."; 
    };
};

class Side {
    constructor(color) {
        this.color = color;
        this.piece = [];
        this.attacking = {};
        this.xray = {};
        this.check = false;
        this.kingside_castle = true;
        this.queenside_castle = true;
    };
};
