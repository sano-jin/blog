---
layout: post
title: Parsing offside-ruled syntax with OCamlLex and Menhir
excerpt: Python とかの構文解析をする．
author: sano
---

これの続き〈

# Off-side rule と言うのは，

`{` とか `}`
とかを使わずに，
インデント（空白）のレベルでどこまでがブロックかを決めるやつ．

Python とか Haskell とかが採用している．

# で，実際に OCaml でどうやって実装するか．

OCamlLex で，今まで述べたアルゴリズムを実装してみる．

ただ，ちょっとした問題があって，

> **OCamlLex は（何故か）一度に複数の token を返せない**．

しかし，`DEDENT` token は n 個挟まなきゃいけなかったので，
このままでは困る．

なので，工夫する．

とりあえず，
`DEDENT` token
を
`TOKENS ([DEDENT, ..., DEDENT])`
のように返せるように，
`.mly` の token の型定義を拡張する．

```ocaml
%token <token list> TOKENS (* Zero or more TOKENs *)
```

# Emitting `INDENT` and `DEDENT`

実装．

```ocaml
(** Lexer のための補助関数などを定義する．
*)

open Parser
open Util

(** インデントレベルのスタック *)
let indent_level_stack =
  let stack = Stack.create () in
  Stack.push 0 stack;
  stack

(** インデントレベルが上がった場合に，何段階上がったかを取得する．
    マッチするインデントレベルが存在していなかった場合は，エラーを吐く．
  *)
let rec emit_dedents indent_level =
  let prev = Stack.top indent_level_stack in
  if indent_level > prev then failwith "indentation error"
  else if indent_level = prev then 0
  else (
    ignore @@ Stack.pop indent_level_stack;
    succ @@ emit_dedents indent_level)

(** インデントされていた場合は [INDENT] を返す．
     - 前の行と同じオフセットの場合は，
       最初の行なら無視してそのまま tokenizing を続け，
       それ以外なら delimiter を挿入する（C 言語でのセミコロンに対応）．
     - インデントレベルが上がっていた場合は，
       補助関数 [emit_dedents] を用いて [TOKENS [DEDENT; DELIMITER; ...; DEDENT; DELIMITER]] を返す．
   *)
let emit_indent indent_level =
  let current_indent_level = Stack.top indent_level_stack in
  if indent_level > current_indent_level then (
    Stack.push indent_level indent_level_stack;
    INDENT)
  else
    match emit_dedents indent_level with
    | 0 -> DELIMITER
    | n ->
        TOKENS
          (DELIMITER :: List.concat (ListExtra.repeat n [ DEDENT; DELIMITER ]))
```

`ListExtra.repeat` は自作の関数で，
`ListExtra.repeat n x` で
n 個の `x` からなるリストを返す．

`lexer.mll`
の実装はこんな感じ．

```ocaml
rule token = parse
  ...
    (* new line. call the [indent] tokenizer *)
  | newline  { Lexing.new_line lexbuf; indent lexbuf }
  ...


(* 改行があった場合に直後に呼ばれる Lexer *)
and indent = parse
  (* blank line *)
  | space* newline { Lexing.new_line lexbuf; indent lexbuf }

  (* blank line with a comment *)
  | space* '#' [^ '\n']* newline { Lexing.new_line lexbuf; indent lexbuf }

  (* indent (assuming that the next comming token is not just a space/newline/comment) *)
  | space*
    { let indent_level =
        let pos = lexbuf.lex_curr_p in
        (* the number of characters from the beginning of the line*)
        pos.pos_cnum - pos.pos_bol
      in
      emit_indent indent_level
    }
```

# Parcing with `TOKENS`

リストにまとめた tokens を，
parser にひとつづつ渡して構文解析できるようにしたい．

Menhir (OCamlYacc) を用いた構文解析は，
普通は，`Lexing.token` を用いてこんな感じでやる．

```ocaml
(** parse : string -> stmt *)
let parse filename str =
  let lexbuf = Lexing.from_string str in
  Parser.main Lexing.token lexbuf
```

実は，
`Parser.main` は，
`Lexing.token` に `Lexing.lexubuf` を適用させて，
返ってくる token を用いて構文解析をしている．

`Lexing.lexubuf` は，
mutable なフィールド（残りの文字列とか）をいっぱい持つオブジェクトで，
`Lexing.token` はこいつらを破壊的に更新して，
残りの文字列とかが減っていくように実装されている．

参考：
<https://v2.ocaml.org/api/Lexing.html#1_Lexerbuffers>

こいつを hack してやる．

`DEDENT`
token を挟みたいタイミングでは
`Lexing.lexbug`
に対して変更を加えずに
`DEDENT`
を返す，
`token` と言う関数を自作して，
`Lexing.token`
の代わりにこいつを使うことにする．

```ocaml
(** parse : string -> stmt *)
let parse filename str =
  let lexbuf = Lexing.from_string str in
  Parser.main token lexbuf
  (* Lexing.token じゃなくて，自作関数の token を使っている *)
```

`token` の実装はこんな感じ．

```ocaml
(** [TOKENS] を無数の [token] に展開しながら出力する tokenizer *)
let token =
  let tokens = ref [] in
  let rec helper lexbuf =
    match !tokens with
    | [] -> (
        match Lexer.token lexbuf with
        | TOKENS ts ->
            tokens := ts;
            helper lexbuf
        | x -> x)
    | TOKENS _ :: _ -> failwith "nesting TOKENS token is not allowed"
    | h :: t ->
        tokens := t;
        h
  in
  helper
```

更新可能な token のリスト（最初は空）を用意しておいて，
`helper` 関数を返す．

`helper` 関数が，新しい tokenizer の本体．

1. `tokens` が空だったら，`Lexing.token` を使って字句解析する．

   - 字句解析した結果，`TOKENS ([...])` が返ってきたら，
     `tokens` に`[...]` を代入して，
     また，`helper` 関数を呼ぶ．
   - そうじゃなかったら，フツー字句解析の結果を返す．

2. `tokens` が空じゃなかったら，
   `tokens` から一つ取り出して，
   それを返す．

`TOKENS` をネストさせるのは面倒なので，対応しなかった（そんな必要はないので）．

# まとめ

思ったより自明でなかった．