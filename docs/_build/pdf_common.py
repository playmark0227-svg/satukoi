# -*- coding: utf-8 -*-
"""サツコイ！ 配布PDF 共通モジュール

要点：ReportLab は日本語の禁則処理を行わないため、行頭に「。、）」が来たり
単語の途中で改行される。ここで幅を実測しながら禁則処理つきで改行位置を決め、
<br/> を差し込んでから Paragraph に渡すことで、日本語として自然な組版にする。
"""
import re, os
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.colors import HexColor
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_RIGHT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Table,
    TableStyle, PageBreak, Image, Flowable, KeepTogether,
)

# ── フォント ──
JP = "JPGothic"
_FONT_PATH = "/usr/share/fonts/opentype/ipaexfont-gothic/ipaexg.ttf"
pdfmetrics.registerFont(TTFont(JP, _FONT_PATH))
# <b> でフォントが見つからず落ちないよう、同じ実体を Bold として登録する
pdfmetrics.registerFont(TTFont(JP + "-Bold", _FONT_PATH))
pdfmetrics.registerFontFamily(JP, normal=JP, bold=JP + "-Bold",
                              italic=JP, boldItalic=JP + "-Bold")

# ── 色 ──
INK = HexColor("#14161c"); SOFT = HexColor("#626875"); FAINT = HexColor("#9aa0ab")
LINE_C = HexColor("#e8eaee"); CANVAS = HexColor("#f7f7f8")
PRIMARY = HexColor("#ee3f9b"); PRIMARY_STRONG = HexColor("#d31f80")
WHITE = HexColor("#ffffff")
WARN_BG = HexColor("#fef3e2"); WARN = HexColor("#a86400")
INFO_BG = HexColor("#eef4ff"); INFO = HexColor("#2b5cb8")
OK_BG = HexColor("#e8f8ee"); OK = HexColor("#0b6b34")

LOGO = "/home/user/satukoi/public/logo.png"
W, H = A4
M = 18 * mm
CW = W - 2 * M

# ══════════════════════════════════════════════════════════
#  禁則処理つき行分割
# ══════════════════════════════════════════════════════════
# 行頭に置いてはいけない文字（閉じ括弧・句読点・長音・小書き仮名など）
HEAD_NG = set("）)］]｝}〉》」』】、。，．・：；？！ーｰ〜～%％℃"
              "ぁぃぅぇぉっゃゅょゎゕゖァィゥェォッャュョヮヵヶ々ゝゞヽヾ"
              "’””’")
# 行末に置いてはいけない文字（開き括弧など）
TAIL_NG = set("（(［[｛{〈《「『【‘““‘")

_TAG_RE = re.compile(r"<[^>]+>")
_BR_RE = re.compile(r"^<br\s*/?>$", re.I)


# 分離禁止：英数字の連なりとカタカナ語は途中で改行しない
_UNIT_RE = re.compile(r"[A-Za-z0-9][A-Za-z0-9\.\-_/&']*|[ァ-ヴｦ-ﾟー]+")


def _split_units(s):
    """文字列を「分割してはいけないまとまり」の単位に切る"""
    out = []
    pos = 0
    for m in _UNIT_RE.finditer(s):
        if m.start() > pos:
            out.extend(s[pos:m.start()])
        out.append(m.group())
        pos = m.end()
    out.extend(s[pos:])
    return out


def _tokenize(text):
    """(種別, 文字列) のリストへ。種別: 'c'=文字/まとまり / 't'=タグ / 'br'=強制改行"""
    out = []
    pos = 0
    for m in _TAG_RE.finditer(text):
        if m.start() > pos:
            out.extend(("c", u) for u in _split_units(text[pos:m.start()]))
        tag = m.group()
        out.append(("br", "") if _BR_RE.match(tag) else ("t", tag))
        pos = m.end()
    out.extend(("c", u) for u in _split_units(text[pos:]))
    return out


def jp_wrap(text, font, size, max_w, safety=0.97):
    """幅 max_w に収まるよう、禁則処理を守って <br/> を差し込んだ文字列を返す。

    ・行頭禁則文字は前の行にぶら下げる
    ・行末禁則文字（開き括弧）は次の行へ送る
    ・<b> などのタグは幅0として扱い、そのまま維持する
    """
    if not text:
        return text
    # 行末に句読点などを「ぶら下げる」ぶんの余白を必ず1文字分残しておく。
    # ここを確保しないと、ぶら下げた行が実際の幅を超えて ReportLab が
    # 再折り返しし、「、」や「・」だけが次行に落ちてしまう。
    limit = max_w * safety - size * 1.02
    if limit <= size:
        limit = max_w * safety
    toks = _tokenize(text)
    lines, cur, w = [], [], 0.0

    def flush():
        nonlocal cur, w
        lines.append("".join(t[1] for t in cur))
        cur, w = [], 0.0

    i = 0
    n = len(toks)
    while i < n:
        kind, val = toks[i]
        if kind == "br":
            flush(); i += 1; continue
        if kind == "t":
            cur.append(toks[i]); i += 1; continue
        cw = pdfmetrics.stringWidth(val, font, size)
        # 1つのまとまりが幅を超える場合だけは、やむを得ず文字単位に分解する
        if cw > limit and len(val) > 1:
            toks[i:i + 1] = [("c", ch) for ch in val]
            n = len(toks)
            continue
        if cur and w + cw > limit:
            if val in HEAD_NG:
                # ぶら下げ：連続する行頭禁則文字をまとめて今の行末に置く
                while i < n and toks[i][0] == "c" and toks[i][1] in HEAD_NG:
                    cur.append(toks[i]); i += 1
                flush(); continue
            # 行末の開き括弧などは次の行へ送る
            moved = 0
            while len(cur) > 1 and cur[-1][0] == "c" and cur[-1][1] in TAIL_NG:
                cur.pop(); moved += 1
            i -= moved
            flush(); continue
        cur.append(toks[i]); w += cw; i += 1
    if cur:
        flush()
    return "<br/>".join(lines)


