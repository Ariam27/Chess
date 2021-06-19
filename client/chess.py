import numpy as np
from copy import deepcopy as copy

#test
import random
import time
import pygame

pygame.init()
clock = pygame.time.Clock()

names_rows = [8, 7, 6, 5, 4, 3, 2, 1]
names_columns = ["a", "b", "c", "d", "e", "f", "g", "h"]

def square_exists(board, square):
    if square[0] >= 0 and square[0] < board.board.shape[0] and square[1] >= 0 and square[1] < board.board.shape[1]:
        return True
    return False

class Move():
    def __init__(self, original_square, final_square, piece, board, test=False):
        self.original_square = original_square
        self.final_square = final_square
        self.piece = piece
        self.board = board
        self.name = ""

        if test == False:
            to_move = self.board.white if self.board.to_move == "white" else self.board.black
            
            if isinstance(self.piece, Pawn):
                if self.board.board[self.final_square].piece != None:
                    self.name += names_columns[self.original_square[1]]
            else:
                self.name += self.piece.symbol.upper()

                pieces = [i for i in to_move.attacking[self.final_square] if isinstance(i, type(self.piece)) and not i == self.piece]
                file_ambi = ""
                rank_ambi = ""
                for i in pieces:
                    ambiguation = True
                    if self.board.is_pinned(i, [o for o in to_move.pieces if isinstance(o, King)][0])[0]:
                        _, pinner, series = self.board.is_pinned(i, [o for o in to_move.pieces if isinstance(o, King)][0])
                        if not self.final_square in [pinner.square] + pinner.attacking[series][:-1] + pinner.xray[series][:-1]:
                            ambiguation = False
                            
                    if ambiguation:
                        if i.square[1] == self.piece.square[1]:
                            rank_ambi = str(names_rows[self.piece.square[0]])
                        else:
                            file_ambi = str(names_columns[self.piece.square[1]])
                self.name += file_ambi + rank_ambi

            if self.board.board[self.final_square].piece != None:
                self.name += "x"
                
            self.name += names_columns[self.final_square[1]] + str(names_rows[self.final_square[0]])
            
            test_board = copy(self.board)
            test_move = Move(self.original_square, self.final_square, test_board.board[self.original_square].piece, test_board, True)
            test_board.execute(test_move)

            to_move = test_board.white if test_board.to_move == "white" else test_board.black

            if to_move.check:
                result = test_board.calc_result()
                if result != "" and result.split()[1].strip("[]") == "CHECKMATE":
                    self.name += "#"
                else:
                    self.name += "+"
                    
    def execute(self):
        if self.board.board[self.final_square].piece != None:
            to_remove = self.board.white if self.board.board[self.final_square].piece.color == "white" else self.board.black
            to_remove.pieces.remove(self.board.board[self.final_square].piece)
            self.board.board[self.final_square].piece = None
            
        self.piece.square = self.final_square
        self.board.board[self.original_square].piece = None
        self.board.board[self.final_square].piece = self.piece

        if isinstance(self.piece, Rook) or isinstance(self.piece, King):
            change = self.board.white if self.board.to_move == "white" else self.board.black
            if self.original_square[1] == 7:
                change.kingside_castle = False
            elif self.original_square[1] == 0:
                change.queenside_castle = False        

    def __repr__(self):
        return self.name

class KingSideCastle():
    def __init__(self, board, test=False):
        self.board = board
        self.rank = 7 if self.board.to_move == "white" else 0
        self.king = self.board.board[self.rank, 4].piece
        self.rook = self.board.board[self.rank, 7].piece
        self.piece = [self.king, self.rook]

        self.name = "0-0"

        if test == False:
            test_board = copy(self.board)
            test_move = KingSideCastle(test_board, True)
            test_board.execute(test_move)

            to_move = test_board.white if test_board.to_move == "white" else test_board.black

            if to_move.check:
                result = test_board.calc_result()
                if result != "" and result.split()[1].strip("[]") == "CHECKMATE":
                    self.name += "#"
                else:
                    self.name += "+"         

    def execute(self):
        self.board.board[self.rook.square].piece = None
        self.board.board[self.king.square].piece = None

        self.king.square = (self.rank, 6)
        self.rook.square = (self.rank, 5)

        self.board.board[self.king.square].piece = self.king
        self.board.board[self.rook.square].piece = self.rook

        change = self.board.white if self.board.to_move == "white" else self.board.black
        change.kingside_castle = False
        change.queenside_castle = False

    def __repr__(self):
        return self.name

class QueenSideCastle():
    def __init__(self, board, test=False):
        self.board = board
        self.rank = 7 if self.board.to_move == "white" else 0
        self.king = self.board.board[self.rank, 4].piece
        self.rook = self.board.board[self.rank, 0].piece
        self.piece = [self.king, self.rook]

        self.name = "0-0-0"

        if test == False:
            test_board = copy(self.board)
            test_move = QueenSideCastle(test_board, True)
            test_board.execute(test_move)

            to_move = test_board.white if test_board.to_move == "white" else test_board.black

            if to_move.check:
                result = test_board.calc_result()
                if result != "" and result.split()[1].strip("[]") == "CHECKMATE":
                    self.name += "#"
                else:
                    self.name += "+" 

    def execute(self):
        self.board.board[self.rook.square].piece = None
        self.board.board[self.king.square].piece = None

        self.king.square = (self.rank, 2)
        self.rook.square = (self.rank, 3)

        self.board.board[self.king.square].piece = self.king
        self.board.board[self.rook.square].piece = self.rook

        change = self.board.white if self.board.to_move == "white" else self.board.black
        change.kingside_castle = False
        change.queenside_castle = False

    def __repr__(self):
        return self.name

