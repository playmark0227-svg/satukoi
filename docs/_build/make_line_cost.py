# -*- coding: utf-8 -*-
"""LINE通知の月額固定費インパクト PDF（調査済みの実料金にもとづく）"""
import os, math
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

# 日本語の禁則処理を自動適用する段落に差し替える（行頭の句読点・閉じ括弧、
# 英単語やカタカナ語の途中改行を防ぐ）
from pdf_common import JPParagraph as Paragraph  # noqa: E402

JP = "JPGothic"
pdfmetrics.registerFont(TTFont(JP, "/usr/share/fonts/opentype/ipaexfont-gothic/ipaexg.ttf"))

INK = HexColor("#14161c"); SOFT = HexColor("#626875"); FAINT = HexColor("#9aa0ab")
LINE_C = HexColor("#e8eaee"); CANVAS = HexColor("#f7f7f8")
PRIMARY = HexColor("#ee3f9b"); PRIMARY_STRONG = HexColor("#d31f80")
LG = HexColor("#06C755"); LG_DARK = HexColor("#04a144"); LG_SOFT = HexColor("#e8f8ee")
WARN_BG = HexColor("#fef3e2"); WARN = HexColor("#a86400")
INFO_BG = HexColor("#eef4ff"); INFO = HexColor("#2b5cb8")

LOGO = "/home/user/satukoi/public/logo.png"
W, H = A4; M = 18 * mm; CW = W - 2 * M

# ══════════════════════════════════════════════════════════
#  LINE料金（2026年8月 調査時点／税別）
# ══════════════════════════════════════════════════════════
PLANS = [
    # (プラン名, 月額(税別), 無料通数, 追加メッセージ)
    ("コミュニケーション", 0, 200, "追加不可"),
    ("ライト", 5000, 5000, "追加不可"),
    ("スタンダード", 15000, 30000, "1通 3円〜（従量）"),
]
EXTRA_UNIT = 3  # スタンダードの追加メッセージ単価（円/通）

# ── 通知モデル（コード由来の事実＋明示した仮定）──
# 1申込 → APPLICATION_RECEIVED 1通
# 1マッチ成立 → MATCHED 1通
# 1日程確定 → DATE_CONFIRMED 2通（両者）＋ 前日リマインド 2通（両者）
SCENARIOS = [
    # (名称, 月間申込数/人 a, 承諾率 r, 確定率 c, お知らせ回数/月 n)
    ("標準", 3, 0.30, 0.70, 2),
    ("活発", 6, 0.35, 0.75, 4),
]

def per_member_msgs(a, r, c, n):
    return a * (1 + r + 4 * r * c) + n

def plan_for(msgs):
    """通数から必要プランと月額を返す"""
    for (name, fee, free, extra) in PLANS:
        if msgs <= free:
            return name, fee, 0
    # スタンダード超過
    name, fee, free, extra = PLANS[-1]
    over = msgs - free
    return name + "＋従量", fee + over * EXTRA_UNIT, over

MEMBER_STEPS = [50, 100, 300, 500, 1000, 2000, 3000]