# ══════════════════════════════════════════════════════════
#  禁則処理を自動適用する段落
#  （描画直前に「実際に使える幅」が渡されるので、そこで改行位置を決める。
#    幅を事前に推測しなくてよいので、表のセルでも段落でも確実に効く）
# ══════════════════════════════════════════════════════════
class JPParagraph(Paragraph):
    def __init__(self, text, style, bulletText=None, **kw):
        self._jp_src = text
        self._jp_bullet = bulletText
        self._jp_kw = kw
        self._jp_done = False
        Paragraph.__init__(self, text, style, bulletText=bulletText, **kw)

    def wrap(self, availWidth, availHeight):
        if self._jp_done:
            return Paragraph.wrap(self, availWidth, availHeight)
        self._jp_done = True
        base = (availWidth
                - getattr(self.style, "leftIndent", 0)
                - getattr(self.style, "rightIndent", 0))
        if base <= 20:
            return Paragraph.wrap(self, availWidth, availHeight)
        # ReportLab の内部計算はこちらの実測よりわずかに狭いことがあるため、
        # 「こちらが決めた改行数どおりに収まったか」を確かめ、
        # 収まらなければ幅を少しずつ詰めて追い込む。
        res = None
        for shrink in (0, 6, 12, 20, 30):
            text = jp_wrap(self._jp_src, self.style.fontName,
                           self.style.fontSize, base - shrink, safety=0.995)
            Paragraph.__init__(self, text, self.style,
                               bulletText=self._jp_bullet, **self._jp_kw)
            res = Paragraph.wrap(self, availWidth, availHeight)
            expected = text.count("<br/>") + 1
            try:
                actual = len(self.blPara.lines)
            except Exception:
                break
            if actual <= expected:
                break
        return res


# ══════════════════════════════════════════════════════════
#  スタイル
# ══════════════════════════════════════════════════════════
def build_styles():
    s = {}
    s["cover_title"] = ParagraphStyle("ct", fontName=JP, fontSize=21, leading=30, textColor=INK, alignment=TA_CENTER)
    s["cover_sub"] = ParagraphStyle("cs", fontName=JP, fontSize=11.5, leading=19, textColor=SOFT, alignment=TA_CENTER)
    s["cover_meta"] = ParagraphStyle("cm", fontName=JP, fontSize=9, leading=15, textColor=FAINT, alignment=TA_CENTER)
    s["h1"] = ParagraphStyle("h1", fontName=JP, fontSize=13.5, leading=19, textColor=INK)
    s["body"] = ParagraphStyle("b", fontName=JP, fontSize=9.2, leading=16, textColor=INK, spaceAfter=4)
    s["soft"] = ParagraphStyle("sf", fontName=JP, fontSize=9.2, leading=16, textColor=SOFT, spaceAfter=4)
    s["note"] = ParagraphStyle("nt", fontName=JP, fontSize=8.2, leading=14, textColor=FAINT, spaceAfter=3)
    s["li"] = ParagraphStyle("li", fontName=JP, fontSize=9.2, leading=16, textColor=INK,
                             leftIndent=11, bulletIndent=2, spaceAfter=3, bulletFontName=JP)
    s["li_note"] = ParagraphStyle("lin", fontName=JP, fontSize=8.2, leading=14, textColor=FAINT,
                                  leftIndent=11, bulletIndent=2, spaceAfter=2, bulletFontName=JP)
    s["tcell"] = ParagraphStyle("tc", fontName=JP, fontSize=8.3, leading=13.2, textColor=INK)
    s["tcell_soft"] = ParagraphStyle("tcs", fontName=JP, fontSize=8.3, leading=13.2, textColor=SOFT)
    s["tcell_c"] = ParagraphStyle("tcc", fontName=JP, fontSize=8.3, leading=13.2, textColor=INK, alignment=TA_CENTER)
    s["tcell_r"] = ParagraphStyle("tcr", fontName=JP, fontSize=8.3, leading=13.2, textColor=INK, alignment=TA_RIGHT)
    s["thead"] = ParagraphStyle("th", fontName=JP, fontSize=8.3, leading=12.8, textColor=SOFT)
    s["thead_c"] = ParagraphStyle("thc", fontName=JP, fontSize=8.3, leading=12.8, textColor=SOFT, alignment=TA_CENTER)
    return s


