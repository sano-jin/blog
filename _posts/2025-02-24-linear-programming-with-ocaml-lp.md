---
layout: post
title: ocaml-lp を用いた数理最適化
author: sano
excerpt: Linear Programming with ocaml-lp
tags: memo
category: memo
assets: /assets/2025-02-24-linear-programming-with-ocaml-lp/
extra-classname: frame-image
image: assets/2025-02-24-linear-programming-with-ocaml-lp/front.png
---

最近，たまに数理最適化ソルバを使うことがある．
個人的には OCaml が好きなので，
OCaml からソルバを使うためのフレームワークを探している．
先日，
[ocaml-lp](https://github.com/ktahar/ocaml-lp)
というライブラリを見つけた．
ドキュメントもすごくしっかり丁寧に書いてあるし，
かなり良さそうだ．

本稿では
[ocaml-lp](https://github.com/ktahar/ocaml-lp)
を用いた数理最適化問題の解き方について，
（ほぼ [wiki の Quick Start](https://github.com/ktahar/ocaml-lp/wiki/Quick_Start)
そのままだが）
備忘録を兼ねて残しておく．

# Quick Start

[Wiki](https://github.com/ktahar/ocaml-lp/wiki/Quick_Start)
に Quick Start があるので，
それを参考にする．

### Step 1. インストール

```bash
# optional but recommended to pin dev-repo
opam pin lp --dev-repo
opam pin lp-glpk --dev-repo
opam install lp lp-glpk
```

ここで，`opam install lp-glpk` において，
私の手元 (M2 MacBook) では
`fatal error: 'glpk.h' file not found`
というエラーが出た．

この解決策は
[issue](https://github.com/ktahar/ocaml-lp/issues/6)
に書いてあった（後から気づいた）．

とりあえず，私は shell 上で以下のようにして解決した．

```bash
export C_INCLUDE_PATH="/opt/homebrew/include:$C_INCLUDE_PATH"
export LIBRARY_PATH="/opt/homebrew/lib:$LIBRARY_PATH"
export LD_LIBRARY_PATH="/opt/homebrew/lib:$LD_LIBRARY_PATH"
```

上記のように C 言語関連のパスを設定してから，
再度 `opam install lp-glpk` すると，
私の環境ではきちんとコンパイルも通った．

### Step 2. 問題のモデル化

ocaml-lp を使って，

$$
\begin{align*}
x + 1.2y & \leq 5 \\
2x + y   & \leq 1.2
\end{align*}
$$

の下で
$x + y$ を最大化するプログラム `main.ml` は以下のようになる．

```ocaml
(* main.ml *)

let x = Lp.var "x"
let y = Lp.var "y"

let problem =
  let open Lp in
  let obj = maximize (x ++ y) in
  let c0 = x ++ (c 1.2 *~ y) <~ c 5.0 in
  let c1 = (c 2.0 *~ x) ++ y <~ c 1.2 in
  make obj [c0; c1]

let write () = Lp.write "my_problem.lp" problem

let solve () =
  match Lp_glpk.solve problem with
  | Ok (obj, xs) ->
      Printf.printf "Objective: %.2f\n" obj ;
      Printf.printf "x: %.2f y: %.2f\n"
        (Lp.PMap.find x xs) (Lp.PMap.find y xs)
  | Error msg ->
      print_endline msg

let () =
  if Lp.validate problem then (write () ; solve ())
  else print_endline "Oops, my problem is broken."
```

このモデリングの際に使える演算子等は，
[ドキュメント](https://ktahar.github.io/ocaml-lp/lp/Lp/index.html)
にまとまっているので，
適宜参考にすると良いだろう．

### Step 3. 実行

例えば以下のようにして実行できる．

```bash
ocamlfind ocamlopt -package lp,lp-glpk -linkpkg -o main main.ml
./main
```

サンプルプログラムの `write ()` は，
`my_problem.lp` という CPLEX LP ファイルを作る．

この CPLEX LP ファイルは以下のようになる：

```
maximize
 + 1.000000000000000000e+00 x + 1.000000000000000000e+00 y
subject to
 + 1.000000000000000000e+00 x + 1.199999999999999956e+00 y <= + 5.000000000000000000e+00
 + 2.000000000000000000e+00 x + 1.000000000000000000e+00 y <= + 1.199999999999999956e+00
end
```

ocaml-lp が native サポートしていないソルバも，
この CPLEX LP ファイルを入力として与えてやることで，
動かすことができる（ことがある）．
例えは [HiGHS](https://github.com/ERGO-Code/HiGHS) とか
（[参考：ocaml-lp の HiGHS 対応に向けて](/blog/2025/02/24/towards-adding-highs-support-to-ocaml-lp.html)）．

CPLEX LP ファイルの生成が終わった後，
サンプルプログラムでは `solve ()` で
[GLPK (GNU Linear Programming Kit)](https://www.gnu.org/software/glpk/)
というソルバを用いてこの最適化問題を解く．

ちなみに前述の `write ()` か，それに相当する処理を事前に行わないと，
この後に `solve ()` ができない．．．
ということは全くない．
`write ()` を先にしているのは，単に CPLEX LP ファイル生成の説明のため．
`write ()` せずに直接 `solve ()` しても全く問題ない．

実行結果の標準出力は以下のようになる．

```
GLPK Simplex Optimizer 5.0
2 rows, 2 columns, 4 non-zeros
*     0: obj =  -0.000000000e+00 inf =   0.000e+00 (2)
*     2: obj =   1.200000000e+00 inf =   0.000e+00 (0)
OPTIMAL LP SOLUTION FOUND
Objective: 1.20
x: 0.00 y: 1.20
```

$x = 0, y = 1.2$ で最適になるということが分かった．

# その他のサンプル

現在 [test/lp-glpk](https://github.com/ktahar/ocaml-lp/tree/master/test/lp-glpk)
にかなり良い例題がいくつかあるので，
参考になるだろう．

- 8-Queens Problem:
  [test/lp-glpk/test_nqueens.ml](https://github.com/ktahar/ocaml-lp/blob/669a32cbc36fe16197272a8ba673394707bceb07/test/lp-glpk/test_nqueens.ml)
- Job-Shop Scheduling Problem (JSSP):
  [test/lp-glpk/test_jobs.ml](https://github.com/ktahar/ocaml-lp/blob/669a32cbc36fe16197272a8ba673394707bceb07/test/lp-glpk/test_jobs.ml)
- Knapsack Problem:
  [test/lp-glpk/test_post_processing.ml](https://github.com/ktahar/ocaml-lp/blob/669a32cbc36fe16197272a8ba673394707bceb07/test/lp-glpk/test_post_processing.ml)

ただし，
これらの問題は解が一通りとは限らず，
出力は非決定的である．

そのために，
正しい答えが得られていたとしても，
同ディレクトリ内にある `.expected` ファイルとは一見異なる結果になる可能性があることに注意．

ビンパッキング問題を解いたらその解説をここに追加予定．
