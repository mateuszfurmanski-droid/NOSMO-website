"""Rebuild the marked graph and navigation components; retain other bundled modules."""
from pathlib import Path
root=Path(__file__).resolve().parents[1]
bundle=root/'apps/nexus-graph-preview/assets/index-CWI-Glgh.js'
src=root/'apps/nexus-graph-preview/relationship-tree/src'
text=bundle.read_text()
dock_start=text.index('/* NEXUS UNIFIED DOCK START */') if '/* NEXUS UNIFIED DOCK START */' in text else text.index('function cU({')
dock_end=text.index('/* NEXUS UNIFIED DOCK END */')+len('/* NEXUS UNIFIED DOCK END */') if '/* NEXUS UNIFIED DOCK END */' in text else text.index('const ts=',dock_start)
text=text[:dock_start]+'/* NEXUS UNIFIED DOCK START */\n'+(src/'navigation-dock.js').read_text()+'\n/* NEXUS UNIFIED DOCK END */\n'+text[dock_end:].lstrip('\n')
start=text.index('/* NEXUS TILE GROUPS START */') if '/* NEXUS TILE GROUPS START */' in text else text.index('function NexusLinkEditor')
if '/* NEXUS TILE GROUPS END */' in text:
    end=text.index('/* NEXUS TILE GROUPS END */')+len('/* NEXUS TILE GROUPS END */')
else:
    end=text.index('function ',text.index('function AU(){')+15)
replacement='/* NEXUS TILE GROUPS START */\n'+(src/'tile-groups.js').read_text()+'\n'+(src/'local-files.js').read_text()+'\n'+(src/'file-playback.js').read_text()+'\n'+(src/'project-files.js').read_text()+'\n'+(src/'file-explorer.js').read_text()+'\n'+(src/'timespace-model.js').read_text()+'\n'+(src/'timespace-view.js').read_text()+'\n'+(src/'timespace-player.js').read_text()+'\n'+(src/'graph-history.js').read_text()+'\n'+(src/'file-lifecycle.js').read_text()+'\n'+(src/'graph-motion.js').read_text()+'\n'+(src/'relationship-map.js').read_text()+'\n/* NEXUS TILE GROUPS END */'
bundle.write_text(text[:start]+replacement+text[end:])