class Promotion(Move):
    def __init__(self, original_square, final_square, piece, board, promote_to, test=False):
        super().__init__(original_square, final_square, piece, board, test)
        self.promote_to = promote_to

        if test == False:
            symbols = {Knight: "N", Bishop: "B", Queen: "Q", Rook: "R"}
            
            self.name += "=" + symbols[self.promote_to]

            test_board = copy(self.board)
            test_move = Promotion(self.original_square, self.final_square, test_board.board[self.original_square].piece, test_board, self.promote_to, True)
            test_board.execute(test_move)

            to_move = test_board.white if test_board.to_move == "white" else test_board.black

            if to_move.check:
                result = test_board.calc_result()
                if result != "" and result.split()[1].strip("[]") == "CHECKMATE":
                    self.name += "#"
                else:
                    self.name += "+"            
        

    def execute(self):
        if self.board.board[self.final_square].piece != None:
            to_remove = self.board.white if self.board.board[self.final_square].piece.color == "white" else self.board.black
            to_remove.pieces.remove(self.board.board[self.final_square].piece)
            self.board.board[self.final_square].piece = None
            
        self.piece.square = self.final_square
        self.board.board[self.original_square].piece = None
        self.board.board[self.final_square].piece = self.piece

        to_remove = self.board.white if self.piece.color == "white" else self.board.black
        to_remove.pieces.remove(self.piece)

        promoted_to = self.promote_to(self.final_square, self.piece.color, self.board)
        self.board.board[self.final_square].piece = promoted_to
        to_remove.pieces.append(promoted_to)

    def __repr__(self):        
        return self.name

class EnPassant(Move):
    def __init__(self, original_square, final_square, piece, board, test=False):
        super().__init__(original_square, final_square, piece, board, test)
        self.name = ""

        if test == False:
            self.name += names_columns[self.original_square[1]]
            self.name += "x"
            self.name += names_columns[self.final_square[1]] + str(names_rows[self.final_square[0]])

            test_board = copy(self.board)
            test_move = EnPassant(self.original_square, self.final_square, test_board.board[self.original_square].piece, test_board, True)
            test_board.execute(test_move)

            to_move = test_board.white if test_board.to_move == "white" else test_board.black

            if to_move.check:
                result = test_board.calc_result()
                if result != "" and result.split()[1].strip("[]") == "CHECKMATE":
                    self.name += "#"
                else:
                    self.name += "+"

    def execute(self):
        to_remove = self.board.white if self.board.board[(self.original_square[0], self.final_square[1])].piece.color == "white" else self.board.black
        to_remove.pieces.remove(self.board.board[(self.original_square[0], self.final_square[1])].piece)
        self.board.board[(self.original_square[0], self.final_square[1])].piece = None

        self.piece.square = self.final_square
        self.board.board[self.original_square].piece = None
        self.board.board[self.final_square].piece = self.piece

    def __repr__(self):
        return self.name
            
        
class Square():
    def __init__(self, square, color, piece=None):
        self.color = color
        self.piece = piece
        self.square = square
    
    def __str__(self):
        return self.piece.symbol if self.piece != None else "."

class Side():
    def __init__(self, color):
        self.color = color
        self.pieces = []
        self.attacking = {}
        self.xray = {}
        self.check = False
        self.kingside_castle = True
        self.queenside_castle = True
        
