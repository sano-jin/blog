---
layout: post
title: ocaml-lp の HiGHS 対応に向けて
author: sano
excerpt: Towards Adding HiGHS Support to ocaml-lp
tags: memo
category: memo
assets: /assets/2025-02-24-towards-adding-highs-support-to-ocaml-lp/
extra-classname: frame-image
image: assets/2025-02-24-towards-adding-highs-support-to-ocaml-lp/front.png
---

最近，たまに数理最適化ソルバを使うことがある．
数理最適化ソルバの利用方法はいくつかあるが，
恐らく一番障壁が低いのは [PuLP](https://coin-or.github.io/pulp/) / Python だろう．

ただ，個人的には，できれば（こっそり）OCaml などの言語を使いたい．
そのために，OCaml からソルバを使うためのフレームワークを探していた．

# ocaml-lp を発見

先日，
[ocaml-lp](https://github.com/ktahar/ocaml-lp) というライブラリを見つけた．

ドキュメントもすごくしっかり丁寧に書いてあるし，
かなり良さそうだ．

ただ，現時点（2025 年 2 月 24 日）では GLPK と Gurobi にしか対応していない．

- [GLPK (GNU Linear Programming Kit)](https://www.gnu.org/software/glpk/):
  - OSS (オープンソース)．
  - ただし，
    商用ツールとかと比較すると，
    問題によってはちょっと遅い場合もあるかも？という理解※．
    ※ ベンチマークを見たり，
    自分でちゃんと測定したわけではないので，
    正確なことは分からない．
    せっかくなので，そのうち手元でもプロファイリングしつつ，調べようかな．
- [Gurobi](https://www.gurobi.com/):
  - なんか凄そうな感じはするし，
    実際凄いらしい．
  - ただ，商用ツールなので，基本的におカネを払わないと使えない．

# OCaml でも HiGHS を使いたい

少しだけ試した感じだと GLPK ではちょっと遅かったので，
現在
[HiGHS](https://github.com/ERGO-Code/HiGHS)
を使っている．
HiGHS は OSS の MILP ソルバの中ではかなり性能が高いらしい※．
※ 本当かどうかは知らない．

現在は PuLP / Python を介して HiGHS を使っているが，
OCaml から使えるようにするために，
ocaml-lp に HiGHS を使えるようにするための追加実装を行った．

追加実装したコードはせいぜい 100 行程度で済んだ．
途中経過はこんな感じ．

<blockquote class="twitter-tweet"><p lang="ja" dir="ltr">OCaml から HiGHS（数理最適化ソルバ）を使えるようにした． <br><br>ocaml-lp で CPLEX LP を生成して，<br>HiGHS を実行してその出力を解析してるんだけど，<br>良い感じに整理して ocaml-lp に PR しても良いかもな．<br><br>ocaml-lp: <a href="https://t.co/NQizKiOIV5">https://t.co/NQizKiOIV5</a><br>HiGHS: <a href="https://t.co/58LfbB1ghp">https://t.co/58LfbB1ghp</a> <a href="https://t.co/wJpFdOQRoU">pic.twitter.com/wJpFdOQRoU</a></p>&mdash; sano (@sano_jn) <a href="https://twitter.com/sano_jn/status/1893218644806562259?ref_src=twsrc%5Etfw">February 22, 2025</a></blockquote> <script async src="https://platform.twitter.com/widgets.js" charset="utf-8"></script>

ocaml-lp は CPLEX-LP を出力できて，
HiGHS は CPLEX-LP を実行できるので，
基本的には HiGHS の出力を解析するだけで済んだ．

現状の実装はこんな感じ．

```ocaml
exception SolverError of string

(* Load the solution file of HiGHS. *)
let readsol filename =
  let lines = read_lines filename in
  (* Separate each line and transform them into a tuple (name, float value). *)
  let parse_arg line =
    let words = String.split_on_char ' ' line in
    match words with
    | [name; value_str] ->
        (name, float_of_string value_str)
    | _ ->
        raise (SolverError ("Invalid line format: " ^ line))
  in
  let _, obj =
    match List.find_opt (String.starts_with ~prefix:"Objective") lines with
    | None ->
        raise (SolverError "No objective")
    | Some objective_line ->
        parse_arg objective_line
  in
  (* Geth the line indecies of "# Columns" and "# Rows". *)
  let begin_index_opt =
    List.find_index (String.starts_with ~prefix:"# Columns") lines
  in
  let end_index_opt =
    List.find_index (String.starts_with ~prefix:"# Rows") lines
  in
  match (begin_index_opt, end_index_opt) with
  | Some bi, Some ei ->
      (* Get the sub-lines [start, ei). *)
      let sub_lines = List.filteri (fun idx _ -> idx > bi && idx < ei) lines in
      (obj, List.map parse_arg sub_lines)
  | _ ->
      raise (SolverError "Cannot read HiGHS solver output")

(** Write HiGHS additional options to file *)
let write_options filepath options =
  let oc = open_out filepath in
  let options =
    options
    |> List.map (fun (name, value) -> name ^ " = " ^ value)
    |> String.concat "\n"
  in
  Printf.fprintf oc "%s\n" options ;
  close_out oc

(* Run HiGHS and obtain the output solution.
   @param options list of additional options to pass to solver.
 *)
let solve ?highs_path ?(options = []) problem =
  try
    let highs_path =
      match highs_path with
      | None -> (
        try Sys.getenv "HIGHS_CMD"
        with Not_found ->
          raise (SolverError "The path to the HiGHS executable is not set.") )
      | Some path ->
          path
    in
    Lp.write "tmp.lp" problem ;
    write_options "options.txt" options ;
    let args =
      " tmp.lp --solution_file solution.txt --options_file options.txt"
    in
    let command = highs_path ^ args in
    let result = Sys.command command in
    if result <> 0 then raise (SolverError "Failed to execute HiGHS") else () ;
    let obj, sol = readsol "solution.txt" in
    Ok
      ( obj
      , List.fold_left
          (fun m (k, v) -> Lp.PMap.add k v m)
          Lp.PMap.empty
          (List.map (fun (v, x) -> (Lp.var v, x)) sol) )
  with SolverError msg -> Error msg
```

# しかし，テストケースに問題があった

追加実装自体はスムーズだったが，そもそも元のテストケースに問題があった．

ocaml-lp では 8-Queens 問題などをテストに使っているが，
この問題の解は複数あるため，出力が非決定的になってしまう．
そのため，正しい答えを出力できているにもかかわらず，テストに失敗することがある．

とりあえず Issue を立てた．

[Non-determinism in the test cases for GLPK #10](https://github.com/ktahar/ocaml-lp/issues/10)

> Hello, and thank you for maintaining this great library.
>
> I truly appreciate this library.
> However, I found a minor issue in some of the test cases for GLPK.
>
> ## Problem
>
> As I understand, the following three problems have more than two solutions, which lead to non-deterministic output:
>
> - 8-Queens Problem: [test/lp-glpk/test_nqueens.ml](https://github.com/ktahar/ocaml-lp/blob/669a32cbc36fe16197272a8ba673394707bceb07/test/lp-glpk/test_nqueens.ml)
> - Job-Shop Scheduling Problem (JSSP): [test/lp-glpk/test_jobs.ml](https://github.com/ktahar/ocaml-lp/blob/669a32cbc36fe16197272a8ba673394707bceb07/test/lp-glpk/test_jobs.ml)
> - Knapsack Problem: [test/lp-glpk/test_post_processing.ml](https://github.com/ktahar/ocaml-lp/blob/669a32cbc36fe16197272a8ba673394707bceb07/test/lp-glpk/test_post_processing.ml)
>
> For example, printing only **one** solution for the 8-Queens problem is non-deterministic, which causes the test to fail in my environment.
> A more detailed explanation is provided in the Appendix below.
>
> This suggests the need for more robust testing.
>
> ## Possible Solution
>
> I have already sent [a pull request](https://github.com/ktahar/ocaml-lp/pull/9) to resolve this issue for the 8-Queens test case.
> This pull request implements a test that enumerates all solutions and sorts them to ensure a consistent printed output.
> If you would like to apply a similar solution to other test cases, I would be happy to do so.
>
> However, modifying the test to enumerate all solutions may increase code complexity.
> Additionally, most users might be interested in obtaining **one** solution rather than **all** solutions.
>
> Therefore, it might be beneficial to introduce an `examples` directory to house the current test cases that serve as useful examples for users, separating them from test cases intended for verification.
>
> ## Summary
>
> 1. If you prefer test cases to enumerate all solutions, I am happy to contribute further modifications.
> 2. Introducing an `examples` directory could be a good approach to distinguish user-oriented example test cases from those used for validation.

また，8-Queens 問題については，全ての解を列挙してソートすることで，
テスト結果が決定的になるように修正し，Pull Request を送った．

[Fix the GLPK test case which uses 8-Queens problem. #9](https://github.com/ktahar/ocaml-lp/pull/9)

> Hello, and thank you for maintaining this great library.
>
> I truly appreciate this library,
> but I encountered an issue where dune runtest fails in my environment.
> To address this, I have re-implemented the test case for GLPK which uses the 8-Queens problem.
>
> The 8-Queens problem has 12 solutions up to symmetry and
> 92 solutions including symmetric placements.
> In this patch, the solver enumerates all solutions and sorts them to ensure determinism.
>
> ...

ただ，他のテストケースも同様の問題を抱えているため，
修正には思ったより手間がかかりそう．．．

ひとまず Issue の回答待ち．

# 余談：ocaml-lp の作者様について

どうやら ocaml-lp の作者はトヨタ中央研究所にご所属されていらっしゃる方のようだ．
当初は日本人の方だとも気づいていなかった．
東工大で博士号をご取得されているらしい．

こんな論文も出されている．

- [arXiv:2411.10208](https://arxiv.org/abs/2411.10208)

格好良いなぁ．

プログラミング言語やソフトウェア開発の分野ではなく，
どちらかというと材料系の研究をされているようなので，
まぁ接点はなさそう．
