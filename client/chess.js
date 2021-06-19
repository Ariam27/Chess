var nj = require("numjs");
var $ = require("lodash");
var prompt = require("prompt-sync")({ sigint: true });
const { get, replace } = require("lodash");

const isUpperCase = (string) => /^[A-Z]*$/.test(string);
const isLowerCase = (string) => /^[a-z]*$/.test(string);
const isIn = (i, o) => o.some(row => $.isEqual(row, i));
const min = Math.min;
const max = Math.max;

var names_rows = [8, 7, 6, 5, 4, 3, 2, 1];
var names_columns = ["a", "b", "c", "d", "e", "f", "g", "h"];

function square_exists(board, square, pawn=false){
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
                    this.name += names_columns[this.original_square[1]];
                };
            } else {
                this.name += this.piece.symbol.toUpperCase();
                
                let pieces = to_move.attacking[this.final_square].filter(i => i instanceof this.piece.constructor && ! (i === this.piece))
                let file_ambi = "";
                let rank_ambi = "";
                for (let i of pieces){
                    let ambiguation = true;
                    if (this.board.is_pinned(i, to_move.pieces.filter(o => o instanceof King)[0])[0]){
                        let [_, pinner, series] = this.board.is_pinned(i, to_move.pieces.filter(o => o instanceof King)[0]);
                        if (! (isIn(this.final_square, [pinner.square, ...pinner.attacking[series].slice(0, -1), ...pinner.xray[series].slice(0, -1)]))){
                            ambiguation = false;
                        };
                    };

                    if (ambiguation){
                        if (i.square[1] === this.piece.square[1]){
                            rank_ambi = String(names_row[this.piece.square[0]]);
                        } else {
                            file_ambi = String(names_columns[this.piece.square[1]]);
                        };
                    };
                };
                this.name += file_ambi + rank_ambi;
            };

            if (this.board.board.get(...this.final_square).piece !== null){
                this.name += "x";
            };

            this.name += names_columns[this.final_square[1]] + String(names_rows[this.final_square[0]]);
            
            let test_board = $.cloneDeep(this.board);
            test_board.board.shape = this.board.board.shape;
            let test_move = new Move(this.original_square, this.final_square, test_board.board.get(...this.original_square).piece, test_board, true);
            test_board.execute(test_move);

            to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;

            if (to_move.check){
                let result = test_board.calc_result();
                if (result !== "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
                    this.name += "#";
                } else {
                    this.name += "+";
                };
            };
        };
    };

    execute() {
        if (this.board.board.get(...this.final_square).piece !== null){
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
            test_board.board.shape = this.board.board.shape;
            let test_move = new KingSideCastle(test_board, true);
            test_board.execute(test_move);

            let to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;
            
            if (to_move.check) {
                let result = test_board.calc_result();
                if (result !== "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
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
            test_board.board.shape = this.board.board.shape;
            let test_move = new QueenSideCastle(test_board, true);
            test_board.execute(test_move);

            let to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;
            
            if (to_move.check) {
                let result = test_board.calc_result();
                if (result !== "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
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
            test_board.board.shape = this.board.board.shape;
            let test_move = new Promotion(this.original_square, this.final_square, test_board.board.get(...this.original_square).piece, test_board, this.promote_to, true);
            test_board.execute(test_move);

            let to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;
            
            if (to_move.check) {
                let result = test_board.calc_result();
                if (result !== "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
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
            test_board.board.shape = this.board.board.shape;
            let test_move = new EnPassant(this.original_square, this.final_square, test_board.board.get(...this.original_square).piece, test_board, true);
            test_board.execute(test_move);

            to_move = (test_board.to_move === "white") ? test_board.white : test_board.black;

            if (to_move.check){
                let result = test_board.calc_result();
                if (result !== "" && result.split(" ")[1].replace("[", "").replace("]", "") === "CHECKMATE"){
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
        this.pieces = [];
        this.attacking = {};
        this.xray = {};
        this.check = false;
        this.kingside_castle = true;
        this.queenside_castle = true;
    };
};

class Board {
    constructor(fen="8/8/8/8/8/8/8/8") {
        this.board = nj.zeros([8, 8]);
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
                    if (isIn(o.toLowerCase(), Object.keys(this.pieces))){
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
        let check_attacking;
        let check;

        if (this.to_move === "white") {
            check_attacking = this.black;
            check = this.white;
        } else if (this.to_move === "black") {
            check_attacking = this.white;
            check = this.black;
        };

        check_attacking.attacking = Object.fromEntries(Object.keys(check_attacking.attacking).map(x => [x, []]));
        check_attacking.xray = $.cloneDeep(check_attacking.attacking);

        for (let i of check_attacking.pieces) {
            i.update();
            if (! $.isEqual(i.attacking, [])) {
                let o = i.attacking;
                if (i.sliding) {
                    o = [...(function*(){for (let k of o) for (let j of k) yield j;}())];
                    let x = [...(function*(){for (let k of i.xray) for (let j of k) yield j;}())];

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
        let to_move;
        let opponent;

        if (this.to_move === "white"){
            to_move = this.white;
            opponent = this.black;
        } else if (this.to_move === "black"){
            to_move = this.black;
            opponent = this.white;
        };

        to_move.attacking = Object.fromEntries(Object.keys(to_move.attacking).map(x => [x, []]));
        to_move.xray = $.cloneDeep(to_move.attacking);
        for (let i of to_move.pieces){
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
                        let series = o.attacking.filter(k => isIn(king.square, k))[0];
                        series = o.attacking.indexOf(series);
                        if (isIn(i, o.xray[series])){
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

            if (! (pieces_checking.length > 1)){
                if (pieces_checking[0].sliding){
                    let series = pieces_checking[0].attacking.filter(i => isIn(king.square, i))[0];
                    series = series.slice(0, -1);
                    
                    for (let i of to_move.pieces){
                        if (! (i instanceof King)){
                            if (! this.is_pinned(i, king)[0]){
                                for (let u of i.move){
                                    if (isIn(u, series)){
                                        legal_moves.push(new Move(i.square, u, i, this));
                                    };
                                };
                            };
                        };
                    };
                };

                for (let i of to_move.attacking[pieces_checking[0].square]){
                    if (! this.is_pinned(i, king)[0] && ! (i instanceof King)){
                        legal_moves.push(new Move(i.square, pieces_checking[0].square, i, this));
                    };
                };
            };
        } else {
            for (let i of to_move.pieces){
                if (this.is_pinned(i, to_move.pieces.filter(o => o instanceof King)[0])[0]){
                    let [_, o, series] = this.is_pinned(i, to_move.pieces.filter(o => o instanceof King)[0]);
                    
                    for (let u of [o.square, ...o.attacking[series].slice(0, -1), ...o.xray[series].slice(0, -1)]){
                        if (isIn(u, i.move)){
                            legal_moves.push(new Move(i.square, u, i, this));
                        };
                    };

                    if (i instanceof Pawn){
                        if (isIn(o.square, i.attacking)){
                            legal_moves.push(new Move(i.square, o.square, i, this));
                        };
                    };
                } else {
                    if (! (i instanceof King)){
                        for (let o of i.move){
                            legal_moves.push(new Move(i.square, o, i , this));
                        };

                        if (i instanceof Pawn){
                            for (let o of i.attacking){
                                if (this.board.get(...o).piece !== null){
                                    if (this.board.get(...o).piece.color !== i.color){
                                        legal_moves.push(new Move(i.square, o, i, this));
                                    };
                                };
                            };
                        };
                    } else {
                        for (let o of i.move){
                            if ($.isEqual(opponent.attacking[o], [])){
                                legal_moves.push(new Move(i.square, o, i, this));
                            };
                        };
                    };
                };
            };
            
            let rank = (to_move === this.white) ? 7 : 0;
            if (this.board.get(rank, 4).piece instanceof King && this.board.get(rank, 7).piece instanceof Rook){
                if (to_move.kingside_castle && $.isEqual(opponent.attacking[[rank, 5]], []) && $.isEqual(opponent.attacking[[rank, 6]], []) && this.board.get(rank, 5).piece === null && this.board.get(rank, 6).piece === null){
                    legal_moves.push(new KingSideCastle(this));
                };
            };

            if (this.board.get(rank, 4).piece instanceof King && this.board.get(rank, 0).piece instanceof Rook){
                if (this.to_move.queenside_castle && $.isEqual(opponent.attacking[[rank, 2]], []) && $.isEqual(opponent.attacking[[rank, 3]], []) && this.board.get(rank, 1).piece === null && this.board.get(rank, 2).piece === null && this.board.get(rank, 3).piece === null){
                    legal_moves.push(new QueenSideCastle(this));
                };
            };
        };

        if (! $.isEqual(this.epsquare, [])){
            let row = this.epsquare[0] + ((this.to_move === "white") ? 1 : -1);

            for (let i of [1, -1]){
                if (square_exists(this, [row, this.epsquare[1]+i])){
                    if (this.board.get(row, this.epsquare[1]+i).piece instanceof Pawn && this.board.get(row, this.epsquare[1]+i).piece.color === this.to_move){
                        let test_board = $.cloneDeep(this);
                        test_board.board.shape = this.board.shape;
                        let test_move = new EnPassant([row, test_board.eqsquare[1]+i], test_board.epsquare, test_board.board.get(row, test_board.epsquare[1]+i).piece, test_board, true);
                        test_board.execute(test_move);
                        test_board.to_move = (test_board.to_move === "white") ? "black" : "white";
                        test_board.update();

                        let check = (test_board.to_move === "white") ? test_board.white : test_board.black;
                        
                        if (! check.check){
                            legal_moves.push(new EnPassant([row, this.epsquare[1]+i], this.epsquare, this.board.get(row, this.epsquare[1]+i).piece, self));
                        };
                    };
                };
            };
        };

        let to_delete = [];
        for (let i of legal_moves){
            if (! (i instanceof KingSideCastle || i instanceof QueenSideCastle || i instanceof Promotion || i instanceof EnPassant)){
                if (i.piece instanceof Pawn){
                    let r = (i.piece.color === "white") ? 0 : 7;
                    if (i.final_square[0] === r){
                        for (let u of [Knight, Bishop, Rook, Queen]){
                            legal_moves.push(new Promotion(i.original_square, i.final_square, i.piece, i.board, u));
                        };
                        to_delete.push(legal_moves.indexOf(i));
                    };
                };
            };
        };

        let copy_legal_moves = [];
        if (! $.isEqual(to_delete, [])){
            for (let i of $.range(legal_moves.length)){
                if (! (i in to_delete)){
                    copy_legal_moves.push(legal_moves[i]);
                };
            };
            legal_moves = copy_legal_moves;
        };

        let legal_moves_array;
        [legal_moves, legal_moves_array] = [new Map(to_move.pieces.map(x => [x, []])), legal_moves];

        for (let i of legal_moves_array){
            legal_moves.get((i instanceof KingSideCastle || i instanceof QueenSideCastle) ? to_move.pieces.filter(o => o instanceof King)[0] : i.piece).push(i);
        };

        return legal_moves;
    };

    is_pinned(piece, pinned_to){
        let attacker = (piece.color === "black") ? this.white : this.black;

        for (let i of attacker.attacking[piece.square]){
            if (i.sliding){
                let series = null;
                for (let o of $.range(i.attacking.length)){
                    if (isIn(piece.square, i.attacking[o])){
                        series = o;
                    };

                    if (series !== null){
                        if (isIn(pinned_to.square, i.xray[series])){
                            return [true, i, series];
                        };
                    };
                };
            };
        };

        return [false];
    };

    execute(move){
        move.execute();
        this.to_move = (this.to_move === "black") ? "white" : "black";
        this.update();

        if (this.moves.slice(-1)[0].length === 2){
            this.moves.push([]);
        };
        this.moves[this.moves.length-1].push(move.name);

        this.halfmove_clock++;
        if (move.piece instanceof Pawn || move.name.includes("x")){
            this.halfmove_clock = 0;
        };

        if (this.halfmove_clock === 0 || move instanceof KingSideCastle || move instanceof QueenSideCastle){
            this.positions = [[]];
            if (this.to_move === "black"){
                this.positions[this.positions.length-1].push("");
            };
        };

        this.epsquare = [];
        if (this.moves.slice(-1)[0].slice(-1)[0].length === 2 && (this.moves.slice(-1)[0].slice(-1)[0].endsWith("4") || this.moves.slice(-1)[0].slice(-1)[0].endsWith("5"))){
            let last = this.moves.slice(-1)[0].slice(-1)[0];
            let last_mover;

            if (this.moves.slice(-1)[0].length === 1){
                last_mover = "white";
            } else if (this.moves.slice(-1)[0].length === 2){
                last_mover = "black";
            };

            if ($.isEqual([], this.moves.filter(i => i[(last_mover === "white")?0:1] === last[0]+String((last_mover === "white")?3:6)).map(i => i[(last_mover === "white")?0:1]))){
                this.epsquare = [names_rows.indexOf(parseInt(last[1])+((last_mover === "white")?-1:1)), names_columns.indexOf(last[0])];
            };
        };

        if (this.positions.slice(-1)[0].length === 2){
            this.positions.push([]);
        };
        this.positions.slice(-1)[0].push(String(this));
    };

    calc_result(){
        if (this.result === ""){
            let legal_moves = this.generate_legal_moves();
            legal_moves = [].concat(...legal_moves.values());
            if ($.isEqual(legal_moves, [])){
                let to_move = (this.to_move === "white") ? this.white : this.black;
                if (to_move.check){
                    this.result = `[${(this.to_move === "black") ? "WHITE" : "BLACK"}] [CHECKMATE]`;
                } else {
                    this.result = "[DRAW] [STALEMATE]";
                };
            } else {
                let white_p = "";
                let black_p = "";

                if (this.white.pieces.length <= 3){
                    white_p = ["K", ...this.white.pieces.filter(i => ! (i instanceof King)).map(i => i.symbol.toUpperCase())].join("");
                };

                if (this.black.pieces.length <= 3){
                    black_p = ["K", ...this.black.pieces.filter(i => ! (i instanceof King)).map(i => i.symbol.toUpperCase())].join("");
                };

                if ((white_p === "KB" || white_p === "KN" || white_p === "K") && (black_p === "KB" || black_p === "KN" || black_p === "K")){
                    this.result = "[DRAW] [INSUFFICIENT MATERIAL]";
                    if (white_p === "KB" && black_p === "KB"){
                        let w_bishop = this.board.get(...this.white.pieces.filter(i => ! (i instanceof King))[0].square).color; 
                        let b_bishop = this.board.get(...this.black.pieces.filter(i => ! (i instanceof King))[0].square).color; 

                        if (w_bishop !== b_bishop){
                            this.result = "";
                        };
                    };
                };

                if ((white_p === "KNN" && black_p === "K") || (white_p === "K" && black_p === "KNN")){
                    this.result = "[DRAW] [INSUFFICIENT MATERIAL]";
                };

                if (this.halfmove_clock === 100){
                    this.result = "[DRAW] [50 MOVE RULE]";
                };

                if (! $.isEqual(this.positions, [[]])){
                    let current_position = this.positions.slice(-1)[0].slice(-1)[0];
                    let position_color = (this.to_move === "white") ? 0 : 1;
                    let matching_positions = this.positions.filter(i => i[position_color] === current_position).map(i => i[position_color]);
                    
                    if (matching_positions.length === 3){
                        this.result = "[DRAW] [3 FOLD REPETITION]";
                    };

                };
            };
        };

        return this.result;
    };

    timeout(color){
        let opp = (color === "black") ? this.white : this.black;
        this.result = `[${(opp === this.white) ? "WHITE" : "BLACK"}] [TIMEOUT]`;
        if (opp.pieces.length <= 3){
            let opp_p = ["K", ...opp.pieces.filter(i => ! (i instanceof King)).map(i => i.symbol.toUpperCase())].join("");
            if (opp_p in ["KB", "KN", "KNN", "K"]){
                this.result = "[DRAW] [INSUFFICIENT MATERIAL vs TIMEOUT]";
            };
        };

        return this.result;
    };

    resign(){
        this.result = `[${(this.to_move === "black") ? "WHITE" : "BLACK"}] [RESIGNATION]`;
        return this.result;
    };

    as_pgn(){
        let pgn = "";
        
        for (let i of $.range(this.moves.length)){
            pgn += `${i+1}. ${this.moves[i][0]} ${(this.moves[i].length === 2) ? this.moves[i][1] : ""} `;
        };

        return pgn;
    };

    toString(){
        let position = "";
        for (let i of $.range(this.board.shape[0])){
            for (let o of $.range(this.board.shape[1])){
                if ($.isEqual([i, o], this.epsquare)){
                    //position += "x";
                    position += String(this.board.get(i, o));
                } else {
                    position += String(this.board.get(i, o));
                };
            };
        };

        position += (this.white.kingside_castle) ? "K" : "";
        position += (this.white.queenside_castle) ? "Q" : "";
        position += (this.black.kingside_castle) ? "k" : "";
        position += (this.black.queenside_castle) ? "q" : "";

        return position;
    };
};

class Piece {
    constructor(square, color, board, symbol, sliding) {
        this.square = square;
        this.color = color;
        this.board = board;
        this.symbol = symbol;
        this.attacking = [];
        this.move = [];
        this.sliding = sliding;

        if (this.board.board.get(...this.square).piece === null){
            this.board.board.get(...this.square).piece = this;
        } else {
            if (this.board.get(...this.square).piece.color !== this.color){
                this.board.board.get(...this.square).piece.kill();
                this.board.board.get(...this.square).piece = this;
            } else {
                this.kill();
            };
        };
    };

    kill() {

    };
};

class Knight extends Piece {
    constructor(square, color, board) {
        super(square, color, board, (color === "black") ? "n" : "N", false);
        this.update();
    };

    update() {
        this.attacking = [];
        this.move = [];

        let y_offset = 0;
        let x_offset = 0;

        for (let i = 1; i < 9; i++) {
            if (i <= 2) {
                y_offset = -2;
                if (i === 1) {
                    x_offset = -1;
                } else {
                    x_offset = 1;
                };
            } else if (i <= 4) {
                x_offset = 2;
                if (i === 3) {
                    y_offset = -1;
                } else {
                    y_offset = 1;
                };
            } else if (i <= 6) {
                y_offset = 2;
                if (i === 5) {
                    x_offset = 1;
                } else {
                    x_offset = -1;
                };
            } else if (i <= 8) {
                x_offset = -2;
                if (i === 7) {
                    y_offset = 1;
                } else {
                    y_offset = -1;
                };
            };

            if (square_exists(this.board, [this.square[0]+y_offset, this.square[1]+x_offset])) {
                this.attacking.push([this.square[0]+y_offset, this.square[1]+x_offset]);
            };
        };

        this.move = this.attacking.filter(i => this.board.board.get(...i).piece === null || this.board.board.get(...i).piece.color !== this.color);
    };
};

class Queen extends Piece {
    constructor(square, color, board) {
        super(square, color, board, (color === "black") ? "q" : "Q", true);
        this.update();
    };

    update() {
        this.attacking = $.range(8).map(i => []);
        this.xray = $.range(8).map(i => []);
        this.move = [];

        let sqr;

        for (let i of $.range(this.square[0]+1, this.board.board.shape[0])){
            sqr = this.board.board.get(i, this.square[1]);

            if (sqr.piece !== null) {
                this.attacking[0].push(sqr.square);
                if (sqr.piece.color !== this.color) {
                    for (let o of $.range(sqr.square[0]+1, this.board.board.shape[0])) {
                        sqr = this.board.board.get(o, this.square[1]);
                        this.xray[0].push(sqr.square);
                        if (sqr.piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[0].push(sqr.square);
            };
        };

        if (this.square[0] !== 0) {
            for (let i of $.range(this.square[0]-1, -1, -1)){
                sqr = this.board.board.get(i, this.square[1]);

                if (sqr.piece !== null) {
                    this.attacking[1].push(sqr.square);
                    if (sqr.piece.color !== this.color) {
                        for (let o of $.range(sqr.square[0]-1, -1, -1)){
                            sqr = this.board.board.get(o, this.square[1]);
                            this.xray[1].push(sqr.square);
                            if (sqr.piece !== null) {
                                break;
                            };
                        };
                    };
                    break;
                } else {
                    this.attacking[1].push(sqr.square);
                };
            };
        };

        for (let i of $.range(this.square[1]+1, this.board.board.shape[1])){
            sqr = this.board.board.get(this.square[0], i);

            if (sqr.piece !== null) {
                this.attacking[2].push(sqr.square);
                if (sqr.piece.color !== this.color) {
                    for (let o of $.range(sqr.square[1]+1, this.board.board.shape[1])){
                        sqr = this.board.board.get(this.square[0], o);
                        this.xray[2].push(sqr.square);
                        if (sqr.piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[2].push(sqr.square);
            };
        };

        if (this.square[1] !== 0) {
            for (let i of $.range(this.square[1]-1, -1, -1)){
                sqr = this.board.board.get(this.square[0], i);

                if (sqr.piece !== null) {
                    this.attacking[3].push(sqr.square);
                    if (sqr.piece.color !== this.color) {
                        for (let o of $.range(sqr.square[1]-1, -1, -1)){
                            sqr = this.board.board.get(this.square[0], o);
                            this.xray[3].push(sqr.square);
                            if (sqr.piece !== null) {
                                break;
                            };
                        };
                    };
                    break;
                } else {
                    this.attacking[3].push(sqr.square);
                };
            };
        };
        
        for (let i of $.range(1, min(this.square[0]-0, this.board.board.shape[1]-1-this.square[1])+1)){
            if (this.board.board.get(this.square[0]-i, this.square[1]+i).piece !== null) {
                this.attacking[4].push(this.board.board.get(this.square[0]-i, this.square[1]+i).square);
                if (this.board.board.get(this.square[0]-i, this.square[1]+i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.square[0]-0, this.board.board.shape[1]-1-this.square[1])+1)){
                        this.xray[4].push(this.board.board.get(this.square[0]-o, this.square[1]+o).square);
                        if (this.board.board.get(this.square[0]-o, this.square[1]+o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[4].push(this.board.board.get(this.square[0]-i, this.square[1]+i).square);
            };
        };

        for (let i of $.range(1, min(this.board.board.shape[0]-1-this.square[0], this.board.board.shape[1]-1-this.square[1])+1)){
            if (this.board.board.get(this.square[0]+i, this.square[1]+i).piece !== null) {
                this.attacking[5].push(this.board.board.get(this.square[0]+i, this.square[1]+i).square);
                if (this.board.board.get(this.square[0]+i, this.square[1]+i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.board.board.shape[0]-1-this.square[0], this.board.board.shape[1]-1-this.square[1])+1)){
                        this.xray[5].push(this.board.board.get(this.square[0]+o, this.square[1]+o).square);
                        if (this.board.board.get(this.square[0]+o, this.square[1]+o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[5].push(this.board.board.get(this.square[0]+i, this.square[1]+i).square);
            };
        };

        for (let i of $.range(1, min(this.board.board.shape[0]-1-this.square[0], this.square[1]-0)+1)){
            if (this.board.board.get(this.square[0]+i, this.square[1]-i).piece !== null) {
                this.attacking[6].push(this.board.board.get(this.square[0]+i, this.square[1]-i).square);
                if (this.board.board.get(this.square[0]+i, this.square[1]-i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.board.board.shape[0]-1-this.square[0], this.square[1]-0)+1)){
                        this.xray[6].push(this.board.board.get(this.square[0]+o, this.square[1]-o).square);
                        if (this.board.board.get(this.square[0]+o, this.square[1]-o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[6].push(this.board.board.get(this.square[0]+i, this.square[1]-i).square);
            };
        };

        for (let i of $.range(1, min(this.square[0]-0, this.square[1]-0)+1)){
            if (this.board.board.get(this.square[0]-i, this.square[1]-i).piece !== null) {
                this.attacking[7].push(this.board.board.get(this.square[0]-i, this.square[1]-i).square);
                if (this.board.board.get(this.square[0]-i, this.square[1]-i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.square[0]-0, this.square[1]-0)+1)){
                        this.xray[7].push(this.board.board.get(this.square[0]-o, this.square[1]-o).square);
                        if (this.board.board.get(this.square[0]-o, this.square[1]-o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[7].push(this.board.board.get(this.square[0]-i, this.square[1]-i).square);
            };
        };

        let self = this;
        this.move = [...(function*(){for (let o of self.attacking) for (let i of o) if (self.board.board.get(...i).piece === null || self.board.board.get(...i).piece.color !== self.color) yield i;}())];
    };
};

class Rook extends Piece {
    constructor(square, color, board) {
        super(square, color, board, (color === "black") ? "r" : "R", true);
        this.update();
    };

    update() {
        this.attacking = $.range(4).map(i => []);
        this.xray = $.range(4).map(i => []);
        this.move = [];

        let sqr;

        for (let i of $.range(this.square[0]+1, this.board.board.shape[0])){
            sqr = this.board.board.get(i, this.square[1]);

            if (sqr.piece !== null) {
                this.attacking[0].push(sqr.square);
                if (sqr.piece.color !== this.color) {
                    for (let o of $.range(sqr.square[0]+1, this.board.board.shape[0])) {
                        sqr = this.board.board.get(o, this.square[1]);
                        this.xray[0].push(sqr.square);
                        if (sqr.piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[0].push(sqr.square);
            };
        };

        if (this.square[0] !== 0) {
            for (let i of $.range(this.square[0]-1, -1, -1)){
                sqr = this.board.board.get(i, this.square[1]);

                if (sqr.piece !== null) {
                    this.attacking[1].push(sqr.square);
                    if (sqr.piece.color !== this.color) {
                        for (let o of $.range(sqr.square[0]-1, -1, -1)){
                            sqr = this.board.board.get(o, this.square[1]);
                            this.xray[1].push(sqr.square);
                            if (sqr.piece !== null) {
                                break;
                            };
                        };
                    };
                    break;
                } else {
                    this.attacking[1].push(sqr.square);
                };
            };
        };

        for (let i of $.range(this.square[1]+1, this.board.board.shape[1])){
            sqr = this.board.board.get(this.square[0], i);

            if (sqr.piece !== null) {
                this.attacking[2].push(sqr.square);
                if (sqr.piece.color !== this.color) {
                    for (let o of $.range(sqr.square[1]+1, this.board.board.shape[1])){
                        sqr = this.board.board.get(this.square[0], o);
                        this.xray[2].push(sqr.square);
                        if (sqr.piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[2].push(sqr.square);
            };
        };

        if (this.square[1] !== 0) {
            for (let i of $.range(this.square[1]-1, -1, -1)){
                sqr = this.board.board.get(this.square[0], i);

                if (sqr.piece !== null) {
                    this.attacking[3].push(sqr.square);
                    if (sqr.piece.color !== this.color) {
                        for (let o of $.range(sqr.square[1]-1, -1, -1)){
                            sqr = this.board.board.get(this.square[0], o);
                            this.xray[3].push(sqr.square);
                            if (sqr.piece !== null) {
                                break;
                            };
                        };
                    };
                    break;
                } else {
                    this.attacking[3].push(sqr.square);
                };
            };
        };

        let self = this;
        this.move = [...(function*(){for (let o of self.attacking) for (let i of o) if (self.board.board.get(...i).piece === null || self.board.board.get(...i).piece.color !== self.color) yield i;}())];
    };
};

class Bishop extends Piece {
    constructor(square, color, board) {
        super(square, color, board, (color === "black") ? "b" : "B", true);
        this.update();
    };

    update() {
        this.attacking = $.range(4).map(i => []);
        this.xray = $.range(4).map(i => []);
        this.move = [];

        let sqr;

        for (let i of $.range(1, min(this.square[0]-0, this.board.board.shape[1]-1-this.square[1])+1)){
            if (this.board.board.get(this.square[0]-i, this.square[1]+i).piece !== null) {
                this.attacking[0].push(this.board.board.get(this.square[0]-i, this.square[1]+i).square);
                if (this.board.board.get(this.square[0]-i, this.square[1]+i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.square[0]-0, this.board.board.shape[1]-1-this.square[1])+1)){
                        this.xray[0].push(this.board.board.get(this.square[0]-o, this.square[1]+o).square);
                        if (this.board.board.get(this.square[0]-o, this.square[1]+o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[0].push(this.board.board.get(this.square[0]-i, this.square[1]+i).square);
            };
        };

        for (let i of $.range(1, min(this.board.board.shape[0]-1-this.square[0], this.board.board.shape[1]-1-this.square[1])+1)){
            if (this.board.board.get(this.square[0]+i, this.square[1]+i).piece !== null) {
                this.attacking[1].push(this.board.board.get(this.square[0]+i, this.square[1]+i).square);
                if (this.board.board.get(this.square[0]+i, this.square[1]+i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.board.board.shape[0]-1-this.square[0], this.board.board.shape[1]-1-this.square[1])+1)){
                        this.xray[1].push(this.board.board.get(this.square[0]+o, this.square[1]+o).square);
                        if (this.board.board.get(this.square[0]+o, this.square[1]+o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[1].push(this.board.board.get(this.square[0]+i, this.square[1]+i).square);
            };
        };

        for (let i of $.range(1, min(this.board.board.shape[0]-1-this.square[0], this.square[1]-0)+1)){
            if (this.board.board.get(this.square[0]+i, this.square[1]-i).piece !== null) {
                this.attacking[2].push(this.board.board.get(this.square[0]+i, this.square[1]-i).square);
                if (this.board.board.get(this.square[0]+i, this.square[1]-i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.board.board.shape[0]-1-this.square[0], this.square[1]-0)+1)){
                        this.xray[2].push(this.board.board.get(this.square[0]+o, this.square[1]-o).square);
                        if (this.board.board.get(this.square[0]+o, this.square[1]-o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[2].push(this.board.board.get(this.square[0]+i, this.square[1]-i).square);
            };
        };

        for (let i of $.range(1, min(this.square[0]-0, this.square[1]-0)+1)){
            if (this.board.board.get(this.square[0]-i, this.square[1]-i).piece !== null) {
                this.attacking[3].push(this.board.board.get(this.square[0]-i, this.square[1]-i).square);
                if (this.board.board.get(this.square[0]-i, this.square[1]-i).piece.color !== this.color) {
                    for (let o of $.range(i+1, min(this.square[0]-0, this.square[1]-0)+1)){
                        this.xray[3].push(this.board.board.get(this.square[0]-o, this.square[1]-o).square);
                        if (this.board.board.get(this.square[0]-o, this.square[1]-o).piece !== null) {
                            break;
                        };
                    };
                };
                break;
            } else {
                this.attacking[3].push(this.board.board.get(this.square[0]-i, this.square[1]-i).square);
            };
        };

        let self = this;
        this.move = [...(function*(){for (let o of self.attacking) for (let i of o) if (self.board.board.get(...i).piece === null || self.board.board.get(...i).piece.color !== self.color) yield i;}())];
    };
};

class Pawn extends Piece {
    constructor(square, color, board) {
        super(square, color, board, (color === "black") ? "p" : "P", false);

        if (this.color === "black") {
            this.vectors = [[1,0], [2,0]];
        } else if (this.color === "white") {
            this.vectors = [[-1,0], [-2,0]];
        };

        this.original_square = this.square;

        this.update();
    };

    update() {
        this.attacking = [];
        this.move = [];
        let vertical_offset;
        
        if (square_exists(this.board, nj.add(this.square, this.vectors[0]).tolist())) {
            if (this.board.board.get(...nj.add(this.square, this.vectors[0]).tolist()).piece === null) {
                this.move.push(nj.add(this.square, this.vectors[0]).tolist());
                if (this.square[0] === this.original_square[0] && this.board.board.get(...nj.add(this.square, this.vectors[1]).tolist()).piece === null) {
                    this.move.push(nj.add(this.square, this.vectors[1]).tolist());
                };
            };
        };

        if (this.color === "black") {
            vertical_offset = 1;
        } else if (this.color === "white") {
            vertical_offset = -1;
        };

        for (let i of [-1, 1]) {
            if (square_exists(this.board, [this.square[0]+vertical_offset, this.square[1]+i])) {
                this.attacking.push([this.square[0]+vertical_offset, this.square[1]+i]);
            };
        };
    };
};

class King extends Piece {
    constructor(square, color, board) {
        super(square, color, board, (color === "black") ? "k" : "K", false);
        this.update();
    };

    update() {
        this.attacking = [];
        this.move = [];

        for (let i of [-1, 0, 1]) {
            for (let o of [-1, 0, 1]) {
                if (square_exists(this.board, [this.square[0]+i, this.square[1]+o]) && ! (i === 0 && o === 0)) {
                    this.attacking.push([this.square[0]+i, this.square[1]+o]);
                };
            };
        };

        this.move = this.attacking.filter(i => this.board.board.get(...i).piece === null || this.board.board.get(...i).piece.color !== this.color);
    };
};

function render(board) {
    console.clear();

    let replacements = {
        "K": "♔",
        "Q": "♕",
        "P": "♙",
        "N": "♘",
        "R": "♖", 
        "B": "♗",
        "k": "♚",
        "q": "♛",
        "p": "♟",
        "n": "♞",
        "r": "♜",
        "b": "♝",
    };

    let fen = String(board);

    for (let i of Object.keys(replacements)) {
        fen = fen.replace(new RegExp(i, "g"), replacements[i]);
    };
    
    let fen_list = [...(function*(){for (let i of $.range(8)) yield fen.slice(8*i, 8*(i+1));}())];
    console.log(["", ...fen_list].join('\n' + " ".repeat(5)));
};

function main() {
    let board = new Board(fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w");
    let user = [true, true];

    while (true) {
        render(board);

        let result = board.calc_result();
        if (result !== "") {
            console.log(result);
            break;
        };

        let ask = (board.to_move === "white") ? user[0] : user[1];

        if (ask) {
            while (true) {
                let moves = board.generate_legal_moves();
                moves = [].concat(...moves.values());
                
                if (moves === []) {
                    break;
                };

                for (let i of moves) {
                    console.log(String(i));
                };
                let move = prompt(`Move for ${board.to_move}: `).trim();

                if (move === "timeout") {
                    board.timeout(board.to_move);
                    break;
                };

                if (move === "resign") {
                    board.resign();
                    break;
                };

                let match = moves.filter(i => String(i).toLowerCase() === move.toLowerCase());
                if (! $.isEqual(match, [])) {
                    board.execute(match[0]);
                    break;
                };
            };
        } else {
            let moves = board.generate_legal_moves();
            moves = [].concat(...moves.values());

            board.execute($.sample(moves));
        };
    };
    console.log(board.moves.length);
    console.log(board.as_pgn());
    console.log(String(board));

    render(board);
};

main();