class Board():
    def __init__(self, fen="8/8/8/8/8/8/8/8"):
        self.board = np.empty((8, 8), dtype=object)
        self.fen = fen
        self.to_move = "white" if fen.split(" ")[1] == "w" else "black"
        self.pieces = {"p": Pawn, "b": Bishop, "n": Knight, "k": King, "q": Queen, "r": Rook}
        self.white = Side("white")
        self.black = Side("black")
        self.moves = [[]]
        self.epsquare = ()
        self.positions = [[]]
        self.halfmove_clock = 0
        self.result = ""
        
        for i in range(self.board.shape[0]):
            for o in range(self.board.shape[1]):
                if (i+o)%2 == 0:
                    self.board[i, o] = Square((i, o), "white")
                else:
                    self.board[i, o] = Square((i, o), "black")

        for i in self.board.reshape(self.board.size):
            self.white.attacking[i.square] = []
            self.white.xray[i.square] = []
            self.black.attacking[i.square] = []
            self.black.xray[i.square] = []

        row = 0
        column = 0

        for i in self.fen.split(" ")[0].split("/"):
            for o in i:
                if o.isalpha():
                    if o.lower() in self.pieces.keys():
                        self.board[row, column].piece = self.pieces[o.lower()]((row, column), "black" if o.islower() else "white", self)
                        if o.islower():
                            self.black.pieces.append(self.board[row, column].piece)
                        else:
                            self.white.pieces.append(self.board[row, column].piece)
                    column += 1
                elif o.isnumeric():
                    column += int(o)

                if column == 8:
                    break
            row += 1
            column = 0

            if row == 8:
                break
        
        self.positions = [[str(self)]] if self.to_move == "white" else [["", str(self)]]
        self.calc_result()

    def update(self):
        if self.to_move == "white":
            check_attacking = self.black
            check = self.white
        elif self.to_move == "black":
            check_attacking = self.white
            check = self.black

        check_attacking.attacking = {i:[] for i in check_attacking.attacking.keys()}
        check_attacking.xray = copy(check_attacking.attacking)
        for i in check_attacking.pieces:
            i.update()
            if i.attacking != []:
                o = i.attacking
                if i.sliding:
                    o = [j for k in o for j in k]

                    x = [j for k in i.xray for j in k]
                    for u in x:
                        check_attacking.xray[u].append(i)
                    
                for u in o:
                    check_attacking.attacking[u].append(i)                

        king = [i for i in check.pieces if isinstance(i, King)][0]
        if check_attacking.attacking[king.square] != []:
            check.check = True
        else:
            check.check = False
 
    def generate_legal_moves(self):
        legal_moves = []
        
        if self.to_move == "white":
            to_move = self.white
            opponent = self.black
        elif self.to_move == "black":
            to_move = self.black
            opponent = self.white

        to_move.attacking = {i:[] for i in to_move.attacking.keys()}
        to_move.xray = copy(to_move.attacking)
        for i in to_move.pieces:
            i.update()
            if i.attacking != []:
                for o in i.attacking:
                    if i.sliding:
                        for u in o:
                            to_move.attacking[u].append(i)
                    else:
                        to_move.attacking[o].append(i)

            if i.sliding:
                for o in i.xray:
                    for u in o:
                        to_move.xray[u].append(i)

        if to_move.check:
            king = [i for i in to_move.pieces if isinstance(i, King)][0]
            pieces_checking = opponent.attacking[king.square]

            for i in king.move:
                for o in pieces_checking:
                    if o.sliding:
                        series = [k for k in o.attacking if king.square in k][0]
                        series = o.attacking.index(series)
                        if i in o.xray[series]:
                            break
                else:
                    if opponent.attacking[i] == []:
                        legal_moves.append(Move(king.square, i, king, self))

            if not len(pieces_checking) > 1:
                if pieces_checking[0].sliding:
                    series = [i for i in pieces_checking[0].attacking if king.square in i][0]
                    series = series[:-1]
                    for i in to_move.pieces:
                        if not isinstance(i, King):
                            if not self.is_pinned(i, king)[0]:
                                for u in i.move:
                                    if u in series:
                                        legal_moves.append(Move(i.square, u, i, self))
                                        
                for i in to_move.attacking[pieces_checking[0].square]:
                    if not self.is_pinned(i, king)[0] and not isinstance(i, King):
                        legal_moves.append(Move(i.square, pieces_checking[0].square, i, self))
        else:
            for i in to_move.pieces:
                if self.is_pinned(i, [o for o in to_move.pieces if isinstance(o, King)][0])[0]:
                    _, o, series = self.is_pinned(i, [o for o in to_move.pieces if isinstance(o, King)][0])
                    for u in [o.square] + o.attacking[series][:-1] + o.xray[series][:-1]:
                        if u in i.move:
                            legal_moves.append(Move(i.square, u, i, self))
                    if isinstance(i, Pawn):
                        if o.square in i.attacking:
                            legal_moves.append(Move(i.square, o.square, i, self))
                else:
                    if not isinstance(i, King):
                        for o in i.move:
                            legal_moves.append(Move(i.square, o, i, self))
                        if isinstance(i, Pawn):
                            for o in i.attacking:
                                if self.board[o].piece != None:
                                    if self.board[o].piece.color != i.color:
                                        legal_moves.append(Move(i.square, o, i, self))
                    else:
                        for o in i.move:
                            if opponent.attacking[o] == []:
                                legal_moves.append(Move(i.square, o, i, self))

            rank = 7 if to_move == self.white else 0
            if isinstance(self.board[(rank, 4)].piece, King) and isinstance(self.board[(rank, 7)].piece, Rook):
                if to_move.kingside_castle and opponent.attacking[(rank,5)] == [] and opponent.attacking[(rank,6)] == [] and self.board[(rank,5)].piece == None and self.board[(rank,6)].piece == None:
                    legal_moves.append(KingSideCastle(self))

            if isinstance(self.board[(rank, 4)].piece, King) and isinstance(self.board[(rank, 0)].piece, Rook):
                if to_move.queenside_castle and opponent.attacking[(rank,2)] == [] and opponent.attacking[(rank,3)] == [] and self.board[(rank,1)].piece == None and self.board[(rank,2)].piece == None and self.board[(rank,3)].piece == None:
                    legal_moves.append(QueenSideCastle(self))

        if self.epsquare:
            row = self.epsquare[0] + (1 if self.to_move == "white" else -1)

            for i in [-1, 1]:
                if square_exists(self, (row, self.epsquare[1]+i)):
                    if isinstance(self.board[(row, self.epsquare[1]+i)].piece, Pawn) and self.board[(row, self.epsquare[1]+i)].piece.color == self.to_move:
                        test_board = copy(self)
                        test_move = EnPassant((row, self.epsquare[1]+i), self.epsquare, test_board.board[(row, self.epsquare[1]+i)].piece, test_board, True)
                        test_board.execute(test_move)
                        test_board.to_move = "black" if test_board.to_move == "white" else "white"
                        test_board.update()

                        check = test_board.white if test_board.to_move == "white" else test_board.black

                        if not check.check:
                            legal_moves.append(EnPassant((row, self.epsquare[1]+i), self.epsquare, self.board[(row, self.epsquare[1]+i)].piece, self))
        
        to_delete = []
        for o, i in zip([j for j in range(len(legal_moves))], legal_moves):
            if not isinstance(i, (KingSideCastle, QueenSideCastle, Promotion, EnPassant)):
                if isinstance(i.piece, Pawn):
                    rank = 0 if i.piece.color == "white" else 7
                    if i.final_square[0] == rank:
                        for u in [Knight, Bishop, Rook, Queen]:
                            legal_moves.append(Promotion(i.original_square, i.final_square, i.piece, i.board, u))
                        to_delete.append(o)
        if to_delete != []:
            legal_moves = [legal_moves[i] for i in range(len(legal_moves)) if i not in to_delete]
            
        legal_moves, _ = {i:[] for i in to_move.pieces}, legal_moves
        for i in _: legal_moves[[o for o in to_move.pieces if isinstance(o, King)][0] if isinstance(i, (KingSideCastle, QueenSideCastle)) else i.piece].append(i)

        return legal_moves
        

    def is_pinned(self, piece, pinned_to):
        attacker = self.white if piece.color == "black" else self.black

        for i in attacker.attacking[piece.square]:
            if i.sliding:
                series = None
                for o in range(len(i.attacking)):
                    if piece.square in i.attacking[o]:
                        series = o

                if series != None:
                    if pinned_to.square in i.xray[series]:
                        return [True, i, series]
        return [False]

    def execute(self, move):
        move.execute()
        self.to_move = "white" if self.to_move == "black" else "black"
        self.update()

        if len(self.moves[-1]) == 2:
            self.moves.append([])           
        self.moves[-1].append(move.name)

        self.halfmove_clock += 1
        if isinstance(move.piece, Pawn) or "x" in move.name:
            self.halfmove_clock = 0

        if self.halfmove_clock == 0 or isinstance(move, (KingSideCastle, QueenSideCastle)):
            self.positions = [[]]
            if self.to_move == "black":
                self.positions[-1].append("")

        self.epsquare = ()
        if len(self.moves[-1][-1]) == 2 and (self.moves[-1][-1].endswith("4") or self.moves[-1][-1].endswith("5")):
            last = self.moves[-1][-1]

            if len(self.moves[-1]) == 1:
                last_mover = "white"
            elif len(self.moves[-1]) == 2:
                last_mover = "black"

            if not bool([i[0 if last_mover == "white" else 1] for i in self.moves if i[0 if last_mover == "white" else 1] == last[0]+str(3 if last_mover == "white" else 6)]):
                self.epsquare = (names_rows.index(int(last[1])+(-1 if last_mover == "white" else 1)), names_columns.index(last[0]))
        
        if len(self.positions[-1]) == 2:
            self.positions.append([])        
        self.positions[-1].append(str(self))
    
    def calc_result(self):
        if self.result == "":
            legal_moves = [j for k in self.generate_legal_moves().values() for j in k]
            if legal_moves == []:
                to_move = self.white if self.to_move == "white" else self.black
                if to_move.check:
                    self.result = f"[{'WHITE' if self.to_move == 'black' else 'BLACK'}] [CHECKMATE]"
                else:
                    self.result = "[DRAW] [STALEMATE]"
            else:
                white_p = ""
                black_p = ""

                if len(self.white.pieces) <= 3:
                    white_p = "".join(["K"] + [i.symbol.upper() for i in self.white.pieces if not isinstance(i, King)])
                
                if len(self.black.pieces) <= 3:
                    black_p = "".join(["K"] + [i.symbol.upper() for i in self.black.pieces if not isinstance(i, King)])
                                
                if (white_p == "KB" or white_p == "KN" or white_p == "K") and (black_p == "KB" or black_p == "KN" or black_p == "K"):
                    self.result = "[DRAW] [INSUFFICIENT MATERIAL]"
                    if white_p == "KB" and black_p == "KB":
                        w_bishop = self.board[[i for i in self.white.pieces if not isinstance(i, King)][0].square].color 
                        b_bishop = self.board[[i for i in self.black.pieces if not isinstance(i, King)][0].square].color 
                        if w_bishop != b_bishop:
                            self.result = ""                
                
                if (white_p == "KNN" and black_p == "K") or (white_p == "K" and black_p == "KNN"):
                    self.result = "[DRAW] [INSUFFICIENT MATERIAL]"

                if self.halfmove_clock == 100:
                    self.result = "[DRAW] [50 MOVE RULE]"

                if self.positions != [[]]:
                    current_position = self.positions[-1][-1]
                    position_color = 0 if self.to_move == "white" else 1
                    matching_positions = [i[position_color] for i in self.positions if i[position_color] == current_position]
                    if len(matching_positions) == 3:
                        self.result = "[DRAW] [3 FOLD REPETITION]"

        return self.result
    
    def timeout(self, color):
        opp = self.white if color == "black" else self.black
        self.result = f"[{'WHITE' if opp == self.white else 'BLACK'}] [TIMEOUT]"
        if len(opp.pieces) <= 3:
            opp_p = "".join(["K"] + [i.symbol.upper() for i in opp.pieces if not isinstance(i, King)])
            if opp_p in ["KB", "KN", "KNN", "K"]:
                self.result = "[DRAW] [INSUFFICIENT MATERIAL vs TIMEOUT]"
        
        return self.result
    
    def resign(self):
        self.result = f"[{'WHITE' if self.to_move == 'black' else 'BLACK'}] [RESIGNATION]"

        return self.result

    def as_pgn(self):
        pgn = ""

        for i in range(len(self.moves)):
            pgn += f"{i+1}. {self.moves[i][0]} {self.moves[i][1] if len(self.moves[i]) == 2 else ''} "

        return pgn

    def __str__(self):
        position = ""
        for i in range(self.board.shape[0]):
            for o in range(self.board.shape[1]):
                if (i,o) == self.epsquare:
                    #position += "x"
                    position += str(self.board[i,o])
                else:
                    position += str(self.board[i,o])
        
        position += "K" if self.white.kingside_castle else "" 
        position += "Q" if self.white.queenside_castle else ""
        position += "k" if self.black.kingside_castle else ""
        position += "q" if self.black.queenside_castle else ""
        
        return position
                                    
