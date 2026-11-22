"""Minimalny generator PDF (tekst, jedna strona) dla symulowanych formularzy – bez zależności.

Standardowa czcionka Helvetica (WinAnsiEncoding) nie ma części polskich liter, więc tekst
w PDF jest transliterowany (ą → a, ł → l…). Pola z polskimi znakami zwraca też JSON
narzędzia – PDF to podgląd symulacji, nie dokument do złożenia.
"""

from typing import Final

TRANSLITERATION: Final = str.maketrans("ąćęłńśźżĄĆĘŁŃŚŹŻ–„”", 'acelnszzACELNSZZ-""')
LINE_HEIGHT: Final = 18
TOP: Final = 800
LEFT: Final = 50


def _pdf_text(text: str) -> str:
    safe = text.translate(TRANSLITERATION).encode("cp1252", "replace").decode("cp1252")
    return safe.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def render_pdf(title: str, lines: list[str]) -> bytes:
    commands = [f"BT /F1 16 Tf {LEFT} {TOP} Td ({_pdf_text(title)}) Tj ET"]
    for index, line in enumerate(lines, start=2):
        y = TOP - index * LINE_HEIGHT
        commands.append(f"BT /F1 11 Tf {LEFT} {y} Td ({_pdf_text(line)}) Tj ET")
    stream = "\n".join(commands).encode("cp1252")

    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] "
        b"/Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
        b"<< /Length " + str(len(stream)).encode() + b" >>\nstream\n" + stream + b"\nendstream",
    ]
    out = bytearray(b"%PDF-1.4\n")
    offsets = []
    for number, body in enumerate(objects, start=1):
        offsets.append(len(out))
        out += f"{number} 0 obj\n".encode() + body + b"\nendobj\n"
    xref = len(out)
    out += f"xref\n0 {len(objects) + 1}\n0000000000 65535 f \n".encode()
    for offset in offsets:
        out += f"{offset:010d} 00000 n \n".encode()
    out += (
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode()
    )
    return bytes(out)