def styles():
    s = {}
    s["cover_title"] = ParagraphStyle("ct", fontName=JP, fontSize=20, leading=28, textColor=INK, alignment=TA_CENTER)
    s["cover_sub"] = ParagraphStyle("cs", fontName=JP, fontSize=11.5, leading=19, textColor=SOFT, alignment=TA_CENTER)
    s["cover_meta"] = ParagraphStyle("cm", fontName=JP, fontSize=9, leading=15, textColor=FAINT, alignment=TA_CENTER)
    s["h1"] = ParagraphStyle("h1", fontName=JP, fontSize=13.5, leading=19, textColor=INK)
    s["body"] = ParagraphStyle("b", fontName=JP, fontSize=9.2, leading=15.5, textColor=INK, spaceAfter=4)
    s["soft"] = ParagraphStyle("sf", fontName=JP, fontSize=9.2, leading=15.5, textColor=SOFT, spaceAfter=4)
    s["note"] = ParagraphStyle("nt", fontName=JP, fontSize=8.2, leading=13.5, textColor=FAINT, spaceAfter=3)
    s["li"] = ParagraphStyle("li", fontName=JP, fontSize=9.2, leading=15.5, textColor=INK, leftIndent=10, bulletIndent=2, spaceAfter=2.5, bulletFontName=JP)
    s["tcell"] = ParagraphStyle("tc", fontName=JP, fontSize=8.3, leading=12.8, textColor=INK)
    s["tcell_c"] = ParagraphStyle("tcc", fontName=JP, fontSize=8.3, leading=12.8, textColor=INK, alignment=TA_CENTER)
    s["tcell_r"] = ParagraphStyle("tcr", fontName=JP, fontSize=8.3, leading=12.8, textColor=INK, alignment=TA_RIGHT)
    s["thead"] = ParagraphStyle("th", fontName=JP, fontSize=8.3, leading=12.5, textColor=SOFT)
    s["thead_c"] = ParagraphStyle("thc", fontName=JP, fontSize=8.3, leading=12.5, textColor=SOFT, alignment=TA_CENTER)
    s["kpi_lbl"] = ParagraphStyle("kl", fontName=JP, fontSize=8.4, leading=12, textColor=SOFT, alignment=TA_CENTER)
    s["kpi_num"] = ParagraphStyle("kn", fontName=JP, fontSize=19, leading=23, textColor=INK, alignment=TA_CENTER)
    s["kpi_sub"] = ParagraphStyle("ks", fontName=JP, fontSize=7.8, leading=11.5, textColor=FAINT, alignment=TA_CENTER)
    s["ans"] = ParagraphStyle("an", fontName=JP, fontSize=11, leading=18, textColor=INK)
    return s

S = styles()

