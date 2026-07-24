# -*- coding: utf-8 -*-
"""サツコイ！ 制作工程表 PDF（詳細版：サブタスク・担当・工数・DoD付き）"""
import os
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

JP = "JPGothic"
pdfmetrics.registerFont(TTFont(JP, "/usr/share/fonts/opentype/ipaexfont-gothic/ipaexg.ttf"))

INK = HexColor("#14161c"); SOFT = HexColor("#626875"); FAINT = HexColor("#9aa0ab")
LINE = HexColor("#e8eaee"); CANVAS = HexColor("#f7f7f8")
PRIMARY = HexColor("#ee3f9b"); PRIMARY_STRONG = HexColor("#d31f80"); WHITE = HexColor("#ffffff")

C_PREP = HexColor("#8b93a3"); C_EXT = HexColor("#5b6472"); C_DEV = HexColor("#ee3f9b")
C_QA = HexColor("#22a06b"); C_REL = HexColor("#e6902e")
CAT = {"準備": C_PREP, "外部": C_EXT, "開発": C_DEV, "品質": C_QA, "リリース": C_REL}

LOGO = "/home/user/satukoi/public/logo.png"
W, H = A4; M = 18 * mm; CW = W - 2 * M

def styles():
    s = {}
    s["cover_title"] = ParagraphStyle("ct", fontName=JP, fontSize=23, leading=31, textColor=INK, alignment=TA_CENTER)
    s["cover_sub"] = ParagraphStyle("cs", fontName=JP, fontSize=12, leading=20, textColor=SOFT, alignment=TA_CENTER)
    s["cover_meta"] = ParagraphStyle("cm", fontName=JP, fontSize=9, leading=15, textColor=FAINT, alignment=TA_CENTER)
    s["h1"] = ParagraphStyle("h1", fontName=JP, fontSize=13.5, leading=19, textColor=INK)
    s["body"] = ParagraphStyle("b", fontName=JP, fontSize=9.2, leading=15.5, textColor=INK, spaceAfter=4)
    s["soft"] = ParagraphStyle("sf", fontName=JP, fontSize=9.2, leading=15.5, textColor=SOFT, spaceAfter=4)
    s["note"] = ParagraphStyle("nt", fontName=JP, fontSize=8.2, leading=13.5, textColor=FAINT, spaceAfter=3)
    s["li"] = ParagraphStyle("li", fontName=JP, fontSize=9.2, leading=15.5, textColor=INK, leftIndent=10, bulletIndent=2, spaceAfter=2.5, bulletFontName=JP)
    s["tcell"] = ParagraphStyle("tc", fontName=JP, fontSize=8.3, leading=12.8, textColor=INK)
    s["tcell_soft"] = ParagraphStyle("tcs", fontName=JP, fontSize=8.3, leading=12.8, textColor=SOFT)
    s["thead"] = ParagraphStyle("th", fontName=JP, fontSize=8.3, leading=12.5, textColor=SOFT)
    # 詳細ブロック用
    s["blk"] = ParagraphStyle("blk", fontName=JP, fontSize=10, leading=14, textColor=INK)
    s["meta"] = ParagraphStyle("meta", fontName=JP, fontSize=8, leading=12, textColor=PRIMARY_STRONG, alignment=TA_RIGHT)
    s["sub"] = ParagraphStyle("sub", fontName=JP, fontSize=8.6, leading=13.5, textColor=INK, leftIndent=10, bulletIndent=2, spaceAfter=1.5, bulletFontName=JP)
    s["dod"] = ParagraphStyle("dod", fontName=JP, fontSize=8.2, leading=13, textColor=SOFT, leftIndent=2, spaceBefore=1.5)
    return s

S = styles()