class renderer():
    def __init__(self, height, width, board, colors=[(255, 255, 255), (0, 0, 0)]):
        self.height = height
        self.width = width
        self.colors = colors
        self.board = board
        self.display = pygame.display.set_mode((width, height))

        self.black = {King: pygame.image.load("client/assets/black_king.png"), Queen: pygame.image.load("client/assets/black_queen.png"), Bishop: pygame.image.load("client/assets/black_bishop.png"), Knight: pygame.image.load("client/assets/black_knight.png"), Rook: pygame.image.load("client/assets/black_rook.png"), Pawn: pygame.image.load("client/assets/black_pawn.png")}
        self.white = {King: pygame.image.load("client/assets/white_king.png"), Queen: pygame.image.load("client/assets/white_queen.png"), Bishop: pygame.image.load("client/assets/white_bishop.png"), Knight: pygame.image.load("client/assets/white_knight.png"), Rook: pygame.image.load("client/assets/white_rook.png"), Pawn: pygame.image.load("client/assets/white_pawn.png")}

        self.create_board()

    def create_board(self):
        height_square = self.height/8
        width_square = self.width/8

        for i in range(board.board.shape[0]):
            for o in range(board.board.shape[1]):
                pygame.draw.rect(self.display, self.colors[0] if not (i+o)%2 else self.colors[1], (o*width_square, i*height_square, width_square, height_square))

        pygame.display.update()

