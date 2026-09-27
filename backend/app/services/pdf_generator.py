import os
from datetime import datetime
from typing import Dict, Any, List
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
)


def generate_seo_pdf_report(
    output_path: str,
    brand_name: str,
    period_start: datetime,
    period_end: datetime,
    kpi_data: Dict[str, Any],
    top_improvements: List[Dict[str, Any]],
    top_drops: List[Dict[str, Any]],
    website_stats: List[Dict[str, Any]],
    recent_alerts: List[Dict[str, Any]],
    recommendations: List[str]
) -> str:
    """
    Builds a professional executive SEO PDF report using ReportLab.
    """
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Custom Brand Styles (Avention Crimson #DC2626 & Slate #0F172A)
    primary_color = colors.HexColor("#DC2626")
    dark_slate = colors.HexColor("#0F172A")
    gray_muted = colors.HexColor("#64748B")
    border_color = colors.HexColor("#E2E8F0")
    card_bg = colors.HexColor("#F8FAFC")

    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=22,
        leading=26,
        textColor=primary_color,
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=12,
        leading=16,
        textColor=dark_slate,
    )
    meta_style = ParagraphStyle(
        "DocMeta",
        parent=styles["Normal"],
        fontName="Helvetica-Oblique",
        fontSize=9,
        leading=12,
        textColor=gray_muted,
    )
    h2_style = ParagraphStyle(
        "Heading2Custom",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=14,
        leading=18,
        textColor=dark_slate,
        spaceBefore=14,
        spaceAfter=6,
    )
    body_style = ParagraphStyle(
        "BodyCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=13,
        textColor=dark_slate,
    )
    badge_green = ParagraphStyle(
        "BadgeGreen",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=colors.HexColor("#16A34A"),
    )
    badge_red = ParagraphStyle(
        "BadgeRed",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=9,
        textColor=colors.HexColor("#DC2626"),
    )

    elements = []

    # 1. Header & Branding
    elements.append(Paragraph("Avention SEO Rank Automation", title_style))
    elements.append(Paragraph(f"Weekly Executive SEO Performance Report: <b>{brand_name}</b>", subtitle_style))
    date_str = f"Period: {period_start.strftime('%B %d, %Y')} - {period_end.strftime('%B %d, %Y')} | Generated: {datetime.now().strftime('%B %d, %Y %H:%M')}"
    elements.append(Paragraph(date_str, meta_style))
    elements.append(Spacer(1, 10))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=primary_color, spaceBefore=4, spaceAfter=14))

    # 2. Executive KPI Overview Cards Table
    elements.append(Paragraph("Executive Summary & KPIs", h2_style))
    
    kpi_rows = [
        [
            Paragraph("<b>Total Keywords</b>", body_style),
            Paragraph(f"<b>{kpi_data.get('total_keywords', 0)}</b>", body_style),
            Paragraph("<b>Top 3 Positions</b>", body_style),
            Paragraph(f"<b>{kpi_data.get('top_3', 0)}</b>", badge_green),
        ],
        [
            Paragraph("<b>Tracked Keywords</b>", body_style),
            Paragraph(f"<b>{kpi_data.get('tracked_keywords', 0)}</b>", body_style),
            Paragraph("<b>Top 10 Positions</b>", body_style),
            Paragraph(f"<b>{kpi_data.get('top_10', 0)}</b>", badge_green),
        ],
        [
            Paragraph("<b>Average Position</b>", body_style),
            Paragraph(f"<b>#{kpi_data.get('average_position', 0):.1f}</b>", body_style),
            Paragraph("<b>Improved Rankings</b>", body_style),
            Paragraph(f"<b>+{kpi_data.get('improved', 0)}</b>", badge_green),
        ],
        [
            Paragraph("<b>Unranked / Lost</b>", body_style),
            Paragraph(f"<b>{kpi_data.get('not_ranking', 0)}</b>", body_style),
            Paragraph("<b>Dropped Rankings</b>", body_style),
            Paragraph(f"<b>-{kpi_data.get('dropped', 0)}</b>", badge_red),
        ],
    ]
    t_kpi = Table(kpi_rows, colWidths=[130, 130, 130, 150])
    t_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), card_bg),
        ('GRID', (0, 0), (-1, -1), 0.5, border_color),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
        ('RIGHTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elements.append(t_kpi)
    elements.append(Spacer(1, 14))

    # 3. Factual Observations & Data-driven Insights
    if recommendations:
        elements.append(Paragraph("Key Insights & Observations", h2_style))
        for rec in recommendations:
            elements.append(Paragraph(f"• {rec}", body_style))
            elements.append(Spacer(1, 3))
        elements.append(Spacer(1, 10))

    # 4. Top Improvements Table
    elements.append(Paragraph("Top Ranking Improvements", h2_style))
    if top_improvements:
        imp_data = [[
            Paragraph("<b>Keyword</b>", body_style),
            Paragraph("<b>Domain</b>", body_style),
            Paragraph("<b>Prev</b>", body_style),
            Paragraph("<b>Current</b>", body_style),
            Paragraph("<b>Change</b>", body_style)
        ]]
        for item in top_improvements[:5]:
            prev_txt = f"#{item.get('previous_position')}" if item.get('previous_position') else "Unranked"
            curr_txt = f"#{item.get('current_position')}" if item.get('current_position') else "-"
            change_txt = f"+{item.get('change')}"
            imp_data.append([
                Paragraph(str(item.get("keyword", "")), body_style),
                Paragraph(str(item.get("domain", "")), body_style),
                Paragraph(prev_txt, body_style),
                Paragraph(curr_txt, body_style),
                Paragraph(change_txt, badge_green),
            ])
        t_imp = Table(imp_data, colWidths=[180, 150, 70, 70, 70])
        t_imp.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_imp)
    else:
        elements.append(Paragraph("No significant improvements recorded during this period.", body_style))
    elements.append(Spacer(1, 14))

    # 5. Top Drops Table
    elements.append(Paragraph("Top Ranking Drops", h2_style))
    if top_drops:
        drop_data = [[
            Paragraph("<b>Keyword</b>", body_style),
            Paragraph("<b>Domain</b>", body_style),
            Paragraph("<b>Prev</b>", body_style),
            Paragraph("<b>Current</b>", body_style),
            Paragraph("<b>Change</b>", body_style)
        ]]
        for item in top_drops[:5]:
            prev_txt = f"#{item.get('previous_position')}" if item.get('previous_position') else "-"
            curr_txt = f"#{item.get('current_position')}" if item.get('current_position') else "Lost"
            change_txt = f"{item.get('change')}"
            drop_data.append([
                Paragraph(str(item.get("keyword", "")), body_style),
                Paragraph(str(item.get("domain", "")), body_style),
                Paragraph(prev_txt, body_style),
                Paragraph(curr_txt, body_style),
                Paragraph(change_txt, badge_red),
            ])
        t_drop = Table(drop_data, colWidths=[180, 150, 70, 70, 70])
        t_drop.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_drop)
    else:
        elements.append(Paragraph("No drops recorded during this period.", body_style))
    elements.append(Spacer(1, 14))

    # 6. Website Breakdown
    if website_stats:
        elements.append(Paragraph("Website Performance Overview", h2_style))
        web_data = [[
            Paragraph("<b>Website Domain</b>", body_style),
            Paragraph("<b>Keywords</b>", body_style),
            Paragraph("<b>Avg Position</b>", body_style),
            Paragraph("<b>Top 10</b>", body_style),
            Paragraph("<b>Improved</b>", body_style),
            Paragraph("<b>Dropped</b>", body_style)
        ]]
        for w in website_stats:
            avg_p = f"#{w.get('avg_position', 0):.1f}" if w.get('avg_position') else "-"
            web_data.append([
                Paragraph(str(w.get("domain", "")), body_style),
                Paragraph(str(w.get("keyword_count", 0)), body_style),
                Paragraph(avg_p, body_style),
                Paragraph(str(w.get("top_10_count", 0)), badge_green),
                Paragraph(f"+{w.get('improved_count', 0)}", badge_green),
                Paragraph(f"-{w.get('dropped_count', 0)}", badge_red),
            ])
        t_web = Table(web_data, colWidths=[160, 75, 75, 75, 75, 80])
        t_web.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ('GRID', (0, 0), (-1, -1), 0.5, border_color),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        elements.append(t_web)
        elements.append(Spacer(1, 14))

    # 7. Recent Critical Alerts
    if recent_alerts:
        elements.append(Paragraph("Notable Alerts & SERP Volatility", h2_style))
        for a in recent_alerts[:5]:
            sev_color = badge_red if a.get("severity") == "critical" else body_style
            elements.append(Paragraph(f"• [{a.get('severity', '').upper()}] {a.get('message', '')}", sev_color))
            elements.append(Spacer(1, 2))
        elements.append(Spacer(1, 10))

    # Build PDF
    doc.build(elements)
    return output_path