def h1(text):
    t = Table([[Paragraph(text, S["h1"])]], colWidths=[CW], style=TableStyle([
        ("LINEBEFORE", (0, 0), (0, 0), 3, PRIMARY), ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    t.spaceBefore, t.spaceAfter = 14, 7
    t.keepWithNext = True
    return t

def li(text, style="li"):
    return Paragraph(text, S[style], bulletText="・")

def tbl(headers, rows, widths, align=None, hl_rows=(), head_center=(), row_colors=None):
    align = align or ["l"] * len(widths)
    data = []
    if headers:
        data.append([Paragraph(h, S["thead_c"] if i in head_center else S["thead"]) for i, h in enumerate(headers)])
    for r in rows:
        row = []
        for i, cval in enumerate(r):
            stl = {"l": "tcell", "c": "tcell_c", "r": "tcell_r"}[align[i]]
            row.append(Paragraph(str(cval), S[stl]))
        data.append(row)
    stl = [("GRID", (0, 0), (-1, -1), 0.6, LINE_C), ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
           ("TOPPADDING", (0, 0), (-1, -1), 4.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
           ("LEFTPADDING", (0, 0), (-1, -1), 6), ("RIGHTPADDING", (0, 0), (-1, -1), 6)]
    if headers:
        stl.append(("BACKGROUND", (0, 0), (-1, 0), CANVAS))
    for hr in hl_rows:
        stl.append(("BACKGROUND", (0, hr), (-1, hr), HexColor("#fdf2f8")))
    if row_colors:
        for ri, col in row_colors:
            stl.append(("BACKGROUND", (0, ri), (-1, ri), col))
    t = Table(data, colWidths=widths, style=TableStyle(stl), repeatRows=1 if headers else 0)
    t.spaceBefore, t.spaceAfter = 4, 9
    return t

def callout(text, bg=WARN_BG, fg=WARN):
    p = ParagraphStyle("co", fontName=JP, fontSize=8.7, leading=14.5, textColor=fg)
    t = Table([[Paragraph(text, p)]], colWidths=[CW], style=TableStyle([
        ("BACKGROUND", (0, 0), (-1, -1), bg), ("LEFTPADDING", (0, 0), (-1, -1), 10),
        ("RIGHTPADDING", (0, 0), (-1, -1), 10), ("TOPPADDING", (0, 0), (-1, -1), 7),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 7)]))
    t.spaceBefore, t.spaceAfter = 5, 8
    return t

def kpi_cards(cards):
    """cards: [(上ラベル, 大きい数字, 下注記, 枠色)]"""
    cells = []
    for (lbl, num, sub, col) in cards:
        inner = Table([[Paragraph(lbl, S["kpi_lbl"])], [Paragraph(num, S["kpi_num"])], [Paragraph(sub, S["kpi_sub"])]],
                      colWidths=[(CW - 12) / len(cards)],
                      style=TableStyle([("TOPPADDING", (0, 0), (-1, -1), 1), ("BOTTOMPADDING", (0, 0), (-1, -1), 1),
                                        ("LEFTPADDING", (0, 0), (-1, -1), 4), ("RIGHTPADDING", (0, 0), (-1, -1), 4)]))
        cells.append(inner)
    t = Table([cells], colWidths=[(CW) / len(cards)] * len(cards),
              style=TableStyle([("BOX", (0, 0), (-1, -1), 0.8, LINE_C),
                                ("INNERGRID", (0, 0), (-1, -1), 0.8, LINE_C),
                                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                                ("TOPPADDING", (0, 0), (-1, -1), 9), ("BOTTOMPADDING", (0, 0), (-1, -1), 9)]))
    t.spaceBefore, t.spaceAfter = 4, 10
    return t


class StepChart(Flowable):
    """月間通数 → 月額固定費 の階段グラフ。
    横軸は区間ごとに等間隔（区分が狭くても読めるように）。"""
    # (下限, 上限, 月額, プラン名)
    SEGS = [(0, 200, 0, "コミュニケーション 0円"),
            (200, 5000, 5000, "ライト 5,000円"),
            (5000, 30000, 15000, "スタンダード 15,000円"),
            (30000, 45000, None, "＋1通3円の従量")]

    def __init__(self, width, height, markers=()):
        super().__init__()
        self.width = width; self.height = height; self.markers = markers
        self.xmax = self.SEGS[-1][1]
    def wrap(self, aw, ah): return (self.width, self.height)

    def _fx(self, v):
        """通数 → 0..1 の位置（区間等間隔）"""
        n = len(self.SEGS)
        for i, (lo, hi, fee, name) in enumerate(self.SEGS):
            if v <= hi or i == n - 1:
                frac = 0 if hi == lo else (min(v, hi) - lo) / (hi - lo)
                return (i + frac) / n
        return 1.0

    def draw(self):
        c = self.canv
        pad_l = 23 * mm; pad_b = 15 * mm; pad_t = 11 * mm; pad_r = 6 * mm
        gw = self.width - pad_l - pad_r; gh = self.height - pad_b - pad_t
        ymax = 15000 + (self.xmax - 30000) * EXTRA_UNIT
        ymax = math.ceil(ymax / 10000) * 10000
        def X(v): return pad_l + gw * self._fx(v)
        def Y(v): return pad_b + gh * (v / ymax)
        c.setFont(JP, 7)
        v = 0
        while v <= ymax:
            c.setStrokeColor(LINE_C); c.setLineWidth(0.5); c.line(pad_l, Y(v), pad_l + gw, Y(v))
            c.setFillColor(FAINT); c.drawRightString(pad_l - 2.5 * mm, Y(v) - 2, f"{int(v):,}")
            v += 10000
        # 区間の区切り（薄い縦線）
        for i in range(1, len(self.SEGS)):
            xs = pad_l + gw * (i / len(self.SEGS))
            c.setStrokeColor(LINE_C); c.setLineWidth(0.5)
            c.line(xs, pad_b, xs, pad_b + gh)
        # 階段本体
        c.setLineWidth(2.2)
        prev_y = None
        for (x0, x1, fee, name) in self.SEGS[:3]:
            y = Y(fee)
            c.setStrokeColor(LG)
            if prev_y is not None:
                c.line(X(x0), prev_y, X(x0), y)
            c.line(X(x0), y, X(x1), y)
            prev_y = y
        # 従量部分
        c.setStrokeColor(LG_DARK); c.setLineWidth(2.2)
        c.line(X(30000), Y(15000), X(self.xmax), Y(15000 + (self.xmax - 30000) * EXTRA_UNIT))
        # プラン名ラベル（各区間の中央上）
        c.setFont(JP, 7.0)
        for i, (x0, x1, fee, name) in enumerate(self.SEGS):
            if fee is None:
                # 従量部分は右肩上がりの線と重ならないよう、区間の右下に置く
                cx = pad_l + gw * ((i + 0.72) / len(self.SEGS))
                ytxt = Y(15000) + 3 * mm
                c.setFillColor(LG_DARK)
            else:
                cx = pad_l + gw * ((i + 0.5) / len(self.SEGS))
                ytxt = Y(fee) + 2.4 * mm
                c.setFillColor(SOFT)
            c.drawCentredString(cx, ytxt, name)
        # 軸
        c.setStrokeColor(SOFT); c.setLineWidth(0.8); c.line(pad_l, pad_b, pad_l + gw, pad_b)
        c.setFont(JP, 7); c.setFillColor(FAINT)
        for xv in [200, 5000, 30000]:
            c.drawCentredString(X(xv), pad_b - 4.5 * mm, f"{xv:,}通")
        c.setFillColor(SOFT); c.setFont(JP, 7.5)
        c.drawCentredString(pad_l + gw / 2, pad_b - 9.8 * mm, "1ヶ月に送るLINE通知の通数")
        c.saveState(); c.setFillColor(SOFT); c.setFont(JP, 7.5)
        c.translate(3.5 * mm, pad_b + gh / 2); c.rotate(90)
        c.drawCentredString(0, 0, "月額固定費（円・税別）"); c.restoreState()
        # 想定位置のマーカー
        for idx, (mv, mlabel) in enumerate(self.markers):
            x = X(mv)
            c.setStrokeColor(PRIMARY); c.setLineWidth(1.0); c.setDash(2, 2)
            c.line(x, pad_b, x, pad_b + gh + 1 * mm); c.setDash()
            c.setFillColor(PRIMARY_STRONG); c.setFont(JP, 6.8)
            dy = gh + 3.2 * mm if idx % 2 == 0 else gh + 7.2 * mm
            c.drawCentredString(x, pad_b + dy, mlabel)


class BarChart(Flowable):
    def __init__(self, width, height, categories, series, ylabel=""):
        super().__init__()
        self.width = width; self.height = height
        self.categories = categories; self.series = series; self.ylabel = ylabel
    def wrap(self, aw, ah): return (self.width, self.height)
    def draw(self):
        c = self.canv
        pad_l = 23 * mm; pad_b = 14 * mm; pad_t = 10 * mm; pad_r = 4 * mm
        gw = self.width - pad_l - pad_r; gh = self.height - pad_b - pad_t
        allv = [v for (_, vals, _) in self.series for v in vals]
        vmax = max(allv) or 1
        exp = math.floor(math.log10(vmax)); step = 10 ** exp
        if vmax / step > 5: step *= 2
        elif vmax / step < 2: step /= 2
        top = math.ceil(vmax / step) * step; nst = int(round(top / step))
        c.setFont(JP, 7)
        for i in range(nst + 1):
            v = step * i; y = pad_b + gh * (v / top)
            c.setStrokeColor(LINE_C); c.setLineWidth(0.5); c.line(pad_l, y, pad_l + gw, y)
            c.setFillColor(FAINT); c.drawRightString(pad_l - 2.5 * mm, y - 2, f"{int(v):,}")
        if self.ylabel:
            c.saveState(); c.setFillColor(SOFT); c.setFont(JP, 7.5)
            c.translate(3.5 * mm, pad_b + gh / 2); c.rotate(90)
            c.drawCentredString(0, 0, self.ylabel); c.restoreState()
        n = len(self.categories); ns = len(self.series)
        slot = gw / n; bw = slot * 0.58 / ns
        for ci in range(n):
            cx = pad_l + slot * ci + slot / 2
            for si, (_, vals, col) in enumerate(self.series):
                v = vals[ci]; bh = gh * (v / top)
                bx = cx - (bw * ns) / 2 + bw * si
                c.setFillColor(col); c.rect(bx, pad_b, bw, bh, stroke=0, fill=1)
                # 値ラベルは系列ごとに高さをずらして重なりを避ける
                c.setFillColor(col); c.setFont(JP, 5.9)
                dy = 1.3 * mm if si == 0 else 4.6 * mm
                c.drawCentredString(bx + bw / 2, pad_b + bh + dy, f"{int(v):,}")
            c.setFillColor(INK); c.setFont(JP, 7.2)
            c.drawCentredString(cx, pad_b - 5 * mm, self.categories[ci])
        c.setStrokeColor(SOFT); c.setLineWidth(0.8); c.line(pad_l, pad_b, pad_l + gw, pad_b)
        lx = pad_l; ly = self.height - pad_t + 3 * mm
        c.setFont(JP, 7.2)
        for (label, _, col) in self.series:
            c.setFillColor(col); c.rect(lx, ly, 3.2 * mm, 3.2 * mm, stroke=0, fill=1)
            c.setFillColor(SOFT); c.drawString(lx + 4.4 * mm, ly + 0.5 * mm, label)
            lx += 4.4 * mm + pdfmetrics.stringWidth(label, JP, 7.2) + 8 * mm


def make_doc(path, footer):
    def on_page(canv, doc):
        canv.saveState()
        if doc.page > 1:
            canv.setStrokeColor(LINE_C); canv.setLineWidth(0.6); canv.line(M, 13 * mm, W - M, 13 * mm)
            canv.setFont(JP, 7.5); canv.setFillColor(FAINT)
            canv.drawString(M, 9 * mm, footer); canv.drawRightString(W - M, 9 * mm, f"{doc.page - 1}")
        canv.restoreState()
    doc = BaseDocTemplate(path, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=16 * mm, bottomMargin=18 * mm)
    doc.addPageTemplates([PageTemplate(id="p", frames=[Frame(M, 18 * mm, CW, H - 34 * mm, id="main",
                  leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)], onPage=on_page)])
    return doc


def build(path):
    doc = make_doc(path, "LINE通知の月額固定費インパクト｜サツコイ！（仮）")
    st = []

    # ── 表紙 ──
    st.append(Spacer(1, 48 * mm))
    if os.path.exists(LOGO):
        img = Image(LOGO, width=26 * mm, height=26 * mm); img.hAlign = "CENTER"; st.append(img)
    st.append(Spacer(1, 9 * mm))
    st.append(Paragraph("LINE通知を追加すると<br/>月額固定費はいくら変わるか", S["cover_title"]))
    st.append(Spacer(1, 4 * mm))
    st.append(Paragraph("サツコイ！（仮）／LINE連携の費用インパクト試算", S["cover_sub"]))
    st.append(Spacer(1, 38 * mm))
    st.append(Paragraph("2026年8月　発行：ViFight<br/>料金は2026年8月時点の調査にもとづく（税別）", S["cover_meta"]))
    st.append(PageBreak())

    # ── 1. 結論 ──
    std = SCENARIOS[0]
    pm_std = per_member_msgs(*std[1:])
    cap_free = int(200 / pm_std); cap_light = int(5000 / pm_std); cap_std = int(30000 / pm_std)

    st.append(h1("1. 結論（ひと目で）"))
    st.append(Paragraph("<b>LINEログインの追加は月額0円です。</b>月額固定費が増えるのは「LINE通知（配信）」の部分だけで、"
                        "LINE公式アカウントのプラン料金として発生します。金額は<b>会員数と配信通数</b>で決まり、"
                        "下の3段階のいずれかになります。", S["ans"]))
    st.append(kpi_cards([
        ("コミュニケーション", "月 0円", f"200通まで／目安 約{cap_free:,}人", LG),
        ("ライト", "月 5,000円", f"5,000通まで／目安 約{cap_light:,}人", LG),
        ("スタンダード", "月 15,000円", f"30,000通まで／目安 約{cap_std:,}人", LG),
    ]))
    st.append(Paragraph("※ 税別。「目安◯人」は下記【標準】シナリオ（1人あたり月 約"
                        f"{pm_std:.1f}通）で換算した会員数です。", S["note"]))
    st.append(Spacer(1, 1 * mm))
    st.append(StepChart(CW, 66 * mm,
                        markers=[(int(pm_std * 300), "会員300人"), (int(pm_std * 1000), "会員1,000人")]))
    st.append(Paragraph("※ 横軸は見やすさのため、区間ごとに等間隔で表示しています。", S["note"]))
    st.append(Spacer(1, 2 * mm))

    # 会員数 → 月額 のクイック表（結論ページに配置）
    quick_rows = []
    for mcount in [100, 300, 500, 1000, 2000]:
        row = [f"{mcount:,}人"]
        for (nm, a, r, c_, n) in SCENARIOS:
            pm = per_member_msgs(a, r, c_, n)
            msgs = int(round(pm * mcount))
            pname, fee, over = plan_for(msgs)
            row.append(f"{fee:,}円")
        quick_rows.append(row)
    st.append(Paragraph("<b>会員数別のめやす（増える月額固定費）</b>", S["body"]))
    st.append(tbl(["会員数", "【標準】月額", "【活発】月額"], quick_rows,
                  [CW * 0.34, CW * 0.33, CW * 0.33], align=["c", "r", "r"], head_center=(0, 1, 2)))

    st.append(callout(
        "<b>要点</b>　サービス開始〜会員数百人の規模なら、増える月額固定費は <b>0円 または 5,000円</b> です。"
        "会員1,000人規模になるとスタンダード（15,000円）が必要になります。"
        "つまり「LINE通知を入れると急に高くなる」ということはなく、規模に応じて段階的に上がります。",
        bg=LG_SOFT, fg=HexColor("#0b6b34")))

    # ── 2. 何にお金がかかるのか ──
    st.append(PageBreak())
    st.append(h1("2. 何にお金がかかるのか（内訳）"))
    st.append(tbl(["項目", "費用", "説明"], [
        ["LINEでログイン<br/>（LINEログイン）", "<b>無料</b>", "利用に料金はかかりません（LINE公式ドキュメント記載）。"],
        ["通知を送る仕組み<br/>（Messaging API）", "<b>無料</b>", "API自体の利用料・初期費用はなく、費用はメッセージ通数のみに発生します。"],
        ["LINE公式アカウントの開設", "<b>無料</b>", "アカウント開設は無料。認証済アカウントの申請・利用も無料です。"],
        ["LINE公式アカウントの<br/>プラン料金", "<b>0円／5,000円<br/>／15,000円</b>", "<b>ここだけが月額固定費として増える部分です。</b>プランごとに月の無料通数が決まっています。"],
        ["追加メッセージ（従量）", "<b>1通 3円</b>", "スタンダードプランのみ、無料通数を超えた分を追加できます（50,000通までの単価）。"],
    ], [CW * 0.24, CW * 0.19, CW * 0.57], align=["l", "c", "l"]))

    st.append(Paragraph("<b>プランの比較</b>", S["body"]))
    st.append(tbl(["プラン", "月額（税別）", "月の無料通数", "無料通数を超えたら"], [
        ["コミュニケーション", "0円", "200通", "配信できない（追加購入不可）"],
        ["ライト", "5,000円", "5,000通", "配信できない（追加購入不可）"],
        ["スタンダード", "15,000円", "30,000通", "1通3円〜で追加配信できる"],
    ], [CW * 0.26, CW * 0.18, CW * 0.2, CW * 0.36], align=["l", "r", "r", "l"], hl_rows=(3,)))
    st.append(callout(
        "<b>重要な注意</b>　コミュニケーション／ライトの2プランは、月の途中で無料通数を使い切ると"
        "<b>その月はもう配信できません（翌月まで通知が止まります）</b>。"
        "「デート日程が確定しました」のような“届かないと困る通知”を扱うため、"
        "会員数が増えてきたら余裕を持ってスタンダードへ移行することを推奨します。"))

    st.append(Paragraph("<b>通数の数え方</b>", S["body"]))
    st.append(li("通数は「<b>配信回数 × 送信した人数</b>」で数えます（例：100人に一斉配信すると100通）。"))
    st.append(li("<b>1回の配信にメッセージを複数入れても「1通」です。</b>吹き出しの数は通数に影響しません"
                 "（1回の配信に最大3つの吹き出しをまとめられます）。"))
    st.append(li("会員からの問い合わせに自動で返す「応答メッセージ」や、友だち追加時の「あいさつメッセージ」、"
                 "1対1のチャットは<b>通数にカウントされません</b>（無料）。"))
    st.append(li("このアプリの通知はすべて運営側から送る配信なので、通数にカウントされます。"))

    # ── 3. このアプリが送る通知 ──
    st.append(PageBreak())
    st.append(h1("3. このアプリが送るLINE通知の内訳"))
    st.append(Paragraph("現在のアプリの実装にもとづく、1件あたりの配信通数です。「デート日程の確定」と「前日リマインド」は"
                        "<b>お二人ともに送る</b>ため2通になります。", S["body"]))
    st.append(tbl(["通知のきっかけ", "送る相手", "通数"], [
        ["デートのお申込みが届いた", "申し込まれた方", "1通"],
        ["マッチが成立した", "申し込んだ方", "1通"],
        ["デート日程が確定した", "お二人とも", "2通"],
        ["デート前日のリマインド", "お二人とも", "2通"],
        ["運営からのお知らせ（一斉配信）", "全会員", "会員数 × 1通"],
    ], [CW * 0.46, CW * 0.3, CW * 0.24], align=["l", "l", "c"], hl_rows=(5,)))
    st.append(callout(
        "<b>コストを左右する最大の要因は「運営からのお知らせ（一斉配信）」です。</b>"
        "たとえば会員1,000人に月4回配信すると、それだけで4,000通になります。"
        "個別通知（申込・確定など）は会員数の割に通数が伸びにくいのに対し、一斉配信は会員数にそのまま比例します。",
        bg=INFO_BG, fg=INFO))

    st.append(Paragraph("<b>月間通数の計算式</b>", S["body"]))
    st.append(Paragraph(
        "月間通数 ＝ 申込数 ×1 ＋ マッチ成立数 ×1 ＋ 日程確定数 ×4（確定2通＋リマインド2通） ＋ お知らせ回数 × 会員数",
        S["soft"]))
    st.append(Paragraph("<b>試算に用いた前提（仮定）</b>　実績が出れば差し替えて再計算できます。", S["body"]))
    st.append(tbl(["シナリオ", "1人あたり月の申込数", "承諾率", "日程確定率", "お知らせ配信", "1人あたり月間通数"], [
        [nm, f"{a}件", f"{int(r*100)}%", f"{int(c*100)}%", f"月{n}回", f"約{per_member_msgs(a,r,c,n):.1f}通"]
        for (nm, a, r, c, n) in SCENARIOS
    ], [CW * 0.13, CW * 0.22, CW * 0.13, CW * 0.15, CW * 0.15, CW * 0.22],
        align=["c", "c", "c", "c", "c", "c"], head_center=(0, 1, 2, 3, 4, 5)))
    st.append(Paragraph("※ 上記の「申込数・承諾率・確定率・配信回数」は実績がないため<b>仮定値</b>です。"
                        "運用開始後の実データで置き換えることで、より正確な試算になります。", S["note"]))

    # ── 4. 会員数別シミュレーション ──
    st.append(PageBreak())
    st.append(h1("4. 会員数別の月額固定費シミュレーション"))
    rows = []
    fees_by_scn = {}
    for (nm, a, r, c, n) in SCENARIOS:
        pm = per_member_msgs(a, r, c, n)
        fees = []
        for mcount in MEMBER_STEPS:
            msgs = int(round(pm * mcount))
            pname, fee, over = plan_for(msgs)
            fees.append(fee)
        fees_by_scn[nm] = fees
    for i, mcount in enumerate(MEMBER_STEPS):
        row = [f"{mcount:,}人"]
        for (nm, a, r, c, n) in SCENARIOS:
            pm = per_member_msgs(a, r, c, n)
            msgs = int(round(pm * mcount))
            pname, fee, over = plan_for(msgs)
            row.append(f"{msgs:,}通")
            row.append(f"{pname}<br/><b>{fee:,}円</b>")
        rows.append(row)
    st.append(tbl(["会員数", "【標準】月間通数", "【標準】プラン／月額", "【活発】月間通数", "【活発】プラン／月額"],
                  rows, [CW * 0.12, CW * 0.19, CW * 0.26, CW * 0.19, CW * 0.24],
                  align=["c", "r", "c", "r", "c"], head_center=(0, 1, 2, 3, 4)))
    st.append(Paragraph("※ 税別。「活発」は申込・お知らせ配信ともに多いケースです。"
                        "スタンダードの30,000通を超えた分は1通3円で加算しています。", S["note"]))
    st.append(Spacer(1, 2 * mm))
    st.append(BarChart(CW, 62 * mm, [f"{m:,}" for m in MEMBER_STEPS],
                       [("標準", fees_by_scn["標準"], LG), ("活発", fees_by_scn["活発"], PRIMARY)],
                       ylabel="月額固定費（円・税別）"))
    st.append(Paragraph("横軸：会員数（人）", S["note"]))

    # ── 5. コストを抑える ──
    st.append(PageBreak())
    st.append(h1("5. 費用を抑えるための運用の工夫"))
    st.append(li("<b>一斉配信はメール・アプリ内通知を主に使う。</b>キャンペーンなどの一斉お知らせをLINEから"
                 "メール・アプリ内に寄せるだけで、通数を大きく減らせます（上の表の差がそのまま効きます）。"))
    st.append(li("<b>LINEは“届かないと困る通知”に絞る。</b>申込・マッチ成立・日程確定・前日リマインドなど、"
                 "取引に直結するものだけLINEにすると、費用対効果が高くなります。"))
    st.append(li("<b>会員が受け取る通知を選べるようにする。</b>本アプリは通知設定で項目ごとにLINE通知を"
                 "オン・オフできる仕様のため、実際の配信数は試算より少なくなる可能性があります。"))
    st.append(li("<b>1回の配信にまとめる。</b>吹き出しを複数入れても1通なので、"
                 "同じ相手に短時間で複数回送るより、1回の配信にまとめるほうが有利です。"))

    st.append(h1("6. 今後の料金改定について"))
    st.append(Paragraph("<b>2026年10月ごろに、追加メッセージ（スタンダードプランの従量部分）の料金改定が予定されています。</b>"
                        "改定後の具体的な単価については、本書作成時点でLINEヤフー公式サイトの記載を直接確認できていないため、"
                        "本書には金額を記載していません。ご契約前に公式サイトで最新の内容をご確認ください。", S["body"]))
    st.append(callout(
        "<b>本サービスへの影響は小さいと考えられます。</b>改定の対象は「無料通数を超えた分の追加メッセージ」の単価であり、"
        "各プランの<b>月額固定費（0円／5,000円／15,000円）と無料通数が変わるという情報は確認されていません</b>。"
        "本サービスの想定通数は、改定で単価が変わるとされる規模（数十万通）よりはるかに小さいため、"
        "実質的な影響はほとんどない見込みです。",
        bg=INFO_BG, fg=INFO))

    # ── 7. 前提と注意 ──
    st.append(PageBreak())
    st.append(h1("7. 前提・注意事項"))
    st.append(li("本書の料金は<b>2026年8月時点</b>で公開されている情報にもとづくものです。金額はすべて<b>税別</b>です"
                 "（消費税10%として計算すると、5,000円→5,500円、15,000円→16,500円。この税込額は当社の計算値です）。"))
    st.append(li("<b>ご契約前に、LINEヤフー公式サイトで最新の料金を必ずご確認ください。</b>"
                 "特に追加メッセージの料金は改定が予定されています（第6章）。"))
    st.append(li("本書はLINE関連の費用のみを扱っています。サーバー（GCP）費用・ドメイン費用などは含みません。"))
    st.append(li("通数の試算に用いた活動量（申込数・承諾率・配信回数）は<b>仮定値</b>です。運用実績が出た段階で"
                 "再計算することをおすすめします。"))
    st.append(li("LINE公式アカウントは<b>お客様名義での開設</b>が必要です（申請手順はViFightが支援します）。"))

    st.append(h1("8. 要確認事項"))
    st.append(tbl(["項目", "内容", "状態"], [
        ["想定会員数", "初年度に想定する会員数（試算を1つに絞る場合に必要）。", "要確認"],
        ["お知らせ配信の頻度", "運営からの一斉お知らせを月に何回、どの手段で送るか。", "要確認"],
        ["LINE通知の対象範囲", "どの通知をLINEで送るか（現状は申込・マッチ・確定・リマインドを想定）。", "要確認"],
        ["最新料金の確認", "ご契約時点のLINE公式サイトでの最終確認。", "契約時"],
    ], [CW * 0.22, CW * 0.62, CW * 0.16]))

    st.append(Spacer(1, 3 * mm))
    st.append(Paragraph("参考：本書の料金情報はLINEヤフー公式の案内および各種公開情報（2026年8月時点）を"
                        "突き合わせて作成しています。", S["note"]))

    doc.build(st)


OUT = "/tmp/claude-0/-home-user-satukoi/f71acb11-45a0-5a58-86eb-7d20d17701c9/scratchpad/pdfs"
os.makedirs(OUT, exist_ok=True)
p = os.path.join(OUT, "サツコイ_LINE通知の月額費用.pdf")
build(p)
print("done", os.path.getsize(p), "bytes")
for (nm, a, r, c, n) in SCENARIOS:
    pm = per_member_msgs(a, r, c, n)
    print(f"{nm}: {pm:.2f}通/人月  → 無料枠上限 {int(200/pm)}人 / ライト {int(5000/pm)}人 / スタンダード {int(30000/pm)}人")