class Piece():
    def __init__(self, square, color, board, symbol, sliding):
        self.square = square
        self.color = color
        self.board = board
        self.symbol = symbol
        self.attacking = []
        self.move = []
        self.sliding = sliding

        if self.board.board[square[0], square[1]].piece == None:
            self.board.board[square[0], square[1]].piece = self
        else:
            if self.board.board[square[0], square[1]].piece.color != self.color:
                self.board.board[square[0], square[1]].piece.kill()
                self.board.board[square[0], square[1]].piece = self
            else:
                self.kill()
                
    def kill(self):
        pass
            

class Knight(Piece):
    def __init__(self, square, color, board):
        super().__init__(square, color, board, "n" if color == "black" else "N", False)
        self.update()

    def update(self):
        self.attacking = []
        self.move = []
        
        y_offset = 0
        x_offset = 0
        
        for i in range(1, 9):
            if i <= 2:
                y_offset = -2
                if i == 1:
                    x_offset = -1
                else:
                    x_offset = 1
            elif i <= 4:
                x_offset = 2
                if i == 3:
                    y_offset = -1
                else:
                    y_offset = 1
            elif i <= 6:
                y_offset = 2
                if i == 5:
                    x_offset = 1
                else:
                    x_offset = -1
            elif i <= 8:
                x_offset = -2
                if i == 7:
                    y_offset = 1
                else:
                    y_offset = -1

            if square_exists(self.board, [self.square[0]+y_offset, self.square[1]+x_offset]):
                self.attacking.append((self.square[0]+y_offset, self.square[1]+x_offset))
                
        self.move = [i for i in self.attacking if self.board.board[i].piece == None or self.board.board[i].piece.color != self.color]

