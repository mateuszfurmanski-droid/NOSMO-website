# Nexus screenshot requests — implementation comparison

Source: Mateusz's four screenshots supplied on 31 October 2026. Continue the existing relationship map and multimedia console; no separate application.

| Request | Implementation and evidence |
| --- | --- |
| Reuse the old multimedia player | Existing `nx-pti` console retained; file icon replaces VOL. |
| Sort automatically on addition | Atomic device ingestion keeps immutable actual `addedAt` and stable same-time addition order. Player and vertical document positions use that sequence. |
| File arrows visit individual chronological files | Previous/Next remain single-file actions. Play and the slider also visit recorded migration/lifecycle events. |
| Google preview stays inside Nexus | Bounded viewer above the console; file icon toggles preview. Next replaces an open preview and keeps a closed preview closed. Public source fallback retained. Local device bytes are never sent to Google. |
| Collapsible panel retains date, time, arrows and slider | Compact layout uses the same mounted player, preserves preview and selection and saves layout per project. |
| Know addition hours | New device files retain actual UTC addition time including seconds. Original Nexus addition times for the 106 legacy remote source files are unknown; publication dates never become invented upload hours. |
| File deactivation and one Archive tile | Effective deadlines project files out of active nodes into one fixed Archive. Metadata and bytes remain recoverable; reactivation retains prior archive intervals. |
| Animate arrivals, departures, archive moves and connection changes | Existing motion layer shows world-coordinate travel and animated routes, with active-node highlighting and recorded connection checkpoints. Reduced-motion preferences are respected. |
| One scrollable bottom navigation bar | React owns one row. Legacy top menu/clock and separate addon tile insertion are disabled for this shell. Horizontal touch scrolling and labelled left/right controls expose overflow. |
| TimeSpace replaces calendar; System contains menu | TimeSpace has one main tile. System opens the retained menu, with settings and the existing demo access-profile control. |
| Files includes Docs and Cloud | No Docs or Cloud main tile. Files opens an upward folder containing Project files and Cloud sources side by side. The complete source/device catalog remains the file entry point. |
| Brain + N, Ask Nexus tile | Dedicated SVG brand mark. Ask searches actual current-project source/device metadata and reveals the selected file in the existing tree, or its Archive entry when expired. No canned Halifax status response is used. This local search is not a connected generative AI service. |

The shell still uses existing BIM/software, integrations, people, trades and source panels. External connectors and FabStation are not newly connected by these navigation changes. The public source catalog has 95 records / 106 files, not an invented operational employee/task database.

Validation: existing timeline, graph, persistence, preview and archive integration suite plus five navigation regressions (one-row routing, Files/Cloud, real metadata search, error handling/world isolation, focus and access filtering, horizontal scrolling). Browser checks on the proposed code cover desktop, a 390px Catania frame and an 850px Riverside frame. Physical Android hardware and server/account synchronization remain unverified.

## Follow-up: fit, separation and imported folders

All active file folders sit outside the core project circle. Default folders use the catalog's actual categories; a Files import selector can instead keep each import batch together, with a native directory picker preserving its relative paths and root folder label. Category mode splits a selected batch by its inferred/supplied categories. Derived folders do not overwrite manual memberships, historical connections, original timestamps or file bytes. Expanded members remain chronological within their category.

The graph chooses rows/columns from the available aspect ratio, reserves the core circle and separates overlapping core positions. One responsive Archive participates in fitting alongside the folders. Expanding/collapsing, ingestion, lifecycle changes, resize and player expansion recalculate the complete visible graph. Header, bottom navigation and TimeSpace reserve space; manual pan/zoom are bounded to keep every resting tile visible. There is no minimum fit zoom that would clip large sets. Reflow applies collision-free positions directly; the existing migration overlay retains animated file arrivals/departures and Archive/connection routes. A large expanded folder on a small screen consequently has smaller tiles; file details remain available in the viewer.

Validation: 151 tests pass, including geometry over seven wide/tall/square aspects with up to 106 external tiles, reserved overlay areas, bounded pan/zoom, actual React folder expansion/ingestion/trash/restore, batch metadata/bytes after reload, import preference isolation and LIVE clock refresh preserving a user's open folder. Browser checks cover desktop, 390×820 portrait, 850×390 landscape and a 47-file expanded category with full/compact TimeSpace. Physical device frame timing remains unverified.

