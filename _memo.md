# memo

## 2024.08.16

jekyll は画像ファイルとかは post ディレクトリとは別に用意した asset ディレクトリに配置しておいて，
そこへのリンクを site.baseurl を使いながら指定することになると思うのだけど，

正直面倒なので，
post ディレクトリにサブディレクトリを立てて，
そこに index.md と画像ファイルとかを配置するような感じにしたい．

（しかし正常な文字列として解釈できないというエラーが出た）

# old

## メモ：

- drop down menu bar
  <https://www.w3schools.com/howto/howto_css_dropdown_navbar.asp>
- https://leico.github.io/TechnicalNote/Jekyll/page-menu
- https://github.com/jekyll/minima
- github pages でも，google adsense とかが使えるっぽいけど，
  6 ヶ月以上経過していて，かつ 1K view/day 以上じゃないとダメっぽい．
  <https://www.quora.com/Can-I-put-Google-Adsense-Ads-on-a-website-hosted-on-GitHub-Pages>

## soundcloud へのリンク．

<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1323459022&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe><div style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space:
nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;"><a href="https://soundcloud.com/sano2" title="sano" target="_blank" style="color: #cccccc; text-decoration: none;">sano</a> · <a href="https://soundcloud.com/sano2/celeste" title="Celeste" target="_blank" style="color: #cccccc; text-decoration: none;">Celeste</a></div>
<iframe width="100%" height="166" scrolling="no" frameborder="no" allow="autoplay" src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1318510963&color=%23ff5500&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true"></iframe><div style="font-size: 10px; color: #cccccc;line-break: anywhere;word-break: normal;overflow: hidden;white-space:
nowrap;text-overflow: ellipsis; font-family: Interstate,Lucida Grande,Lucida Sans Unicode,Lucida Sans,Garuda,Verdana,Tahoma,sans-serif;font-weight: 100;"><a href="https://soundcloud.com/sano2" title="sano" target="_blank" style="color: #cccccc; text-decoration: none;">sano</a> · <a href="https://soundcloud.com/sano2/random10" title="random10" target="_blank" style="color: #cccccc; text-decoration: none;">random10</a></div>

## Memo

```bash
convert -quality 100 -density 400 "images.pdf" trial-%02d.svg
convert trial-01.png -crop 4000x1700+0+250 cropped.png
```

remove all metadata

```bash
convert <input file> -strip <output file>
```

https://stackoverflow.com/questions/2654281/how-to-remove-exif-data-without-recompressing-the-jpeg
