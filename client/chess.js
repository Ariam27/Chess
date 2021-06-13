var nj = require("numjs");
var $ = require("lodash");

const isUpperCase = (string) => /^[A-Z]*$/.test(string);
const isLowerCase = (string) => /^[a-z]*$/.test(string);

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

class Board {
    constructor(fen="8/8/8/8/8/8/8/8") {
        this.board = np.zeros([8, 8]);
        this.fen = fen;
        this.to_move = (fen.split(" ")[1] === "w") ? "white" : "black";
        this.pieces = {"p": Pawn, "b": Bishop, "n": Knight, "k": King, "q": Queen, "r": Rook};
        this.white = new Side("white");
        this.black = new Side("black");
        this.moves = [[]];
        this.epsquare = [];
        this.positions = [[]];
        this.halfmove_clock = 0;
        this.result = "";

        for (let i = 0; i < this.board.shape[0]; i++){
            for (let o = 0; o < this.board.shape[1]; o++){
                if ((i+o)%2 === 0) {
                    this.board.set(i, o, new Square([i, o], "white"));
                } else {
                    this.board.set(i, o, new Square([i, o], "black"));
                };
            };
        };

        for (let i = 0; i < this.board.shape[0]; i++){
            for (let o = 0; o < this.board.shape[1]; o++){
                let square = this.board.get(i, o).square;
                this.white.attacking[square] = [];
                this.white.xray[square] = [];
                this.black.attacking[square] = [];
                this.black.xray[square] = [];
            };
        };

        let row = 0;
        let column = 0;

        for (let i of this.fen.split(" ")[0].split("/")){
            for (let o of i){
                if (isNaN(o)) {
                    if (o.toLowerCase in Object.keys(this.pieces)){
                        this.board.get(row, column).piece = new this.pieces[o.toLowerCase()]([row, column], (isLowerCase(o)) ? "black" : "white", this);
                        if (isLowerCase(o)){
                            this.black.pieces.push(this.board.get(row, column).piece);
                        } else {
                            this.white.pieces.push(this.board.get(row, column).piece);
                        };
                    };
                    column++;
                } else if (! isNaN(o)) {
                    column += parseInt(o);
                };

                if (column === 8) {
                    break;
                };
            };

            row++;
            column = 0;

            if (row === 8) {
                break;
            };
        };

        this.positions = (this.to_move === "white") ? [[String(this)]] : [["", String(this)]];
        this.calc_result();
    };

    update() {
        if (this.to_move === "white") {
            let check_attacking = this.black;
            let check = this.white;
        } else if (this.to_move === "black") {
            let check_attacking = this.white;
            let check = this.black;
        };

        check_attacking.attacking = Object.fromEntries(Object.keys(check_attacking.attacking).map(x => [x, []]));
        check_attacking.xray = $.cloneDeep(check_attacking.attacking);

        for (let i of check_attacking.pieces) {
            i.update();
            if (! $.isEqual(i.attacking, [])) {
                let o = i.attacking;
                if (i.sliding) {
                    o = [...(function*(){for (let k of o) for (let j of k) yield j;}())];
                    x = [...(function*(){for (let k of i.xray) for (let j of k) yield j;}())];

                    for (let u of x){
                        check_attacking.xray[u].push(i);
                    };
                };

                for (let u of o){
                    check_attacking.attacking[u].push(i);
                };
            };
        };

        let king = check.pieces.filter(i => i instanceof King)[0];
        if (! $.isEqual(check_attacking.attacking[king.square], [])){
            check.check = true;
        } else {
            check.check = false;
        };
    };

    generate_legal_moves() {
        let legal_moves = [];

        if (this.to_move === "white"){
            let to_move = this.white;
            let opponent = this.black;
        } else if (this.to_move === "black"){
            let to_move = this.black;
            let opponent = this.white;
        };

        to_move.attacking = Object.fromEntries(Object.keys(to_move.attacking).map(x => [x, []]));
        to_move.xray = $.cloneDeep(to_move.attacking);
        for (let i of to_moves.pieces){
            i.update();
            if (! $.isEqual(i.attacking, [])){
                for (let o of i.attacking){
                    if (i.sliding){
                        for (let u of o){
                            to_move.attacking[u].push(i);
                        };
                    } else {
                        to_move.attacking[o].push(i);
                    };
                };
            };

            if (i.sliding){
                for (let o of i.xray){
                    for (let u of o){
                        to_move.xray[u].push(i);
                    };
                };
            };
        };

        if (to_move.check){
            let king = to_move.pieces.filter(i => i instanceof King)[0];
            let pieces_checking = opponent.attacking[king.square];

            for (let i of king.move){
                let legal = true;

                for (let o of pieces_checking){
                    if (o.sliding){
                        let series = o.attacking.filter(k => king.square in k)[0];
                        series = o.attacking.indexOf(series);
                        if (i in o.xray[series]){
                            legal = false;
                            break;
                        };
                    };
                };

                if (legal){
                    if ($.isEqual(opponent.attacking[i], [])){
                        legal_moves.push(new Move(king.square, i, king, this));
                    };
                };
            };
        };
    };
};