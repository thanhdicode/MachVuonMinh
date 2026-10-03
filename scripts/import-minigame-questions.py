"""Import the supplied DOCX questions, including yellow-highlighted answers.

Usage: python scripts/import-minigame-questions.py "../bo cau hoi.docx"
No Word/LibreOffice installation or third-party packages are needed.
"""

import argparse
import hashlib
import json
from pathlib import Path
import re
from xml.etree import ElementTree as ET
from zipfile import ZipFile

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
VAL = "{" + NS["w"] + "}val"
ROOT = Path(__file__).resolve().parents[1]


def extract(path):
    with ZipFile(path) as archive:
        root = ET.fromstring(archive.read("word/document.xml"))
    stages = [[] for _ in range(5)]
    stage = None
    current = None
    corrections = []

    def finish():
        if current is None:
            return
        assert len(current["a"]) == 4, f"Missing answers: {current['id']}"
        assert len(current["marked"]) == 1, f"Ambiguous highlight: {current['id']}"
        explanation = " ".join(current["explanations"]).strip()
        if explanation.startswith("(") and explanation.endswith(")"):
            explanation = explanation[1:-1].strip()
        # An obvious typing error in the supplied explanation, not an answer change.
        if "động đất, cách mạng nhất" in explanation:
            explanation = explanation.replace("động đất, cách mạng nhất", "năng động, cách mạng nhất")
            corrections.append({"id": current["id"], "from": "động đất", "to": "năng động"})
        assert explanation, f"Missing explanation: {current['id']}"
        stages[stage].append({
            "id": current["id"], "q": current["q"], "a": current["a"],
            "correct": current["marked"][0], "explain": explanation,
            "source": {"file": path.name, "stage": stage + 1, "question": current["number"]},
        })

    for paragraph in root.findall(".//w:body//w:p", NS):
        text = "".join(node.text or "" for node in paragraph.findall(".//w:t", NS))
        text = re.sub(r"\s+", " ", text).strip()
        if not text:
            continue
        heading = re.match(r"^GIAI ĐOẠN\s+([1-5])\s*:?$", text, re.IGNORECASE)
        question = re.match(r"^(\d+)\.\s*(.+)$", text)
        option = re.match(r"^([ABCD])\.\s*(.+)$", text)
        if heading:
            finish()
            current = None
            stage = int(heading[1]) - 1
        elif question:
            finish()
            assert stage is not None, "Question before stage heading"
            current = {"id": f"docx-s{stage + 1}-q{question[1]}", "number": int(question[1]),
                       "q": question[2], "a": [], "marked": [], "explanations": []}
        elif option:
            assert current is not None, "Answer before question"
            index = "ABCD".index(option[1])
            assert index == len(current["a"]), f"Unexpected answer order: {current['id']}"
            current["a"].append(option[2])
            if any(node.get(VAL) == "yellow" for node in paragraph.findall(".//w:highlight", NS)):
                current["marked"].append(index)
        else:
            assert current is not None, f"Unrecognized paragraph: {text}"
            current["explanations"].append(text)
    finish()
    assert all(stages), "Missing stage questions"
    ids = [q["id"] for stage_questions in stages for q in stage_questions]
    assert len(ids) == len(set(ids)), "Duplicate source question IDs"
    return stages, corrections


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", type=Path)
    args = parser.parse_args()
    stages, corrections = extract(args.source)
    data = json.dumps(stages, ensure_ascii=False, indent=2)
    (ROOT / "src/minigame/assets/document-questions.js").write_text(
        "// Imported from bo cau hoi.docx; yellow highlighting determines the correct answer.\n"
        "window.GAME_DOCUMENT_QUESTIONS = " + data + ";\n", encoding="utf-8")
    report = {"source": args.source.name, "sha256": hashlib.sha256(args.source.read_bytes()).hexdigest(),
              "counts": [len(stage) for stage in stages], "total": sum(len(stage) for stage in stages),
              "answerKeys": [["ABCD"[q["correct"]] for q in stage] for stage in stages], "copyCorrections": corrections}
    (ROOT / ".studio/qa/minigame/question-import-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Imported {report['total']} questions; counts per stage: {report['counts']}")


if __name__ == "__main__":
    main()
