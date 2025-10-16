python3 <<'PY'
import re, sys, os
INDEX = "/srv/games/www/crossword/index.html"

with open(INDEX, "r", encoding="utf-8") as f:
    src = f.read()

inject = r"""
function clueHasAbbrev(clue){
  if(!clue) return true;
  const s = String(clue).trim();
  if (/\b(abbr|abbrev|abbreviation|initialism|acronym|short\s*for)\b/i.test(s)) return true;
  if (/(^|\s)([A-Za-z]\.){2,}(\s|$)/.test(s)) return true; // U.S., I.B.M.
  if ((s.match(/\b[A-Z]{2,3}\b/g)||[]).length >= 2) return true;
  if (/^["'`-]{1,3}\s*$/.test(s)) return true;
  if (s.length < 3) return true;
  return false;
}
function isProbAcronym(ans, raw){
  if (/[._\-\s0-9\\/]/.test(raw||"")) return true;      // phrasal/marked
  if (!/^[A-Z]+$/.test(ans)) return true;               // non-alpha
  if (ans.length <= 2) return true;
  if (ans.length <= 5 && !/[AEIOU]/.test(ans) && !["ION","ARK","ERA","EON","ICE","ORE","INK","OWL","EMU","ANT","DOG","CAT","BAT"].includes(ans)) return true;
  if (ans.length <= 5 && (ans.match(/[QXZJ]/g)||[]).length >= 2) return true;
  return false;
}
function sanitizeEntries(entries){
  const out=[];
  for(const e of entries){
    const raw = e.answer||"";
    const ans = raw.toUpperCase().replace(/[^A-Z]/g,'');
    if(!ans || ans.length<3) continue;
    const clue = String(e.clue||"").trim();
    if (isProbAcronym(ans, raw)) continue;
    if (clueHasAbbrev(clue)) continue;
    out.push({answer:ans, clue: clue || ans});
  }
  return out;
}
""".strip()

pattern = re.compile(r"function\s+sanitizeEntries\s*\(\s*entries\s*\)\s*\{.*?\}\s*", re.DOTALL)
if pattern.search(src):
    src = pattern.sub(inject + "\n", src)
else:
    ins_pt = src.find("/* ---------- Utilities ---------- */")
    if ins_pt != -1:
        src = src[:ins_pt] + inject + "\n\n" + src[ins_pt:]
    else:
        src = src.replace("</script>", inject + "\n</script>")

bak = INDEX + ".patchbak"
with open(bak, "w", encoding="utf-8") as f: f.write(src)
os.replace(bak, INDEX)
print("Patched:", INDEX)
PY