## Follow-up: Explorer instead of an expanded tile field

The latest request supersedes expanding automatic folders into map tiles. The modern shell now uses `data-nexus-file-layout="explorer"`: one Files hub and one Archive sit outside the retained core circle, with existing core trade tiles routing directly to their matching directory. The unmodified demo starts with 11 map tiles. Browsing a folder never expands its files onto the map; an explicitly revealed/TimeSpace-selected file may appear individually. Manual drag groups remain supported.

File Explorer browses Trades → Topics → Files, Topics → Trades → Files, or Imports → retained directory hierarchy. Existing/imported files are grouped automatically from explicit metadata or labelled name/title suggestions. Several trade hints use Multidiscipline, and unclear files stay in Unassigned. Manual trade correction is reversible and persisted per project on this device. This does not read PDF contents or invent confirmed trade assignments.

Breadcrumbs, Back/Up, global search, chronological/name sorting, status selection, 25-row pagination, inline single-file preview and per-file details/lifetime replace the enlarged map view. File details return to the same directory; Archive uses the same Explorer in archived scope. Batch preference selects the Imports view by default. Folder browsing and correction preserve file IDs, bytes, timestamps and recorded connection history. Snapshot views cannot modify assignments or lifetime.

Validation: 162 tests pass, including actual React folder navigation, all106source-file reachability in each view, retained directory/batch structure, pagination, selection/preview switching, import callbacks/failures, saved corrections/failure rollback/world isolation, lifecycle return to Archive and compact-map integration. Browser checks cover 390px and850px frames, 11mapnodes, no horizontal overflow on mobile, MEP→Research navigation and embedded Google preview. The bundle is also parsed as an ES module, matching the browser script type.

## Follow-up: Windows 7 style folder views and options

View now offers Extra large icons, Large icons, Medium icons, Small icons, List, Details, Tiles and Content. The same layouts apply to folders and files without changing their virtual paths, metadata, immutable addition times or selected/previewed file. Details adds size and sortable column headers; name/type/size/date sorting, ascending/descending direction and grouping by trade/topic/type/name/year apply before the existing 25-row pagination. Group counts explicitly refer to the current page.

Folder options support single/double-click folder opening (keyboard activation still opens), filename extension visibility, the file details pane, remembering each folder's view, applying the current view to all folders and restoring defaults. Settings persist on this device per project; malformed settings fall back to defaults and failed storage writes retain the previous view. Hiding extensions never renames files, and hiding the details pane retains preview/details actions.

Validation: 168 tests pass, including six added presentation/options regressions covering all eight layouts, preserved file IDs/order/selection/preview, saved per-folder settings and world isolation, apply-all/reset, double-click/Enter, sorting/grouping, option focus/Escape and corrupt/failed storage. Browser QA covers desktop and 390px/850px frames with the native view menu and folder options. Private review publication uses the same existing Explorer Site URL.

## Follow-up: Explorer navigation and context actions

Back/Forward now retain the folder route, search text, status, page and selection; navigating a new branch clears Forward. Every file/folder offers a separate touch-accessible More (⋮) button and a right-click menu in all eight views. Folder actions open normally, open directly as List, or open Folder options. File actions preview, show details/lifetime, locate the containing directory or reveal an active file on the map. Historical snapshots do not offer live map actions or lifetime edits. No new destructive action or file-byte mutation is introduced.

Keyboard support adds Alt+Left/Right/Up, Ctrl/Cmd+F, Enter preview, Up/Down/Home/End selection on the visible page, and Shift+F10/menu key. Context menus have arrow-key focus, Escape closes only the menu and returns focus, and pointer actions outside dismiss it. Menus are bounded to the Explorer viewport. More buttons are siblings of the main item button and retain their own 28×32 area across layout styles; details-only folders no longer render an empty extra table.

Validation: 172 tests pass, including four added React regressions for history snapshots/branching, file menus across all views, folder context/List actions, keyboard and snapshot restrictions. Browser QA covers actual pointer/menu hit regions and navigation on 390px/850px views. The existing private review URL is retained.
