import os
import re
import sys
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfgen import canvas
from reportlab.lib.enums import TA_CENTER, TA_JUSTIFY, TA_LEFT

# --- Double-Pass Numbered Canvas for Running Headers, Footers & Dynamic Page Counts ---
class NumberedCanvas(canvas.Canvas):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            super().showPage()
        super().save()

    def draw_page_elements(self, page_count):
        self.saveState()
        
        # Cover Page Design (Page 1)
        if self._pageNumber == 1:
            # Draw deep blue left vertical bar accents
            self.setFillColor(colors.HexColor('#1A365D'))
            self.rect(0, 0, 30, 792, fill=True, stroke=False)
            self.setFillColor(colors.HexColor('#3182CE'))
            self.rect(30, 0, 10, 792, fill=True, stroke=False)
            self.restoreState()
            return

        # Running Header (Page 2+)
        self.setFont("Helvetica-Bold", 8)
        self.setFillColor(colors.HexColor('#2D3748'))
        self.drawString(54, 750, "CAMPUS E-MAGAZINE PLATFORM")
        
        self.setFont("Helvetica", 8)
        self.setFillColor(colors.HexColor('#718096'))
        self.drawRightString(558, 750, "TECHNICAL PROJECT REPORT")
        
        # Header Rule
        self.setStrokeColor(colors.HexColor('#E2E8F0'))
        self.setLineWidth(0.75)
        self.line(54, 742, 558, 742)
        
        # Running Footer (Page 2+)
        self.line(54, 52, 558, 52)
        self.drawString(54, 40, "Submitted in partial fulfillment of degree requirements")
        
        page_text = f"Page {self._pageNumber} of {page_count}"
        self.drawRightString(558, 40, page_text)
        
        self.restoreState()


# --- Inline Markdown Formatting Parser ---
def format_inline_markdown(text):
    # Escape HTML symbols safely
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    
    # Restore tags we specifically want to support in ReportLab Paragraphs
    text = text.replace("&lt;b&gt;", "<b>").replace("&lt;/b&gt;", "</b>")
    text = text.replace("&lt;i&gt;", "<i>").replace("&lt;/i&gt;", "</i>")
    text = text.replace("&lt;u&gt;", "<u>").replace("&lt;/u&gt;", "</u>")
    text = text.replace("&lt;span", "<span").replace("&lt;/span&gt;", "</span>")
    
    # Convert markdown links [Text](URL) -> <a href="URL" color="#3182CE">Text</a>
    text = re.sub(r'\[([^\]]+)\]\(([^)]+)\)', r'<a href="\2" color="#3182CE"><b>\1</b></a>', text)
    
    # Convert bold **text** or __text__ -> <b>text</b>
    text = re.sub(r'\*\*([^*]+)\*\*', r'<b>\1</b>', text)
    text = re.sub(r'__([^_]+)__', r'<b>\1</b>', text)
    
    # Convert italic *text* or _text_ -> <i>text</i>
    text = re.sub(r'\*([^*]+)\*', r'<i>\1</i>', text)
    text = re.sub(r'_([^_]+)_', r'<i>\1</i>', text)
    
    # Convert inline code `code` -> <font face="Courier" color="#C53030">code</font>
    text = re.sub(r'`([^`]+)`', r'<font face="Courier" size="9" color="#C53030">\1</font>', text)
    
    # Re-enable specific inline spans we used in HTML
    text = text.replace("&quot;", '"')
    
    return text


