# /// script
# requires-python = ">=3.11"
# dependencies = ["fpdf2>=2.8"]
# ///
"""Render the persona JSON files to readable Markdown CVs and a few PDF CVs.

Usage (from the repo root): uv run starter/data/scripts/render.py
"""
import json
from datetime import date, datetime, timezone
from pathlib import Path

from fpdf import FPDF

DATA = Path(__file__).resolve().parent.parent
PROFILES = DATA / "profiles"
PDF_PERSONAS = ["erik-exempelsson", "amira-provsson", "karin-mallgren"]
# Fixed "today" (the conference date) so ongoing assignments render the same every run.
TODAY = date(2026, 10, 16)

NOTE = "Syntetisk exempelprofil för NOIRs höstkonferens 2026. Personen och uppdragen är påhittade."
PROFICIENCY = {"native": "Modersmål", "fluent": "Flytande", "professional": "Professionell", "basic": "Grundläggande"}


def load_taxonomy():
    tax = json.loads((DATA / "skills" / "taxonomy.json").read_text())
    labels = {c["name"]: c["labelSv"] for c in tax["categories"]}
    parents = {s["name"]: s["parent"] for s in tax["skills"]}
    return labels, parents


def months(start, end):
    s = date.fromisoformat(start)
    e = date.fromisoformat(end) if end else TODAY
    return s.year * 12 + s.month, e.year * 12 + e.month


def skill_years(profile, parents):
    """Years per skill from experience periods, with children rolled up into parents."""
    intervals = {}
    for exp in profile["experiences"]:
        period = months(exp["startDate"], exp["endDate"])
        for name in exp["skills"]:
            for n in {name, parents.get(name)} - {None}:
                intervals.setdefault(n, []).append(period)
    years = {}
    for name, periods in intervals.items():
        total, cur = 0, None
        for s, e in sorted(periods):
            if cur and s <= cur[1]:
                cur = (cur[0], max(cur[1], e))
            else:
                if cur:
                    total += cur[1] - cur[0]
                cur = (s, e)
        total += cur[1] - cur[0]
        years[name] = total // 12
    return years


def period(exp):
    end = exp["endDate"][:7] if exp["endDate"] else "pågående"
    return f"{exp['startDate'][:7]} – {end}"


def sections(p, labels, parents):
    """Profile as (heading, lines) pairs in Swedish, shared by Markdown and PDF."""
    years = skill_years(p, parents)
    out = []
    by_cat = {}
    for s in p["skills"]:
        y = years.get(s["name"], 0)
        by_cat.setdefault(s["category"], []).append(f"{s['name']} ({y} år)" if y else s["name"])
    out.append(("Kompetenser", [f"- **{labels[c]}:** {', '.join(v)}" for c, v in by_cat.items()]))
    exps = []
    for e in p["experiences"]:
        roles = ", ".join(r["title"]["sv"] for r in e["roles"])
        exps += [f"### {e['clientName']} · {roles} · {period(e)}", "", e["description"]["sv"], ""]
        exps += [f"- **{r['title']['sv']}:** {r['description']['sv']}" for r in e["roles"]]
        exps += ["", f"*Kompetenser:* {', '.join(e['skills'])}", ""]
    out.append(("Uppdrag", exps[:-1]))
    out.append(("Utbildning", [
        f"- {e['degree']['sv']}, {e['fieldOfStudy']['sv']}, {e['institution']} ({e['startYear']}–{e['endYear'] or ''})"
        for e in p["education"]]))
    if p["certifications"]:
        out.append(("Certifieringar", [
            f"- {c['name']}, {c['issuer']} ({c['issuedDate'][:4]}"
            + (f", giltig till {c['expiryDate']}" if c["expiryDate"] else "") + ")"
            for c in p["certifications"]]))
    out.append(("Språk", [f"- {l['language']}: {PROFICIENCY[l['proficiency']]}" for l in p["languages"]]))
    return out


def to_markdown(p, labels, parents):
    lines = [f"# {p['user']['fullName']}", "", f"**{p['title']['sv']}** – {p['tagline']['sv']}", "",
             p["bio"]["sv"], ""]
    lines += [f"- **{h['label']['sv']}:** {h['value']['sv']}" for h in p["highlights"]] + [""]
    for heading, body in sections(p, labels, parents):
        lines += [f"## {heading}", "", *body, ""]
    lines.append(f"*{NOTE}*")
    return "\n".join(lines) + "\n"


def latin1(text):
    # fpdf2's core fonts are Latin-1; replace the few typographic characters we use and
    # turn anything else outside Latin-1 into "?" instead of failing.
    text = text.replace("–", "-").replace("·", "|").replace("’", "'").replace("**", "").replace("*", "")
    return text.encode("latin-1", "replace").decode("latin-1")


def to_pdf(p, labels, parents, path):
    pdf = FPDF(format="A4")
    pdf.set_creation_date(datetime(2026, 10, 16, tzinfo=timezone.utc))  # stable output between runs
    pdf.set_margins(18, 18, 18)
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 20)
    pdf.cell(0, 10, latin1(p["user"]["fullName"]), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "B", 12)
    pdf.cell(0, 7, latin1(p["title"]["sv"]), new_x="LMARGIN", new_y="NEXT")
    pdf.set_font("Helvetica", "I", 10)
    pdf.multi_cell(0, 5, latin1(p["tagline"]["sv"]), new_x="LMARGIN", new_y="NEXT")
    pdf.ln(3)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5, latin1(p["bio"]["sv"]), new_x="LMARGIN", new_y="NEXT")
    for heading, body in sections(p, labels, parents):
        pdf.ln(4)
        pdf.set_font("Helvetica", "B", 13)
        pdf.cell(0, 7, latin1(heading), new_x="LMARGIN", new_y="NEXT")
        for line in body:
            if line.startswith("### "):
                pdf.ln(2)
                pdf.set_font("Helvetica", "B", 10)
                pdf.multi_cell(0, 5, latin1(line[4:]), new_x="LMARGIN", new_y="NEXT")
            elif line:
                pdf.set_font("Helvetica", "I" if line.startswith("*Kompetenser") else "", 10)
                pdf.multi_cell(0, 5, latin1(line.replace("- ", "  - ", 1) if line.startswith("- ") else line),
                               new_x="LMARGIN", new_y="NEXT")
    pdf.ln(6)
    pdf.set_font("Helvetica", "I", 8)
    pdf.multi_cell(0, 4, latin1(NOTE), new_x="LMARGIN", new_y="NEXT")
    pdf.output(str(path))


def main():
    labels, parents = load_taxonomy()
    for folder in ("md", "pdf"):
        (PROFILES / folder).mkdir(exist_ok=True)
    for path in sorted((PROFILES / "json").glob("*.json")):
        p = json.loads(path.read_text())
        (PROFILES / "md" / f"{path.stem}.md").write_text(to_markdown(p, labels, parents))
        if path.stem in PDF_PERSONAS:
            to_pdf(p, labels, parents, PROFILES / "pdf" / f"Konsultprofil - {p['user']['fullName']}.pdf")
    print("rendered", len(list((PROFILES / "md").glob("*.md"))), "Markdown CVs and", len(PDF_PERSONAS), "PDFs")


if __name__ == "__main__":
    main()