class Queen(Piece):
    def __init__(self, square, color, board):
        super().__init__(square, color, board, "q" if color == "black" else "Q", True)
        self.update()

    def update(self):
        self.attacking = [[] for i in range(8)]
        self.xray = [[] for i in range(8)]
        self.move = []

        for i in self.board.board[self.square[0]+1:, self.square[1]]:
            if i.piece != None:
                self.attacking[0].append(i.square)
                if i.piece.color != self.color:
                    for o in self.board.board[i.square[0]+1:, i.square[1]]:
                        self.xray[0].append(o.square)
                        if o.piece != None:
                            break
                break
            else:
                self.attacking[0].append(i.square)

        if self.square[0] != 0:
            for i in self.board.board[self.square[0]-1::-1, self.square[1]]:
                if i.piece != None:
                    self.attacking[1].append(i.square)
                    if i.piece.color != self.color:
                        for o in self.board.board[i.square[0]-1::-1, i.square[1]]:
                            self.xray[1].append(o.square)
                            if o.piece != None:
                                break
                    break
                else:
                    self.attacking[1].append(i.square)

        for i in self.board.board[self.square[0], self.square[1]+1:]:
            if i.piece != None:
                self.attacking[2].append(i.square)
                if i.piece.color != self.color:
                    for o in self.board.board[i.square[0], i.square[1]+1:]:
                        self.xray[2].append(o.square)
                        if o.piece != None:
                            break
                break
            else:
                self.attacking[2].append(i.square)

        if self.square[1] != 0:
            for i in self.board.board[self.square[0], self.square[1]-1::-1]:
                if i.piece != None:
                    self.attacking[3].append(i.square)
                    if i.piece.color != self.color:
                        for o in self.board.board[i.square[0], i.square[1]-1::-1]:
                            self.xray[3].append(o.square)
                            if o.piece != None:
                                break
                    break
                else:
                    self.attacking[3].append(i.square)

        for i in range(1, min(self.square[0]-0, self.board.board.shape[1]-1-self.square[1])+1):
            if self.board.board[self.square[0]-i, self.square[1]+i].piece != None:
                self.attacking[4].append(self.board.board[self.square[0]-i, self.square[1]+i].square)
                if self.board.board[self.square[0]-i, self.square[1]+i].piece.color != self.color:
                    for o in range(i+1, min(self.square[0]-0, self.board.board.shape[1]-1-self.square[1])+1):
                        self.xray[4].append(self.board.board[self.square[0]-o, self.square[1]+o].square)
                        if self.board.board[self.square[0]-o, self.square[1]+o].piece != None:
                            break
                break
            else:
                self.attacking[4].append(self.board.board[self.square[0]-i, self.square[1]+i].square)

        for i in range(1, min(self.board.board.shape[0]-1-self.square[0], self.board.board.shape[1]-1-self.square[1])+1):
            if self.board.board[self.square[0]+i, self.square[1]+i].piece != None:
                self.attacking[5].append(self.board.board[self.square[0]+i, self.square[1]+i].square)
                if self.board.board[self.square[0]+i, self.square[1]+i].piece.color != self.color:
                    for o in range(i+1, min(self.board.board.shape[0]-1-self.square[0], self.board.board.shape[1]-1-self.square[1])+1):
                        self.xray[5].append(self.board.board[self.square[0]+o, self.square[1]+o].square)
                        if self.board.board[self.square[0]+o, self.square[1]+o].piece != None:
                            break
                break
            else:
                self.attacking[5].append(self.board.board[self.square[0]+i, self.square[1]+i].square)

        for i in range(1, min(self.board.board.shape[0]-1-self.square[0], self.square[1]-0)+1):
            if self.board.board[self.square[0]+i, self.square[1]-i].piece != None:
                self.attacking[6].append(self.board.board[self.square[0]+i, self.square[1]-i].square)
                if self.board.board[self.square[0]+i, self.square[1]-i].piece.color != self.color:
                    for o in range(i+1, min(self.board.board.shape[0]-1-self.square[0], self.square[1]-0)+1):
                        self.xray[6].append(self.board.board[self.square[0]+o, self.square[1]-o].square)
                        if self.board.board[self.square[0]+o, self.square[1]-o].piece != None:
                            break
                break
            else:
                self.attacking[6].append(self.board.board[self.square[0]+i, self.square[1]-i].square)

        for i in range(1, min(self.square[0]-0, self.square[1]-0)+1):
            if self.board.board[self.square[0]-i, self.square[1]-i].piece != None:
                self.attacking[7].append(self.board.board[self.square[0]-i, self.square[1]-i].square)
                if self.board.board[self.square[0]-i, self.square[1]-i].piece.color != self.color:
                    for o in range(i+1, min(self.square[0]-0, self.square[1]-0)+1):
                        self.xray[7].append(self.board.board[self.square[0]-o, self.square[1]-o].square)
                        if self.board.board[self.square[0]-o, self.square[1]-o].piece != None:
                            break
                break
            else:
                self.attacking[7].append(self.board.board[self.square[0]-i, self.square[1]-i].square)

        self.move = [i for o in self.attacking for i in o if self.board.board[i].piece == None or self.board.board[i].piece.color != self.color]

