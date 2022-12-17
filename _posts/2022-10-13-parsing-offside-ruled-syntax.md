---
layout: post
title: Python とかの構文解析をする（アルゴリズム編）
excerpt: Parsing off-side ruled syntax
tags: python parsing off-side-rule programming-language-systems
author: sano
categories: [Programming Language Systems, Parsing]
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

今回の実装だと `;` に対応するトークン (`DELIMITER`) も挟んでいる．

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
DELIMITER
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
この 4 行目の indent level は 1 なので，
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

[〉続く．．．](/blog/2022/10/14/parsing-offside-ruled-syntax-with-ocamllex-and-menhir.html)