def build_pdf(md_filepath, pdf_filepath):
    print(f"Reading project report from: {md_filepath}")
    with open(md_filepath, "r", encoding="utf-8") as f:
        md_content = f.read()

    # --- Setup Stylesheet ---
    styles = getSampleStyleSheet()
    
    # Custom colors
    primary_color = colors.HexColor('#1A365D')    # Deep Navy
    secondary_color = colors.HexColor('#2B6CB0')  # Slate Blue
    text_color = colors.HexColor('#2D3748')       # Charcoal
    bg_code_color = colors.HexColor('#F7FAFC')    # Soft Grey
    
    # Modify default styles
    styles['Normal'].textColor = text_color
    styles['Normal'].fontSize = 10
    styles['Normal'].leading = 14
    styles['Normal'].alignment = TA_JUSTIFY
    
    # Add new distinct styles
    styles.add(ParagraphStyle(
        name='TitlePageTitle',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=32,
        leading=38,
        textColor=primary_color,
        alignment=TA_LEFT,
        spaceAfter=15
    ))

    styles.add(ParagraphStyle(
        name='TitlePageSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        alignment=TA_LEFT,
        spaceAfter=40
    ))

    styles.add(ParagraphStyle(
        name='TitlePageMetadataLabel',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=primary_color,
        spaceAfter=4
    ))

    styles.add(ParagraphStyle(
        name='TitlePageMetadataVal',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=10,
        leading=14,
        textColor=text_color,
        spaceAfter=15
    ))

    styles.add(ParagraphStyle(
        name='ReportHeading1',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=18,
        leading=22,
        textColor=primary_color,
        spaceBefore=18,
        spaceAfter=10,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='ReportHeading2',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=16,
        textColor=secondary_color,
        spaceBefore=14,
        spaceAfter=6,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='ReportHeading3',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=10,
        leading=14,
        textColor=text_color,
        spaceBefore=10,
        spaceAfter=4,
        keepWithNext=True
    ))

    styles.add(ParagraphStyle(
        name='ReportBody',
        parent=styles['Normal'],
        spaceAfter=8
    ))

    styles.add(ParagraphStyle(
        name='ReportBullet',
        parent=styles['Normal'],
        leftIndent=20,
        firstLineIndent=-10,
        spaceAfter=6
    ))

    styles.add(ParagraphStyle(
        name='CodeSnippetStyle',
        parent=styles['Normal'],
        fontName='Courier',
        fontSize=8.5,
        leading=11,
        textColor=colors.HexColor('#1A202C'),
        spaceBefore=6,
        spaceAfter=6,
        leftIndent=15,
        rightIndent=15
    ))

    styles.add(ParagraphStyle(
        name='TableHeader',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=11,
        textColor=colors.white,
        alignment=TA_LEFT
    ))

    styles.add(ParagraphStyle(
        name='TableCell',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8.5,
        leading=11,
        alignment=TA_LEFT
    ))

    # --- Document Setup ---
    # Letter size is 612 x 792 points. Margins: Left/Right=54 (0.75"), Top/Bottom=72 (1.0")
    # This keeps body flowables perfectly clear of running headers/footers
    doc = SimpleDocTemplate(
        pdf_filepath,
        pagesize=letter,
        leftMargin=54,
        rightMargin=54,
        topMargin=72,
        bottomMargin=72
    )

    story = []

    # ==================== BUILD TITLE PAGE (Page 1) ====================
    story.append(Spacer(1, 40))
    story.append(Paragraph("CAMPUS E-MAGAZINE<br/>PLATFORM", styles['TitlePageTitle']))
    story.append(Paragraph("COMPREHENSIVE PROJECT DOCUMENTATION &amp; TECHNICAL REPORT", styles['TitlePageSubtitle']))
    
    story.append(Spacer(1, 20))
    story.append(Paragraph("Submitted in partial fulfillment of the requirements for the degree of", styles['TitlePageMetadataVal']))
    story.append(Paragraph("BACHELOR OF TECHNOLOGY", styles['TitlePageMetadataLabel']))
    story.append(Paragraph("IN COMPUTER SCIENCE &amp; ENGINEERING", styles['TitlePageSubtitle']))
    
    story.append(Spacer(1, 60))
    
    # Metadata Block
    meta_data = [
        [Paragraph("PROJECT TYPE:", styles['TitlePageMetadataLabel']), Paragraph("Full-Stack Collaborative Web Application", styles['TitlePageMetadataVal'])],
        [Paragraph("DEVELOPMENT PARADIGM:", styles['TitlePageMetadataLabel']), Paragraph("Decoupled Clean Architecture (REST API / WebSockets / React)", styles['TitlePageMetadataVal'])],
        [Paragraph("AUTHENTICATION:", styles['TitlePageMetadataLabel']), Paragraph("Secure JWT-based RBAC with supplemental Email OTP Validation", styles['TitlePageMetadataVal'])],
        [Paragraph("UNDER GUIDANCE OF:", styles['TitlePageMetadataLabel']), Paragraph("Department Project Advisor &amp; Coordinator", styles['TitlePageMetadataVal'])],
    ]
    
    # Table layout for clean metadata alignment
    meta_table = Table(meta_data, colWidths=[150, 350])
    meta_table.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ('TOPPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    
    story.append(Spacer(1, 40))
    story.append(Paragraph("DEPARTMENT OF COMPUTER SCIENCE &amp; ENGINEERING", styles['TitlePageMetadataLabel']))
    story.append(Paragraph("SPRING SEMESTER, ACADEMIC YEAR 2026", styles['TitlePageMetadataVal']))
    story.append(PageBreak())

    # ==================== PARSE THE MARKDOWN BODY CONTENT ====================
    print("Parsing markdown blocks...")
    
    # Normalize Markdown newlines
    md_content = md_content.replace('\r\n', '\n')
    
    # Split content into blocks based on blank lines
    blocks = md_content.split('\n\n')
    
    # Helper to check if a block is a table
    def is_table_block(lines):
        return len(lines) >= 2 and lines[0].strip().startswith('|') and lines[1].strip().startswith('|')
    
    in_code_block = False
    code_block_lines = []
    
    for block in blocks:
        block = block.strip()
        if not block:
            continue
        
        # --- Handle Code Blocks ---
        if in_code_block:
            if block.endswith('```'):
                code_block_lines.append(block[:-3].rstrip())
                code_content = "\n\n".join(code_block_lines)
                
                # Wrap inside a styled single-cell Table to give a nice border and background
                code_p = Paragraph(format_inline_markdown(code_content).replace("\n", "<br/>"), styles['CodeSnippetStyle'])
                code_table = Table([[code_p]], colWidths=[504])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), bg_code_color),
                    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
                    ('PADDING', (0,0), (-1,-1), 10),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ]))
                story.append(Spacer(1, 4))
                story.append(code_table)
                story.append(Spacer(1, 4))
                
                in_code_block = False
                code_block_lines = []
            else:
                code_block_lines.append(block)
            continue
            
        if block.startswith('```'):
            in_code_block = True
            # Strip language identifier if present (e.g. ```typescript)
            first_line = block.split('\n')[0]
            remaining = block[len(first_line):].strip()
            
            if remaining.endswith('```'):
                code_content = remaining[:-3].rstrip()
                code_p = Paragraph(format_inline_markdown(code_content).replace("\n", "<br/>"), styles['CodeSnippetStyle'])
                code_table = Table([[code_p]], colWidths=[504])
                code_table.setStyle(TableStyle([
                    ('BACKGROUND', (0,0), (-1,-1), bg_code_color),
                    ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')),
                    ('PADDING', (0,0), (-1,-1), 10),
                    ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
                ]))
                story.append(Spacer(1, 4))
                story.append(code_table)
                story.append(Spacer(1, 4))
                in_code_block = False
            else:
                code_block_lines.append(remaining)
            continue

        # Split block into lines for analysis
        lines = block.split('\n')
        
        # --- Handle Markdown Tables ---
        if is_table_block(lines):
            table_data = []
            col_widths = []
            
            # Extract rows
            header_parsed = False
            for line in lines:
                line_stripped = line.strip()
                if not line_stripped.startswith('|'):
                    continue
                # Split cells, clean spaces, remove outer empty splits
                cells = [c.strip() for c in line_stripped.split('|')[1:-1]]
                
                # Check if it is a separator row (e.g. |:---|:---|)
                if len(cells) > 0 and all(re.match(r'^:?-+:?$', c) for c in cells):
                    continue
                
                # Parse cells into Paragraph flowables to allow wrapping
                row_cells = []
                for cell in cells:
                    cell_html = format_inline_markdown(cell)
                    if not header_parsed:
                        row_cells.append(Paragraph(cell_html, styles['TableHeader']))
                    else:
                        row_cells.append(Paragraph(cell_html, styles['TableCell']))
                table_data.append(row_cells)
                header_parsed = True
            
            if not table_data:
                continue
                
            # Distribute column widths evenly across page width (504 points printable width)
            num_cols = len(table_data[0])
            even_width = 504 / num_cols
            col_widths = [even_width] * num_cols
            
            # Instantiate ReportLab Table
            table = Table(table_data, colWidths=col_widths, repeatRows=1)
            
            # Style the table elegantly
            t_style = [
                ('BACKGROUND', (0,0), (-1,0), primary_color), # Navy header
                ('VALIGN', (0,0), (-1,-1), 'TOP'),
                ('BOTTOMPADDING', (0,0), (-1,-1), 6),
                ('TOPPADDING', (0,0), (-1,-1), 6),
                ('LEFTPADDING', (0,0), (-1,-1), 6),
                ('RIGHTPADDING', (0,0), (-1,-1), 6),
                ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E0')), # Grid borders
            ]
            
            # Alternating row background colors for improved legibility
            for row_idx in range(1, len(table_data)):
                bg = bg_code_color if row_idx % 2 == 1 else colors.white
                t_style.append(('BACKGROUND', (0, row_idx), (-1, row_idx), bg))
                
            table.setStyle(TableStyle(t_style))
            story.append(Spacer(1, 6))
            story.append(table)
            story.append(Spacer(1, 8))
            continue

        # --- Handle Headings and Body Paragraphs ---
        # Look at the first line to identify headers or lists
        first_line = lines[0].strip()
        
        if first_line.startswith('# '):
            text = format_inline_markdown(first_line[2:])
            # Skip if it is the main title since we custom coded page 1
            if "CAMPUS E-MAGAZINE PLATFORM" in text or "COMPREHENSIVE PROJECT DOCUMENTATION" in text:
                continue
            story.append(Paragraph(text, styles['ReportHeading1']))
            
        elif first_line.startswith('## '):
            text = format_inline_markdown(first_line[3:])
            story.append(Paragraph(text, styles['ReportHeading1']))
            
        elif first_line.startswith('### '):
            text = format_inline_markdown(first_line[4:])
            story.append(Paragraph(text, styles['ReportHeading2']))
            
        elif first_line.startswith('#### '):
            text = format_inline_markdown(first_line[5:])
            story.append(Paragraph(text, styles['ReportHeading3']))

        elif first_line.startswith('---'):
            # Horizontal Divider rule
            divider = Table([[""]], colWidths=[504])
            divider.setStyle(TableStyle([
                ('LINEBELOW', (0,0), (-1,-1), 1, colors.HexColor('#E2E8F0')),
                ('BOTTOMPADDING', (0,0), (-1,-1), 0),
                ('TOPPADDING', (0,0), (-1,-1), 0),
            ]))
            story.append(Spacer(1, 10))
            story.append(divider)
            story.append(Spacer(1, 10))

        else:
            # Check if this block is a bullet list or number list
            list_paragraphs = []
            for line in lines:
                line_stripped = line.strip()
                if not line_stripped:
                    continue
                
                # Check for bullet marks: * or -
                if line_stripped.startswith('* ') or line_stripped.startswith('- '):
                    bullet_text = format_inline_markdown(line_stripped[2:])
                    list_paragraphs.append(Paragraph(f"&bull; &nbsp; {bullet_text}", styles['ReportBullet']))
                # Check for numbered bullets: 1. or 2.
                elif re.match(r'^\d+\.\s', line_stripped):
                    num_match = re.match(r'^(\d+)\.\s(.*)', line_stripped)
                    num = num_match.group(1)
                    num_text = format_inline_markdown(num_match.group(2))
                    list_paragraphs.append(Paragraph(f"{num}. &nbsp; {num_text}", styles['ReportBullet']))
                else:
                    para_text = format_inline_markdown(line_stripped)
                    list_paragraphs.append(Paragraph(para_text, styles['ReportBody']))
                    
            story.extend(list_paragraphs)

    # --- Build Document ---
    print(f"Generating PDF file: {pdf_filepath}...")
    doc.build(story, canvasmaker=NumberedCanvas)
    print("PDF generation completed successfully!")


if __name__ == "__main__":
    # Locate paths dynamically relative to workspace
    workspace_dir = os.path.dirname(os.path.abspath(__file__))
    md_file = os.path.join(workspace_dir, "Campus_E_Magazine_Project_Report.md")
    pdf_file = os.path.join(workspace_dir, "Campus_E_Magazine_Project_Report.pdf")
    
    if not os.path.exists(md_file):
        print(f"Error: Markdown file not found at {md_file}")
        sys.exit(1)
        
    try:
        build_pdf(md_file, pdf_file)
    except Exception as e:
        print(f"\nFailed to compile PDF: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
