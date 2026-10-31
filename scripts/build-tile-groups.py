"""Replace only the existing persistent graph component; retain all other bundled modules."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bundle=root/'apps/nexus-graph-preview/assets/index-CWI-Glgh.js'
src=root/'apps/nexus-graph-preview/relationship-tree/src'
text=bundle.read_text()
start=text.index('/* NEXUS TILE GROUPS START */') if '/* NEXUS TILE GROUPS START */' in text else text.index('function NexusLinkEditor')
if '/* NEXUS TILE GROUPS END */' in text:
    end=text.index('/* NEXUS TILE GROUPS END */')+len('/* NEXUS TILE GROUPS END */')
else:
    end=text.index('function ',text.index('function AU(){')+15)
replacement='/* NEXUS TILE GROUPS START */\n'+(src/'tile-groups.js').read_text()+'\n'+(src/'project-files.js').read_text()+'\n'+(src/'timespace-model.js').read_text()+'\n'+(src/'timespace-view.js').read_text()+'\n'+(src/'relationship-map.js').read_text()+'\n/* NEXUS TILE GROUPS END */'
bundle.write_text(text[:start]+replacement+text[end:])