S = build_styles()

TBL_PAD = 6.5  # 表セルの左右パディング（片側）


def P(text, style_key, width=CW, indent=0.0):
    """禁則処理つきの段落（幅は描画時に自動で判定）"""
    return JPParagraph(text, S[style_key])


def li(text, style_key="li", width=CW):
    return JPParagraph(text, S[style_key], bulletText="・")


def h1(text):
    t = Table([[Paragraph(text, S["h1"])]], colWidths=[CW], style=TableStyle([
        ("LINEBEFORE", (0, 0), (0, 0), 3, PRIMARY), ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    t.spaceBefore, t.spaceAfter = 15, 7
    t.keepWithNext = True
    return t


def tbl(headers, rows, widths, align=None, hl_rows=(), head_center=(), soft_cols=()):
    """全セルに禁則処理を適用した表。align は列ごとに 'l'/'c'/'r'。"""
    ncol = len(widths)
    align = align or ["l"] * ncol
    data = []
    if headers:
        hrow = []
        for i, htxt in enumerate(headers):
            stl = S["thead_c"] if i in head_center else S["thead"]
            hrow.append(JPParagraph(str(htxt), stl))
        data.append(hrow)
    for r in rows:
        row = []
        for i, cval in enumerate(r):
            key = {"l": "tcell", "c": "tcell_c", "r": "tcell_r"}[align[i]]
            if i in soft_cols:
                key = "tcell_soft"
            row.append(JPParagraph(str(cval), S[key]))
        data.append(row)
    stl = [("GRID", (0, 0), (-1, -1), 0.6, LINE_C), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
           ("TOPPADDING", (0, 0), (-1, -1), 5), ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
           ("LEFTPADDING", (0, 0), (-1, -1), TBL_PAD), ("RIGHTPADDING", (0, 0), (-1, -1), TBL_PAD)]
    if headers:
        stl.append(("BACKGROUND", (0, 0), (-1, 0), CANVAS))
    for hr in hl_rows:
        stl.append(("BACKGROUND", (0, hr), (-1, hr), HexColor("#fdf2f8")))
    t = Table(data, colWidths=widths, style=TableStyle(stl), repeatRows=1 if headers else 0)
    t.spaceBefore, t.spaceAfter = 4, 9
    return t


def callout(text, bg=WARN_BG, fg=WARN):
    p = ParagraphStyle("co", fontName=JP, fontSize=8.7, leading=14.8, textColor=fg)
    inner = JPParagraph(text, p)
    t = Table([[inner]], colWidths=[CW], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    t.spaceBefore, t.spaceAfter = 5, 8
    return t


def section(title, *flowables):
    """見出しと中身を分断しないようにまとめる。

    表を含まない短い節は丸ごと同じページに置き、
    長い節・表を含む節は「見出し＋最初の1つ」だけを固定する。
    """
    items = [h1(title)] + list(flowables)
    has_table = any(isinstance(f, Table) for f in flowables)
    if not has_table and len(flowables) <= 7:
        return [KeepTogether(items)]
    return [KeepTogether(items[:2])] + items[2:]


def keep(*flowables):
    """指定した要素群を同じページに保つ"""
    return KeepTogether(list(flowables))


def make_doc(path, footer):
    def on_page(canv, doc):
        canv.saveState()
        if doc.page > 1:
            canv.setStrokeColor(LINE_C); canv.setLineWidth(0.6)
            canv.line(M, 13 * mm, W - M, 13 * mm)
            canv.setFont(JP, 7.5); canv.setFillColor(FAINT)
            canv.drawString(M, 9 * mm, footer)
            canv.drawRightString(W - M, 9 * mm, str(doc.page - 1))
        canv.restoreState()
    doc = BaseDocTemplate(path, pagesize=A4, leftMargin=M, rightMargin=M,
                          topMargin=16 * mm, bottomMargin=18 * mm)
    # Frame の既定パディング(6pt)があると、こちらで計算した行幅と実際の描画幅が
    # ずれて再折り返しが起きる（句読点だけが次行に落ちる）。0 にして一致させる。
    frame = Frame(M, 18 * mm, CW, H - 34 * mm, id="main",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=on_page)])
    return doc


def cover(story, title, subtitle, meta):
    story.append(Spacer(1, 50 * mm))
    if os.path.exists(LOGO):
        img = Image(LOGO, width=27 * mm, height=27 * mm); img.hAlign = "CENTER"
        story.append(img)
    story.append(Spacer(1, 9 * mm))
    story.append(Paragraph(title, S["cover_title"]))
    story.append(Spacer(1, 4 * mm))
    story.append(Paragraph(subtitle, S["cover_sub"]))
    story.append(Spacer(1, 40 * mm))
    story.append(Paragraph(meta, S["cover_meta"]))
    story.append(PageBreak())
