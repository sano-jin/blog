---
layout: post
title: Parsing offside-rule syntax with OCamlLex and Menhir
excerpt: Python とかの構文解析をする．
author: sano
---

# Off-side rule と言うのは，

`{` とか `}`
とかを使わずに，
インデント（空白）のレベルでどこまでがブロックかを決めるやつ．

Python とか Haskell とかが採用している．

Python だと，
こんな感じで書くよね．

```python
def hello():
  print("Hello world")

hello()
```

こう言う書き方はしない．

```
def hello(): {
  print("Hello world")
}

hello()
```

けど，Parsing するときは事前に，
Lexing の段階（文字列をトークンの列に分解する）で，
下の方の構文に変換する感じになる．

より具体的には，
インデントのレベルに合わせて，
`{` に対応するトークン (`INDENT`) と，
`}` に対応するトークン (`DEDENT`)
を挟む（まぁ何でも良いけど）．

// 今回の実装だと `;` に対応するトークン (`DELIMITER`) も挟んでいる．

上記の例だと，
Lexing 後にこんな感じになるようにする．

```
DEF
VAR("hello")
(
)
:
INDENT
VAR("print")
(
STRING("Hello world")
)
DEDENT
DELIMITER
VAR("print")
(
STRING("Hello world")
)
```

そうすれば，普通の parsing ができる．

# 問題は，どうやって `INDENT`, `DEDENT` を挟むか

ちょっとややこしい．

「indent が空白何個分か」
を indent level と言うことにする．

今までの indent level を stack にして持っておく．

最初は 0 を入れておく．
つまり，初期状態で，stack の top の indent level は `[0]`．

## 現在の indent level が，この stack の一番上に入っている indent level と同じなら

> 前の行と同じブロック内だと言うことなので，
> 特に何もしない．

例えば，上記のコードを解析しているとする．

```python
def hello(): # [0]
```

この 1 行目の indent level は 0 で，
stack の top の indent level (= 0) と同じなので，
1 行目では，特に何もしない．

## 現在の indent level が，この stack の一番上に入っている indent level よりも大きいなら

> 新しいブロックが始まったと言うことなので，
> `INDENT` token を挟み，stack に indent level を push する．

例えば，
上記のコードを解析しているとする．

```python
def hello(): # [0]
  print("Hello world") # [2, 0]
```

この 2 行目の indent level は 2 なので，
`print("Hello...` の Lexing に入る前に，
`INDENT` トークンを挟む．

また，stack に indent level = 2 を push して，
stack は `[2, 0]` になる．

## 現在の indent level が，この stack の一番上に入っている indent level よりも小さいなら

> ブロック終わったと言うことなので，
> `DENDENT` token を挟む．
>
> stack から n > 1 回 pop して，
> stack の top の indent level が，
> 今の indent level と等しくなるようにする．
> うまく等しくなるようにできたら，
> `DEDENT` token を n 個挟む．
>
> 等しくなるようにできないなら，
> エラーを吐く．

例えば，
上記のコードを解析しているとする．

```python
def hello(): # [0]
  print("Hello world") # [2, 0]

hello() # [0]
```

この 4 行目の indent level は 0 なので，
stack の top の index level (= 2) とは異なる．
従って，
`print()` の Lexing に入る前に，
stack を pop する必要がある．

幸いなことに，一回 pop すれば，
stack の top の indent level を 0 にすることができる．

よって，
`DEDENT` トークンを一個挟めば良い．

また，stack に indent level = 2 を push して，
stack は `[2, 0]` になる．

### `DEDENT` token を挟むのに失敗する例

例えば，
上記のコードを解析しているとする．

```python
def hello(): # [0]
  print("Hello world") # [2, 0]

 hello() # <-- error
```

ちょっとわかりづらいが，
この 4 行目の indent level は 0 なので，
stack の top の indent level (= 2) とは異なる．

従って，
stack を pop するわけだが，
pop した後の top の indent level は 0 なので，
どう足掻いても等しくできない．

なので，これはエラーを吐く．

## で，実際に OCaml でどうやって実装するか．

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
構文の型定義を拡張する．

普通は，`Lexing.token` を用いてこんな感じで構文解析をする．

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
tokenizer はこいつらを破壊的に更新して，
残りの文字列とかが減っていくようになっている．

参考：
<https://v2.ocaml.org/api/Lexing.html#1_Lexerbuffers>

こいつを hack してやる．

`DEDENT`
token を挟みたいタイミングでは，
`Lexing.lexbug`
に対して変更を加えずに，
`DEDENT`
を返す，
`token` と言う関数を自作して，
こいつを使うことにする．

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

However, DEDENT tokens should be inserted possibly
one or more times according to the length of (decreasing) indentation.

「今までどれくらいインデントしていたか（空白何個分だったか）」，
を stack にして持っておく．

をインデントレベルのスタック

```ocaml
(** インデントレベルのスタック *)
let indent_level_stack =
  let stack = Stack.create () in
  Stack.push 0 stack;
  stack
```

実装．

```ocaml
(** Lexer のための補助関数などを定義する．
*)

open Parser
open Util
open Util.OptionExtra

(** インデントレベルが上がった場合に，何段階上がったかを Option 型で取得する．
      マッチするインデントレベルが存在していなかった場合は [None] を返す．
  *)
let rec emit_dedents indent_level =
  let prev = Stack.top indent_level_stack in
  if indent_level > prev then None
  else if indent_level = prev then Some 0
  else (
    ignore @@ Stack.pop indent_level_stack;
    succ <$> emit_dedents indent_level)

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
    | None -> BAD_DEDENT
    | Some 0 -> DELIMITER
    | Some n ->
        TOKENS
          (DELIMITER :: List.concat (ListExtra.repeat n [ DEDENT; DELIMITER ]))
```

実装．

```ocaml
(** Lexer のための補助関数などを定義する．
*)

open Parser
open Util
open Util.OptionExtra

(** インデントレベルのスタック *)
let indent_level_stack =
  let stack = Stack.create () in
  Stack.push 0 stack;
  stack

(** インデントレベルが上がった場合に，何段階上がったかを Option 型で取得する．
      マッチするインデントレベルが存在していなかった場合は [None] を返す．
  *)
let rec emit_dedents indent_level =
  let prev = Stack.top indent_level_stack in
  if indent_level > prev then None
  else if indent_level = prev then Some 0
  else (
    ignore @@ Stack.pop indent_level_stack;
    succ <$> emit_dedents indent_level)

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
    | None -> BAD_DEDENT
    | Some 0 -> DELIMITER
    | Some n ->
        TOKENS
          (DELIMITER :: List.concat (ListExtra.repeat n [ DEDENT; DELIMITER ]))
```

test

`INDENT` をどのタイミングで何個挟めば良いのかは，
まぁ簡単にわかる．

インデントされたタイミングで挟めば良い！

困っちゃうのが，
`DEDENT` をどのタイミングで何個挟めば良いのか．

簡単にわかる．

off-side rule の parsing
（というか lexing の段階で INDENT, DEDENT token を挟むのだが）
に結構詰まったので， その辺りはどっかにメモっても良いかも知れない．

ocamllex は（何故か）一度に複数の token を返せない．

However, DEDENT tokens should be inserted possibly
one or more times according to the length of (decreasing) indentation.