class Rook(Piece):
    def __init__(self, square, color, board):
        super().__init__(square, color, board, "r" if color == "black" else "R", True)
        self.update()

    def update(self):
        self.attacking = [[] for i in range(4)]
        self.xray = [[] for i in range(4)]
        self.move = []

        for i in self.board.board[self.square[0]+1:, self.square[1]]:
            if i.piece != None:
                self.attacking[0].append(i.square)
                if i.piece.color != self.color:
                    for o in self.board.board[i.square[0]+1:, i.square[1]]:
                        self.xray[0].append(o.square)
                        if o.piece != None:
                            break
                break
            else:
                self.attacking[0].append(i.square)

        if self.square[0] != 0:
            for i in self.board.board[self.square[0]-1::-1, self.square[1]]:
                if i.piece != None:
                    self.attacking[1].append(i.square)
                    if i.piece.color != self.color:
                        for o in self.board.board[i.square[0]-1::-1, i.square[1]]:
                            self.xray[1].append(o.square)
                            if o.piece != None:
                                break
                    break
                else:
                    self.attacking[1].append(i.square)

        for i in self.board.board[self.square[0], self.square[1]+1:]:
            if i.piece != None:
                self.attacking[2].append(i.square)
                if i.piece.color != self.color:
                    for o in self.board.board[i.square[0], i.square[1]+1:]:
                        self.xray[2].append(o.square)
                        if o.piece != None:
                            break
                break
            else:
                self.attacking[2].append(i.square)

        if self.square[1] != 0:
            for i in self.board.board[self.square[0], self.square[1]-1::-1]:
                if i.piece != None:
                    self.attacking[3].append(i.square)
                    if i.piece.color != self.color:
                        for o in self.board.board[i.square[0], i.square[1]-1::-1]:
                            self.xray[3].append(o.square)
                            if o.piece != None:
                                break
                    break
                else:
                    self.attacking[3].append(i.square)

        self.move = [i for o in self.attacking for i in o if self.board.board[i].piece == None or self.board.board[i].piece.color != self.color]
            
class Bishop(Piece):
    def __init__(self, square, color, board):
        super().__init__(square, color, board, "b" if color == "black" else "B", True)
        self.update()

    def update(self):
        self.attacking = [[] for i in range(4)]
        self.xray = [[] for i in range(4)]
        self.move = []

        for i in range(1, min(self.square[0]-0, self.board.board.shape[1]-1-self.square[1])+1):
            if self.board.board[self.square[0]-i, self.square[1]+i].piece != None:
                self.attacking[0].append(self.board.board[self.square[0]-i, self.square[1]+i].square)
                if self.board.board[self.square[0]-i, self.square[1]+i].piece.color != self.color:
                    for o in range(i+1, min(self.square[0]-0, self.board.board.shape[1]-1-self.square[1])+1):
                        self.xray[0].append(self.board.board[self.square[0]-o, self.square[1]+o].square)
                        if self.board.board[self.square[0]-o, self.square[1]+o].piece != None:
                            break
                break
            else:
                self.attacking[0].append(self.board.board[self.square[0]-i, self.square[1]+i].square)

        for i in range(1, min(self.board.board.shape[0]-1-self.square[0], self.board.board.shape[1]-1-self.square[1])+1):
            if self.board.board[self.square[0]+i, self.square[1]+i].piece != None:
                self.attacking[1].append(self.board.board[self.square[0]+i, self.square[1]+i].square)
                if self.board.board[self.square[0]+i, self.square[1]+i].piece.color != self.color:
                    for o in range(i+1, min(self.board.board.shape[0]-1-self.square[0], self.board.board.shape[1]-1-self.square[1])+1):
                        self.xray[1].append(self.board.board[self.square[0]+o, self.square[1]+o].square)
                        if self.board.board[self.square[0]+o, self.square[1]+o].piece != None:
                            break
                break
            else:
                self.attacking[1].append(self.board.board[self.square[0]+i, self.square[1]+i].square)

        for i in range(1, min(self.board.board.shape[0]-1-self.square[0], self.square[1]-0)+1):
            if self.board.board[self.square[0]+i, self.square[1]-i].piece != None:
                self.attacking[2].append(self.board.board[self.square[0]+i, self.square[1]-i].square)
                if self.board.board[self.square[0]+i, self.square[1]-i].piece.color != self.color:
                    for o in range(i+1, min(self.board.board.shape[0]-1-self.square[0], self.square[1]-0)+1):
                        self.xray[2].append(self.board.board[self.square[0]+o, self.square[1]-o].square)
                        if self.board.board[self.square[0]+o, self.square[1]-o].piece != None:
                            break
                break
            else:
                self.attacking[2].append(self.board.board[self.square[0]+i, self.square[1]-i].square)

        for i in range(1, min(self.square[0]-0, self.square[1]-0)+1):
            if self.board.board[self.square[0]-i, self.square[1]-i].piece != None:
                self.attacking[3].append(self.board.board[self.square[0]-i, self.square[1]-i].square)
                if self.board.board[self.square[0]-i, self.square[1]-i].piece.color != self.color:
                    for o in range(i+1, min(self.square[0]-0, self.square[1]-0)+1):
                        self.xray[3].append(self.board.board[self.square[0]-o, self.square[1]-o].square)
                        if self.board.board[self.square[0]-o, self.square[1]-o].piece != None:
                            break
                break
            else:
                self.attacking[3].append(self.board.board[self.square[0]-i, self.square[1]-i].square)

        self.move = [i for o in self.attacking for i in o if self.board.board[i].piece == None or self.board.board[i].piece.color != self.color]