def h1(text):
    t = Table([[Paragraph(text, S["h1"])]], colWidths=[CW], style=TableStyle([
        ("LINEBEFORE", (0, 0), (0, 0), 3, PRIMARY), ("LEFTPADDING", (0, 0), (-1, -1), 9),
        ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    t.spaceBefore, t.spaceAfter = 15, 7
    return t

def li(text, style="li"):
    return Paragraph(text, S[style], bulletText="・")

def tbl(headers, rows, widths, soft_cols=(), hl_rows=(), align_r=()):
    data = []
    if headers:
        data.append([Paragraph(h, S["thead"]) for h in headers])
    for r in rows:
        data.append([Paragraph(str(c), S["tcell_soft"] if i in soft_cols else S["tcell"]) for i, c in enumerate(r)])
    stl = [("GRID", (0, 0), (-1, -1), 0.6, LINE), ("VALIGN", (0, 0), (-1, -1), "TOP"),
           ("TOPPADDING", (0, 0), (-1, -1), 4.5), ("BOTTOMPADDING", (0, 0), (-1, -1), 4.5),
           ("LEFTPADDING", (0, 0), (-1, -1), 7), ("RIGHTPADDING", (0, 0), (-1, -1), 7)]
    if headers:
        stl.append(("BACKGROUND", (0, 0), (-1, 0), CANVAS))
    for hr in hl_rows:
        stl.append(("BACKGROUND", (0, hr), (-1, hr), HexColor("#fdf2f8")))
    for c in align_r:
        stl.append(("ALIGN", (c, 0), (c, -1), "RIGHT"))
    t = Table(data, colWidths=widths, style=TableStyle(stl), repeatRows=1 if headers else 0)
    t.spaceBefore, t.spaceAfter = 4, 9
    return t

# ── Ganttデータ ──
NWEEKS = 8
TASKS = [
    ("1  キックオフ・要件／デザイン確定", 1, 1, "準備"),
    ("2  外部審査申請 Stripe・LINE（お客様手配）", 1, 3, "外部"),
    ("3  法務・コンプライアンス対応（並行）", 1, 4, "外部"),
    ("4  インフラ構築（GCP／CI・CD／監視・バックアップ）", 1, 3, "準備"),
    ("5  LINEログイン（LIFF）", 2, 3, "開発"),
    ("6  Stripe本決済（登録・都度課金・違約金・Webhook）", 3, 6, "開発"),
    ("7  書類アップロード本運用（署名付きURL）", 3, 5, "開発"),
    ("8  LINE通知・メール配信", 4, 6, "開発"),
    ("9  自動処理基盤（自動解除・更新課金・アンケート）", 5, 6, "開発"),
    ("10  会員機能の本番化（スタブ→実接続）", 2, 6, "開発"),
    ("11  管理画面の本番化", 3, 6, "開発"),
    ("12  AIアドバイザー・相性推薦 v1（ルールベース）", 5, 6, "開発"),
    ("13  コンテンツ投入（規約反映・FAQ・店舗）", 5, 6, "開発"),
    ("14  自動テスト・CI整備（工程横断）", 2, 6, "開発"),
    ("15  結合／回帰テスト・セキュリティ確認", 6, 7, "品質"),
    ("16  お客様検収・修正対応", 7, 7, "品質"),
    ("17  予備（バッファ）", 7, 8, "バッファ"),
    ("18  リリース準備・本番決済疎通・デプロイ", 8, 8, "リリース"),
    ("19  納品・引き渡し・運用開始（初期サポート）", 8, 8, "リリース"),
]
MILES = [(6, "β"), (8, "納品")]
MILE_CAPS = {6: "1.5ヶ月：β（限定公開）", 8: "2ヶ月：一般公開・納品"}

# ── 工程の詳細（no, 名称, 担当, 人日, 時期, サブタスク[], 完了条件） ──
DETAIL = [
    (1, "キックオフ・要件／デザイン確定", "PM・デザイン", 3, "W1",
     ["スコープ・優先順位の合意（プロトタイプをベースに差分を確定）",
      "画面・仕様の最終確認、デザイン（トークン・部品は実装済み）の確定",
      "品質基準・完了条件（DoD）の合意",
      "開発計画・環境・ブランチ運用・定例の設定"],
     "スコープ・仕様・DoDが文書化され、双方で合意している"),
    (2, "外部審査申請（Stripe・LINE）", "PM（お客様手配を支援）", 2, "W1–W3",
     ["Stripe本番審査の申請支援（事業内容・本人確認書類の準備）",
      "LINE公式アカウント開設・認証申請の支援",
      "LINE Login／Messaging API チャネルの作成、必要スコープ（メール取得等）の申請",
      "各審査の状況追跡"],
     "各申請が受理され、承認待ち／承認の状態が明確になっている"),
    (3, "法務・コンプライアンス対応", "PM＋外部専門家（ViFightが紹介・調整）", 4, "W1–W4",
     ["インターネット異性紹介事業の該当判断（「チャットなし」設計での回避可否）と必要時の届出",
      "利用規約・プライバシーポリシー・特定商取引法表記の整備（専門家）",
      "年齢確認方針の確定、決済・違約金・自動課金の規約反映",
      "機微な個人情報（身分証・独身証明・源泉徴収票）の取扱い方針"],
     "公開に必要な法的要件がクリア（または段取り確定）し、規約類が確定している"),
    (4, "インフラ構築", "インフラ", 8, "W1–W3",
     ["GCPプロジェクト・IAM・Secret Manager",
      "Cloud Run（本番／ステージング）、Cloud SQL（Private IP・接続プール・自動バックアップ）",
      "Cloud Storage（証明書類用プライベートバケット）",
      "CI・CD（型検査／Lint／テスト／ビルド／デプロイ／マイグレーション自動化）",
      "独自ドメイン・SSL、監視・エラー通知・アップタイム監視"],
     "ステージングが本番同等構成で稼働し、CIでデプロイ可能、監視・バックアップが有効"),
    (5, "LINEログイン（LIFF）", "バックエンド・フロントエンド", 5, "W2–W3",
     ["LINE Login の認可フロー（OAuth）実装、LIFF初期化・アプリ内起動対応",
      "LINE userId と会員の連携・新規登録導線",
      "既存メール認証との統合・アカウント紐付け、セッション発行・保護"],
     "LINEでログイン→会員として利用開始まで一気通貫、既存メール会員の連携も動作"),
    (6, "Stripe本決済", "バックエンド", 14, "W3–W6",
     ["登録時のカード登録（SetupIntent・有効性確認）＋不正／重複対策",
      "日程確定時の都度課金（PaymentIntent 5,500円）",
      "違約金のオフセッション請求・返金（キャンセル区分に連動）、更新料の自動課金",
      "Webhook受信（確定・失敗・返金・dispute）、冪等キーによる二重課金防止",
      "3DS（本人認証）・決済失敗時のリトライ処理"],
     "テストモードで全課金／返金／違約金／更新が正しく動作し整合、本番接続は審査承認後に切替可能"),
    (7, "書類アップロード本運用", "バックエンド・インフラ", 7, "W3–W5",
     ["プライベートバケットへの直アップロード（署名付きURL・V4）",
      "ファイル種別・サイズ・内容の検証",
      "提出→運営確認→承認→公開項目の解放フロー、男性の源泉徴収票必須の審査ルール",
      "保管・削除ポリシー（保持期間・アクセスログ）"],
     "会員が書類提出→運営が確認／承認→年収等が公開、書類は非公開で安全に保管される"),
    (8, "通知配信（LINE・メール）", "バックエンド", 7, "W4–W6",
     ["LINE Messaging API のpush配信（申込／マッチ／確定／リマインド）",
      "メール配信基盤＋ドメイン認証（SPF／DKIM／DMARC）",
      "通知テンプレート・文面、通知設定（LINE／メール／アプリ内の項目別）との連動",
      "配信失敗時のフォールバック"],
     "主要イベントで LINE／メール／アプリ内通知が設定どおり届く"),
    (9, "自動処理基盤（定期実行）", "バックエンド・インフラ", 5, "W5–W6",
     ["定期実行基盤（Cloud Scheduler等）の構築",
      "マッチ自動解除（7日／48時間ルール）、更新料の自動課金バッチ",
      "デート後アンケートの自動送信（2時間後）、各種リマインド",
      "失敗時の再試行・検知"],
     "各定期処理が指定タイミングで自動実行され、失敗が検知される"),
    (10, "会員機能の本番化", "フロントエンド・バックエンド", 12, "W2–W6",
     ["全画面のスタブを実データ／実APIに置換",
      "入力バリデーション・エラーハンドリング、異常系・境界値（期限切れ・ブロック・権限）",
      "申込〜マッチ〜日程調整〜デート〜アンケートの通し動作",
      "パフォーマンス・アクセシビリティの確認"],
     "主要フローが本番データで破綻なく通る"),
    (11, "管理画面の本番化", "フロントエンド・バックエンド", 10, "W3–W6",
     ["会員・書類の確認／承認／停止／退会の実運用機能",
      "マッチ・デート・店舗割当の管理、キャンセル・違約金・警告の管理",
      "通報・お問い合わせ対応、ギフト券発行・使用済み処理",
      "権限管理・操作の監査ログ"],
     "運営が日常業務を管理画面だけで回せる"),
    (12, "AIアドバイザー・相性推薦 v1", "バックエンド", 4, "W5–W6",
     ["ルールベースの相談導線（活動データに基づく助言）",
      "プロフィール項目に基づく相性表示（機械学習は行わない）",
      "文面のお客様監修反映、「AI」表記の適正化（優良誤認の回避）"],
     "相談・相性表示が実用レベルで動作し、表記が適正"),
    (13, "コンテンツ投入", "フロントエンド（お客様提供物を反映）", 2, "W5–W6",
     ["確定した規約・プライバシー・特商法・FAQの反映",
      "提携店データの登録、お知らせ・掲載文言の投入"],
     "公開に必要なコンテンツが揃い、正しく表示される"),
    (14, "自動テスト・CI整備", "バックエンド・QA", 10, "W2–W6",
     ["日程調整・キャンセル・決済判定など純粋ロジックの単体テスト",
      "主要フローのE2E（自動ブラウザテスト）",
      "CIでのテスト自動実行、カバレッジ基準の設定"],
     "主要ロジック・フローがテストで守られ、CIで自動検証される"),
    (15, "結合／回帰テスト・セキュリティ確認", "QA・バックエンド", 8, "W6–W7",
     ["決済＋通知＋書類の結合テスト、回帰テスト",
      "権限・認可・レート制限・入力の安全性確認、個人情報の取扱い確認",
      "主要デバイス・ブラウザの表示確認"],
     "重大不具合ゼロ、セキュリティの基本確認をクリア"),
    (16, "検収・修正対応", "PM・開発全員", 5, "W7",
     ["検収用チェックリストの提示、お客様検収",
      "指摘の分類（本フェーズ／次フェーズ）、修正・再確認"],
     "検収項目に合格し、指摘が反映されている"),
    (17, "予備（バッファ）", "—", 5, "W7–W8",
     ["審査遅延・検収手戻り・想定外事象の吸収"],
     "—"),
    (18, "リリース準備・本番デプロイ", "インフラ・バックエンド", 3, "W8",
     ["本番環境への切替・本番キー投入",
      "本番決済・LINE本番配信の疎通確認、データ最終確認",
      "ロールバック手順の確認、本番デプロイ"],
     "本番で主要フロー・実決済（審査承認済みの場合）が疎通する"),
    (19, "納品・引き渡し・運用開始", "PM", 2, "W8",
     ["ソース・環境・設定・ドキュメントの引き渡し",
      "管理画面の操作レクチャー、運用開始・初期サポート開始"],
     "お客様が運用を開始できる状態になっている"),
]
TOTAL_DAYS = sum(d[3] for d in DETAIL)

class Gantt(Flowable):
    def __init__(self, width, tasks, nweeks):
        super().__init__()
        self.width = width; self.tasks = tasks; self.nweeks = nweeks
        self.label_w = 66 * mm; self.header_h = 12 * mm; self.row_h = 6.7 * mm
        self.height = self.header_h + self.row_h * len(tasks) + 2 * mm
    def wrap(self, aw, ah):
        return (self.width, self.height)
    def draw(self):
        c = self.canv
        lw = self.label_w; tw = self.width - lw; ww = tw / self.nweeks
        top = self.height; grid_top = top - self.header_h; grid_bottom = 2 * mm
        for mi, (mx0, mx1, mlabel) in enumerate([(0, 4, "1ヶ月目"), (4, 8, "2ヶ月目")]):
            x0 = lw + ww * mx0
            c.setFillColor(CANVAS if mi % 2 == 0 else HexColor("#eef0f3"))
            c.rect(x0, top - 5 * mm, ww * (mx1 - mx0), 5 * mm, stroke=0, fill=1)
            c.setFillColor(SOFT); c.setFont(JP, 7.5)
            c.drawCentredString(x0 + ww * (mx1 - mx0) / 2, top - 3.6 * mm, mlabel)
        c.setFont(JP, 7.8)
        for w in range(self.nweeks):
            x0 = lw + ww * w
            c.setStrokeColor(LINE); c.setLineWidth(0.5); c.line(x0, grid_bottom, x0, grid_top)
            c.setFillColor(INK); c.drawCentredString(x0 + ww / 2, grid_top + 1.3 * mm, f"W{w+1}")
        c.setStrokeColor(LINE); c.line(lw + tw, grid_bottom, lw + tw, grid_top)
        c.setFillColor(SOFT); c.setFont(JP, 7.5); c.drawString(1.5 * mm, grid_top + 1.3 * mm, "工程")
        c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(0, grid_top, self.width, grid_top)
        for i, (name, s, e, cat) in enumerate(self.tasks):
            ry = grid_top - self.row_h * (i + 1)
            if i % 2 == 1:
                c.setFillColor(HexColor("#fafafb")); c.rect(0, ry, self.width, self.row_h, stroke=0, fill=1)
            c.setFillColor(INK); c.setFont(JP, 7.2); c.drawString(1.5 * mm, ry + self.row_h / 2 - 2.5, name)
            bx = lw + ww * (s - 1) + 1.2 * mm; bw = ww * (e - s + 1) - 2.4 * mm
            by = ry + self.row_h / 2 - 1.9 * mm; bh = 3.8 * mm
            if cat == "バッファ":
                c.setStrokeColor(FAINT); c.setLineWidth(0.8); c.setDash(1.6, 1.6)
                c.roundRect(bx, by, bw, bh, 1.4 * mm, stroke=1, fill=0); c.setDash()
                c.setFillColor(FAINT); c.setFont(JP, 6.2); c.drawCentredString(bx + bw / 2, by + bh / 2 - 2, "予備")
            else:
                c.setFillColor(CAT[cat]); c.roundRect(bx, by, bw, bh, 1.4 * mm, stroke=0, fill=1)
        c.setStrokeColor(LINE); c.setLineWidth(0.6); c.line(0, grid_bottom, self.width, grid_bottom)
        for (wk, label) in MILES:
            x = lw + ww * wk
            c.setStrokeColor(PRIMARY_STRONG); c.setLineWidth(1.1); c.setDash(2, 2)
            c.line(x, grid_bottom, x, grid_top + 4.2 * mm); c.setDash()
            c.setFillColor(PRIMARY_STRONG); dy = grid_top + 5.2 * mm; r = 1.5 * mm
            c.saveState(); c.translate(x, dy); c.rotate(45); c.rect(-r, -r, 2 * r, 2 * r, stroke=0, fill=1); c.restoreState()
            c.setFont(JP, 7.0); c.drawRightString(x - 2.4 * mm, grid_top + 4.4 * mm, MILE_CAPS[wk])

def legend():
    items = [("準備", C_PREP), ("審査・お客様手配", C_EXT), ("開発", C_DEV), ("品質・検収", C_QA), ("リリース・納品", C_REL)]
    cells = []
    for label, col in items:
        chip = Table([[""]], colWidths=[4 * mm], rowHeights=[3 * mm], style=TableStyle([("BACKGROUND", (0, 0), (-1, -1), col)]))
        cells.append(chip); cells.append(Paragraph(label, S["tcell_soft"]))
    t = Table([cells], colWidths=[5.5 * mm, 11 * mm, 5.5 * mm, 32 * mm, 5.5 * mm, 11 * mm, 5.5 * mm, 22 * mm, 5.5 * mm, 26 * mm],
              style=TableStyle([("VALIGN", (0, 0), (-1, -1), "MIDDLE"), ("LEFTPADDING", (0, 0), (-1, -1), 1),
                                ("RIGHTPADDING", (0, 0), (-1, -1), 2), ("TOPPADDING", (0, 0), (-1, -1), 0), ("BOTTOMPADDING", (0, 0), (-1, -1), 0)]))
    t.spaceBefore, t.spaceAfter = 2, 6
    return t

def detail_block(no, name, role, days, weeks, subs, dod):
    flow = []
    head = Table([[Paragraph(f"{no}. {name}", S["blk"]),
                   Paragraph(f"担当：{role}　／　目安 {days}人日　／　{weeks}", S["meta"])]],
                 colWidths=[CW * 0.5, CW * 0.5],
                 style=TableStyle([("VALIGN", (0, 0), (-1, -1), "BOTTOM"), ("LEFTPADDING", (0, 0), (-1, -1), 0),
                                   ("RIGHTPADDING", (0, 0), (-1, -1), 0), ("TOPPADDING", (0, 0), (-1, -1), 0),
                                   ("BOTTOMPADDING", (0, 0), (-1, -1), 2), ("LINEBELOW", (0, 0), (-1, -1), 0.5, LINE)]))
    flow.append(head)
    flow.append(Spacer(1, 2))
    for stt in subs:
        flow.append(Paragraph(stt, S["sub"], bulletText="・"))
    if dod and dod != "—":
        flow.append(Paragraph(f"<b>完了条件：</b>{dod}", S["dod"]))
    flow.append(Spacer(1, 7))
    return KeepTogether(flow)

def make_doc(path, footer):
    def on_page(canv, doc):
        canv.saveState()
        if doc.page > 1:
            canv.setStrokeColor(LINE); canv.setLineWidth(0.6); canv.line(M, 13 * mm, W - M, 13 * mm)
            canv.setFont(JP, 7.5); canv.setFillColor(FAINT)
            canv.drawString(M, 9 * mm, footer); canv.drawRightString(W - M, 9 * mm, f"{doc.page - 1}")
        canv.restoreState()
    doc = BaseDocTemplate(path, pagesize=A4, leftMargin=M, rightMargin=M, topMargin=16 * mm, bottomMargin=18 * mm)
    frame = Frame(M, 18 * mm, CW, H - 34 * mm, id="main")
    doc.addPageTemplates([PageTemplate(id="p", frames=[frame], onPage=on_page)])
    return doc

def build(path):
    doc = make_doc(path, "サツコイ！（仮）制作工程表")
    st = []
    st.append(Spacer(1, 52 * mm))
    if os.path.exists(LOGO):
        img = Image(LOGO, width=28 * mm, height=28 * mm); img.hAlign = "CENTER"; st.append(img)
    st.append(Spacer(1, 9 * mm))
    st.append(Paragraph("サツコイ！（仮）<br/>制作工程表（詳細版）", S["cover_title"]))
    st.append(Spacer(1, 4 * mm))
    st.append(Paragraph("本番リリース（v1.0）までの開発スケジュール<br/>納品目安：着手から1.5〜2ヶ月", S["cover_sub"]))
    st.append(Spacer(1, 40 * mm))
    st.append(Paragraph("2026年7月　発行：ViFight", S["cover_meta"]))
    st.append(PageBreak())

    # 1
    st.append(h1("1. 本工程表について"))
    st.append(Paragraph("本書は、すでに完成・公開しているプロトタイプ（Phase 1）をもとに、外部連携やお金が絡む処理を実運用化し「本番リリース（v1.0）」として納品するまでの制作スケジュールです。全体を8週間（約2ヶ月）で構成し、1.5ヶ月時点で限定公開のβ、2ヶ月時点で一般公開・正式納品とします。", S["body"]))
    st.append(li("<b>プロトタイプの位置づけ</b>：現在のデモは画面と業務ロジックを実装済みですが、LINE連携・Stripe決済・メール配信・書類保存・自動処理（定期実行）は「デモ用の仮実装（スタブ）」です。本工程では、これらを本番へ<b>実接続する新規開発</b>を行います。"))
    st.append(li("<b>工数（人日）について</b>：各工程の人日はViFightの<b>概算見積り</b>です。実際の数値・体制人数は契約時に精査・確定します。"))
    st.append(li("<b>体制</b>：役割別（PM／バックエンド／フロントエンド／インフラ／デザイン／QA）で記載します。各役割の人数（兼任含む）は体制確定時に決定します（要確定）。"))
    st.append(li("<b>法務</b>：規約・特商法・異性紹介事業の該当判断等は、ViFightが外部専門家を紹介・調整のうえ、アプリへ実装反映します。"))
    st.append(li("<b>着手日</b>：本書は着手（契約締結）を第1週の開始とした相対週（W1〜W8）で記載しています。実日付は<b>要確定</b>です。"))
    st.append(li("<b>β（限定公開）と一般公開</b>：βは招待・少人数向けの限定公開です。本番の実決済・LINE本番配信は各社の審査承認が前提です。"))

    # 2 Gantt
    st.append(h1("2. 全体スケジュール"))
    st.append(legend())
    st.append(Gantt(CW, TASKS, NWEEKS))
    st.append(Paragraph("W＝着手からの週数。破線は主要マイルストーン（1.5ヶ月＝限定公開β／2ヶ月＝一般公開・納品）。工程17「予備」は遅延・手戻りを吸収するバッファです。工程2・3はお客様手配を含む外部依存で、ViFightが支援・実装反映します。", S["note"]))

    # 3 体制
    st.append(PageBreak())
    st.append(h1("3. 開発体制（役割）"))
    st.append(Paragraph("本件は以下の役割で進行します。各役割の人数（兼任を含む）は体制確定時に決定します（要確定）。", S["body"]))
    st.append(tbl(["役割", "主な担当範囲"], [
        ["PM（進行管理）", "スコープ・進行管理、外部審査/法務の調整、検収窓口、定例運営。"],
        ["バックエンド", "API、Stripe決済、LINE/メール通知、書類保存、自動処理（cron）。"],
        ["フロントエンド", "会員向け画面・管理画面の本番化。"],
        ["インフラ", "GCP構築、CI・CD、監視・バックアップ、リリース。"],
        ["デザイン", "UIの最終調整（デザインシステムは実装済み）。"],
        ["QA（品質）", "自動テスト整備、結合/回帰テスト、セキュリティ確認。"],
        ["外部専門家（法務）", "規約・特商法・異性紹介事業の該当判断等（ViFightが紹介・調整）。"],
    ], [CW * 0.24, CW * 0.76]))

    # 4 詳細
    st.append(h1("4. 工程の詳細（サブタスク・担当・工数・完了条件）"))
    st.append(Paragraph("各工程を作業レベルまで分解しています。「完了条件」は、その工程が完了したと判断する基準（Definition of Done）です。", S["note"]))
    st.append(Spacer(1, 3))
    for (no, name, role, days, weeks, subs, dod) in DETAIL:
        st.append(detail_block(no, name, role, days, weeks, subs, dod))

    # 5 工数サマリー
    st.append(h1("5. 工数サマリー"))
    st.append(Paragraph(f"全工程の工数目安は合計 <b>約{TOTAL_DAYS}人日</b>（ViFightの概算・契約時に精査）。8週間（実働約40日）で、複数役割が並行して進めます。1日あたりの平均稼働はおよそ3名相当で、開発の山場（W3〜W6）に人員を厚く配分します。", S["body"]))
    st.append(li("最も重い工程：Stripe本決済（14人日）、会員機能の本番化（12人日）、管理画面の本番化・自動テスト整備（各10人日）。"))
    st.append(li("お金・書類・通知など「事故が許されない領域」に工数を厚く配分し、テスト・バッファも明示的に確保しています。"))
    st.append(Paragraph("※ 具体的な人数配分・期間割当・費用は、体制と単価の確定後にお見積りでご提示します（要確定）。", S["note"]))

    # 6 マイルストーン
    st.append(PageBreak())
    st.append(h1("6. マイルストーン"))
    st.append(tbl(["", "時期の目安", "内容・判定"], [
        ["M1", "W1末", "要件・設計・デザイン・品質基準（DoD）の確定。外部審査・法務の着手。"],
        ["M2", "W3末", "インフラ構築完了（ステージング稼働）。LINEログイン動作。"],
        ["M3", "W6末（約1.5ヶ月）", "フィーチャーコンプリート＝限定公開β。全機能が動作（実決済は審査承認後）。"],
        ["M4", "W7末", "検収・QA・セキュリティ確認完了。指摘反映済み。"],
        ["M5", "W8末（約2ヶ月）", "一般公開・正式納品。※本番実課金は各社審査の承認を前提。"],
    ], [CW * 0.08, CW * 0.24, CW * 0.68], hl_rows=(3, 5)))

    # 7 納品物
    st.append(h1("7. 納品物"))
    st.append(li("本番稼働する会員向けWebアプリ（PWA）一式（ソースコード）と運営管理画面一式"))
    st.append(li("GCP本番環境・ステージング環境（構成・監視・バックアップ込み）"))
    st.append(li("各種連携設定（LINEログイン・LINE／メール通知・Stripe決済・自動処理）"))
    st.append(li("自動テスト・CIの一式"))
    st.append(li("ドキュメント（ご利用ガイド・管理画面マニュアル・運用手順書・環境構成図）"))

    # 8 お客様
    st.append(PageBreak())
    st.append(h1("8. お客様にご準備・ご対応いただくこと"))
    st.append(Paragraph("以下は納期を守るために特に重要です。外部審査には各社のリードタイム（LINE公式アカウント認証は目安10営業日程度、Stripe本番審査は数日〜、追加書類を求められる場合あり）があるため、契約後すぐの着手をお願いします。", S["body"]))
    st.append(tbl(["ご対応いただくこと", "内容", "期日の目安"], [
        ["要件・デザイン確認", "キックオフでの仕様・デザイン・品質基準の最終確認。", "W1"],
        ["外部アカウント申請", "LINE公式アカウント・LINE Developers、Stripeの開設と本番審査申請（手順はViFightが支援）。", "W1中に着手"],
        ["法務の窓口・意思決定", "ViFightが紹介する専門家との調整・確認、規約等の内容承認。", "W1–W4"],
        ["コンテンツ提供", "FAQ・提携店リスト・掲載文言等。", "W2–W4"],
        ["AI・特典の監修", "AIアドバイザーの文言監修、提携店ギフト券・紹介特典の条件確定。", "W5–W6"],
        ["検収", "検収と指摘のとりまとめ（各回3営業日以内が目安）。", "W7"],
    ], [CW * 0.22, CW * 0.63, CW * 0.15], soft_cols=(2,)))
    st.append(Paragraph("※ お客様側のご確認・ご準備・外部審査が期日を超えた場合、その超過日数分だけ納期を後ろにスライドします。", S["note"]))

    # 9 スコープ
    st.append(h1("9. 対応範囲（スコープ）"))
    st.append(tbl(["今回の納品に含む（v1.0）", "含まない（次フェーズでご提案）"], [
        ["LINEログイン（LIFF）／LINE・メール通知", "AIの本格学習（RAG・成婚データ駆動の推薦）"],
        ["Stripe本決済（登録・都度課金・違約金・更新・Webhook）", "画像分析によるタイプ診断"],
        ["書類アップロードの本運用・確認フロー", "ネイティブアプリ化（ストア配信）"],
        ["自動処理（自動解除・更新課金・アンケート）", "不動産連携の成婚キャッシュバック本運用"],
        ["会員向けアプリ・管理画面の本番化／自動テスト・CI", "第三者ペネトレーションテスト・大規模負荷試験"],
        ["AIアドバイザー・相性推薦 v1（ルールベース）", "多都市展開"],
    ], [CW * 0.5, CW * 0.5], soft_cols=(1,)))

    # 10 支払い
    st.append(PageBreak())
    st.append(h1("10. お支払いについて（要確定）"))
    st.append(Paragraph("お支払いの金額・比率・回数は<b>要確定</b>です。受託開発では、進行の節目に分けてお支払いいただくのが一般的で、一例として下記の構成があります（あくまで例で、確定値ではありません）。", S["body"]))
    st.append(tbl(["区分（例）", "タイミング（例）"], [
        ["着手金", "契約締結時"],
        ["中間金", "M3：限定公開β（W6末・DoD達成を確認）"],
        ["納品時", "M5：一般公開・納品（W8末）"],
    ], [CW * 0.25, CW * 0.75], soft_cols=(1,)))
    st.append(Paragraph("※ 総額・内訳・比率・支払時期は、体制と人日単価の確定後にお見積りで提示します。", S["note"]))

    # 11 運用・費用
    st.append(h1("11. リリース後の運用・保守・費用"))
    st.append(li("<b>初期サポート（hypercare）</b>：納品後の一定期間、初期不具合対応・監視強化を行います（期間は要確定）。"))
    st.append(li("<b>瑕疵対応</b>：納品物の不具合は、定めた保証期間内は無償で修正します（期間は要確定）。"))
    st.append(li("<b>月額の実費</b>：GCP等のサーバー費用・LINE通知の配信量に応じた費用・ドメイン等はお客様のご負担（実費）です。概算は構成・想定利用規模の確定後に提示します（要確定）。"))
    st.append(li("<b>継続保守（任意）</b>：依存更新・キャッシュ整理・バグ修正・小改修を月額の保守契約としてご提案可能です（条件は要確定）。"))

    # 12 前提・リスク
    st.append(PageBreak())
    st.append(h1("12. 前提条件・リスクと対策"))
    st.append(Paragraph("前提条件", S["body"]))
    st.append(li("ViFightの専任チームが本件に継続稼働できること。"))
    st.append(li("LINE・Stripeのアカウント申請、および規約等の法務対応が、上表の期日までに進むこと。"))
    st.append(li("検収・ご確認は各回3営業日以内を目安にご対応いただけること。"))
    st.append(li("本番の実決済・LINE本番配信は、各社の本番審査の承認を前提とします（承認前はテストモードで先行）。"))
    st.append(Spacer(1, 2 * mm))
    st.append(Paragraph("主なリスクと対策", S["body"]))
    st.append(tbl(["リスク", "対策"], [
        ["Stripe本番審査の遅延・追加要求（マッチングは慎重審査の対象）", "契約直後に申請開始。承認前はテストモードで開発を進め、承認後に本番接続。βはテスト課金で先行可能。"],
        ["LINE公式アカウント／ログイン申請のリードタイム", "W1中に申請。審査待ちの間もUI・連携実装を並行し、承認後に本番キーへ差し替え。"],
        ["法務対応（異性紹介事業の届出等）がリリースを止める", "W1で該当判断に着手。届出が必要な場合は手続きと並行して開発し、公開はクリア後に。"],
        ["検収の手戻り・仕様追加", "予備日（工程17）で吸収。大きな追加はPhase 2以降へ振り分け（変更管理）。"],
        ["お客様側のご準備の遅延", "各準備物に期日を設定し、超過分は納期をスライド。週次定例で進捗を可視化。"],
    ], [CW * 0.4, CW * 0.6]))

    # 13 TBD
    st.append(PageBreak())
    st.append(h1("13. 要確定事項（TBD）一覧"))
    st.append(Paragraph("本工程表では、以下の項目を<b>推測で埋めていません</b>。確定でき次第、本書に反映します。", S["body"]))
    st.append(tbl(["項目", "内容", "状態"], [
        ["着手日（実日付）", "契約締結日＝W1開始の実カレンダー日付。", "要確定"],
        ["体制の人数", "役割は記載済み。各役割の人数（兼任含む）。", "要確定"],
        ["お支払い", "総額・内訳・比率・支払時期（現状は例のみ）。", "要確定"],
        ["人日単価", "工数→金額換算のための単価（金額記載を行う場合）。", "要確定"],
        ["保証期間・初期サポート", "瑕疵対応の保証期間、hypercareの期間。", "要確定"],
        ["月額保守", "継続保守の有無・範囲・月額条件。", "要確定"],
        ["月額実費（GCP等）", "概算の前提となる想定同時利用者数・配信量。", "要確定"],
        ["データ移行", "プロトタイプに実ユーザー・実データがあるか（移行工程の要否）。", "要確認"],
        ["会社情報", "ViFightの正式社名・連絡先（表紙・フッター用）。", "要確定"],
        ["法務専門家", "ViFightが紹介・調整する前提で確定か。", "要確認"],
    ], [CW * 0.22, CW * 0.62, CW * 0.16], soft_cols=()))

    # 14 短縮
    st.append(h1("14. 補足：1.5ヶ月での短縮納品について"))
    st.append(Paragraph("W6末（約1.5ヶ月）のβ（限定公開）時点で先行リリースする短縮案も可能です。その場合、実決済は審査承認後の開始、一部の作り込み（AI v1の精度向上・管理画面の一部運用機能・テスト範囲の拡充など）はリリース後の継続改善に回します。品質と安全性を優先する場合は、予備日を含む2ヶ月での一般公開・正式納品を推奨します。", S["body"]))

    doc.build(st)

OUT = "/tmp/claude-0/-home-user-satukoi/f71acb11-45a0-5a58-86eb-7d20d17701c9/scratchpad/pdfs"
os.makedirs(OUT, exist_ok=True)
build(os.path.join(OUT, "サツコイ_制作工程表.pdf"))
print("done", os.path.getsize(os.path.join(OUT, "サツコイ_制作工程表.pdf")), "bytes", "TOTAL_DAYS", TOTAL_DAYS)
