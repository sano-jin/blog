---
layout: post
title: Python とかの構文解析をする（実装編）．
excerpt: Parsing off-side ruled syntax with OCamlLex and Menhir
tags: ocaml menhir python parsing off-side-rule programming-language-systems
author: sano
categories: [Programming Language Systems, Parsing]
---

# Off-side rule の構文解析をしよう

Off-side rule というのは，
`{` とか `}`
とかを使わずに，
インデント（空白）のレベルでどこまでがブロックかを決めるやつ．
Python とか Haskell とかが採用している．

**[前回](/blog/2022/10/13/parsing-offside-ruled-syntax.html)** は，
どういうアルゴリズムでこの parsing ができるか（より正確には，必要な前処理ができるか）を議論した．

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

## `lexing_aux.ml`

indent level に応じて，
`indent`
や
`dedent`
などのトークンを返す関数を定義していく．

まず，`Parser` module を open しておく．

```ocaml
(** Lexer のための補助関数などを定義する．
*)

open Parser
```

indent level の stack を用意しておく．
最初に 0 を push しておく．

```ocaml
(** インデントレベルのスタック *)
let indent_level_stack =
  let stack = Stack.create () in
  Stack.push 0 stack;
  stack
```

現在の indent level を引数にとって，
出力すべき
`DEDENT`
の数を計算する関数は，
以下のようになる．

```ocaml
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
```

この関数は，
再帰を回しながら stack を pop して，
indent level が揃うのを待つ．
indent level が揃ったら 0 を返す．
この 0 に，
再帰を回した回数分だけ `succ` (= + 1) を適用するので，
「何回 stack を pop したか (= `DEDENT` の個数)」を得ることができる．

最後に，
上記の補助関数を使って，
`INDENT`
や
`DEDENT`
などのトークンを返す関数を定義する．
今回は，C 言語などの `;` に対応するトークン，`DELIMITER`，
も挿入している．

```ocaml
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
          (DELIMITER :: List.concat (Util.repeat n [ DEDENT; DELIMITER ]))
```

`Util.repeat` は `Util` の中の自作の関数で，
`Util.repeat n x` で
n 個の `x` からなるリストを返す．

> delimiter の扱いに関して，refactor する予定です．

## `lexer.mll`

`lexer.mll`
の実装はこんな感じ．

いつものように，
`Parser` module を open しておく．
off-side rule を採用していない構文では，
`space`
に改行も含める（こともある）と思うが，
今回は改行が来たら `INDENT` や `DEDENT` token を挟まなくてはいけないので，
改行は改行で `newline` を別途用意しておく．

```ocaml
(* Lexer *)
{
  open Parser
}

let space = [' ' '\t']
let newline = '\r' | '\n' | "\r\n"
```

`Lexing.token` も，ほとんどいつものように定義していく．

ただし，`newline`
が来たら，
`indent` を呼ぶ．

```ocaml
rule token = parse
  ...
    (* new line. call the [indent] tokenizer *)
  | newline  { Lexing.new_line lexbuf; indent lexbuf }
```

`indent` は次のように定義する．
単なる空行やコメントのみからなる行だった場合は，
読み飛ばす．
そうではなかった場合は，
`Lexing_aux.emit_indent` を使って，
`INDENT` や `DEDENT` を返す．

```ocaml
(* 改行があった場合に直後に呼ばれる Lexer *)
and indent = parse
  (* blank line *)
  | space* newline
    { Lexing.new_line lexbuf; indent lexbuf }

  (* blank line with a comment *)
  | space* '#' [^ '\n']* newline
    { Lexing.new_line lexbuf; indent lexbuf }

  (* indent (assuming that the next comming token is
      not a space, newline or comment) *)
  | space*
    { let indent_level =
        String.length @@ Lexing.lexeme lexbuf
      in
      Lexing_aux.emit_indent indent_level
    }
```

# Parsing with `TOKENS`

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

[自作 Python interpreter の実装（全体像を知りたい人向け）](https://github.com/sano-jin/python-in-ocaml)

# TODO

- Off-side ruled syntax の parsing の部分だけの実装を refactor 中．
  - <https://github.com/sano-jin/offside-rule-parsing>
  - （やる気充電のために，もしも需要があれば star しておいてください）
- 記事の refactor
- cite references