class Pawn(Piece):
    def __init__(self, square, color, board):
        super().__init__(square, color, board, "p" if color == "black" else "P", False)
        
        if self.color == "black":
            self.vectors = [(1,0), (2,0)]
        elif self.color == "white":
            self.vectors = [(-1,0), (-2,0)]
            
        self.original_square = self.square
        
        self.update()

    def update(self):
        self.attacking = []
        self.move = []

        if square_exists(self.board, tuple(np.add(self.square, self.vectors[0]))):
            if self.board.board[tuple(np.add(self.square, self.vectors[0]))].piece == None:
                self.move.append(tuple(np.add(self.square, self.vectors[0])))
                if self.square[0] == self.original_square[0] and self.board.board[tuple(np.add(self.square, self.vectors[1]))].piece == None:
                    self.move.append(tuple(np.add(self.square, self.vectors[1])))

        if self.color == "black":
            vertical_offset = 1
        elif self.color == "white":
            vertical_offset = -1

        for i in [-1, 1]:
            if square_exists(self.board, [self.square[0]+vertical_offset, self.square[1]+i]):
                self.attacking.append((self.square[0]+vertical_offset, self.square[1]+i))

class King(Piece):
    def __init__(self, square, color, board):
        super().__init__(square, color, board, "k" if color == "black" else "K", False)
        self.update()

    def update(self):
        self.attacking = []
        self.move = []

        for i in [-1, 0, 1]:
            for o in [-1, 0, 1]:
                if square_exists(self.board, [self.square[0]+i, self.square[1]+o]) and not (i == 0 and o == 0):
                    self.attacking.append((self.square[0]+i, self.square[1]+o))
                    
        self.move = [i for i in self.attacking if self.board.board[i].piece == None or self.board.board[i].piece.color != self.color]

                
def test_render_piece(renderer, piece):
    piece.update()

    image = renderer.black[type(piece)] if piece.color == "black" else renderer.white[type(piece)]
    image = pygame.transform.scale(image, (int(renderer.width/8), int(renderer.height/8)))
    
    font = pygame.font.SysFont("ComicSans MS", 36)
    piece_surface = font.render(piece.symbol, True, (128,128,128))
    renderer.display.blit(image, dest=(piece.square[1]*50, piece.square[0]*50))

##    for i in piece.attacking:
##        if piece.sliding:
##            for o in i:
##                pygame.draw.rect(renderer.display, (255, 0, 0), (o[1]*50, o[0]*50, 50, 50), 3)
##        else:
##            pygame.draw.rect(renderer.display, (255, 0, 0), (i[1]*50, i[0]*50, 50, 50), 3)
        
if __name__ == "__main__":
    board = Board(fen="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w")
    #board = Board(fen="R3k1N1/1r6/4P3/2P2P1p/1P2bP1q/p1K1R1P1/P6N/B6B b")
    Renderer = renderer(400, 400, board=board, colors=[(238,238,210), (118, 150, 56)])
    board.update()

    user = (True, True)

    while True:
        pygame.event.pump()
        Renderer.display.fill((255, 255, 255))
        Renderer.create_board()

        for i in board.board:
            for o in i:
                if o.piece != None:
                    test_render_piece(Renderer, o.piece)

        pygame.display.update()

        result = board.calc_result()
        if result != "":
            print(result)
            break

        ask = user[0] if board.to_move == "white" else user[1]

        if ask:
            while True:
                moves = board.generate_legal_moves()
                moves = [j for k in moves.values() for j in k]
                if moves == []:
                    raise Exception
                
                for i in moves:
                    print(str(i))
                move = input(f"Move for {board.to_move}: ").strip()

                if move == "timeout":
                    board.timeout(board.to_move)
                    break

                if move == "resign":
                    board.resign()
                    break

                match = [i for i in moves if str(i).lower() == move.lower()]
                if match != []:
                    board.execute(match[0])
                    break
        else:
            moves = [j for i in board.generate_legal_moves().values() for j in i]
            board.execute(random.choice(moves))

    print(len(board.moves))    
    print(board.as_pgn())
    print(str(board))
    pos = str(board)
    fen_list = [pos[8*i:8*(i+1)] for i in range(8)]
    fen = ""

    for u in fen_list:
        for i in range(len(u)):
            if u[i] != ".":
                fen += u[i]
            else:
                if i == 0 or u[i-1] != ".":
                    num = 1
                    for o in range(i+1, len(u)):
                        if u[o] == ".":
                            num += 1
                        else:
                            break
                    fen += str(num)
        fen += "/"

    print(fen)