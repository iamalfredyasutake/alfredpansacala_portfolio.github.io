# Quality in Motion

A portrait-led editorial canvas for Alfred Pansacala, with simulated editing cursors as the signature interaction. Reference: the bundled Figma DESIGN.md, using its monochrome frame, large type and whole-section color blocks. User-pinned reds replace the reference pastels; self-hosted Sora and Manrope replace proprietary fonts. This is an original portfolio, not a replica of Figma's product UI.

## Tokens
- Background #111112, surface #1c1c1e, raised #29292c, foreground #f6f5f2, muted #b9b8bc.
- Paper #edecea, paper ink #171719, paper secondary #515155.
- Red #b92736, bright red #ef5261, oxblood #641b28, pale red #f6d6d8.
- Sora variable for display (400–600), Manrope variable for body (400–700). Body 16–18px / 1.65; display 48–96px / 1.05, tracking -0.04em maximum.
- Spacing 4, 8, 12, 16, 24, 32, 48, 64, 96, 128px. Equal page margins: clamp(20px, 4.5vw, 72px). Content max 1320px.
- Flat editorial sections; 12px image radius; 8px input radius; pill controls. No shadow at rest. Glass is reserved for the explicitly requested floating navigation.
- Focus: visible 3px contrasting outline. Selection pale red / ink. Controls minimum 44px.

## Components and behavior
Hero: two-column name and black-and-white portrait, with QA, Language and AI lenses opening concise previews of real work. Metrics are selectable editorial figures with a shared scope explanation. They retain exact reported values instead of counting up.

Work: eleven complete project records in an index-and-case-sheet workspace. A selected record owns its dimensions; no neighboring card is stretched. The index scrolls vertically on desktop and becomes a horizontal strip on smaller screens. Every original project field and contribution paragraph remains in the HTML. Case sheets use paper surfaces, substantial type, a red scoped measure, and a thin ruled contribution/approach structure.

Career: a year-marked role timeline beside a complete selected-role panel, with skill tracing and real project links. Phones use a native role picker. The original searchable chronology remains a native archive below. Skills: a hands-on quality lab pairs a light product fragment with an oxblood workflow inspector. QA offers checkout totals, boundary validation, repeated payment requests, and search/empty-state recovery; localization and AI remain independent tasks. Each exercise exposes four meaningful stages. All 75 skills remain in the native toolkit archive.

About: Biology, Languages and Digital quality chapters preserve the original biography. An English/Tagalog/Cebuano booking sample demonstrates tone and text fit; it does not change the portfolio's main language or another sample's state. Contact: direct verified links plus a three-stage brief, a persistent summary, and an explicit Send project brief action through FormSubmit, with inline sending, accepted, activation and failure states. Email-app/copy fallbacks retain the same brief. Back/Next preserve entered values.

New content and control text is at least 12px, with most explanatory copy at 14–17px. Horizontal controls wrap; metric columns reflow according to their content width. Native archives remain independently sized. A document without JavaScript exposes all project sheets, all story chapters, the chronology and toolkit.

Desktop navigation is a straight glass rail centered on the right with Home, Projects, Expertise, Experience, Skills, About and Contact icons. At the top, labels sit beside the icons. After 90px of scrolling the surface folds to an icon rail; each name appears on pointer hover or keyboard focus. No diagonal arrows. Mobile uses a compact icon button after scrolling and an icon-and-label panel on tap. Escape closes it and returns focus. Reserved content space stays constant. No radial, half-circle or pie navigation.

## Motion
Text uses a real typing caret: short headings reveal by grapheme, and longer information reveals by word. All text stays in place with its full semantic content; temporary spans restore to the original text nodes after every run. The portrait and content groups use red selection frames with four corner handles. Placement cursors arrange objects; there are no pasting cursors.

Registered content groups replay after leaving and returning to the viewport. A meaningful change of scroll direction (48px of intent) also replays completed visible groups. No repeated animation fires while the page rests. Up to four groups run on desktop and two on mobile. The first writing sequence is capped at 1.4s; repeat sequences at 1.05s, with bounded frame fade-out afterward. CSS opacity animates text, WAAPI transform/opacity animates carets, image placement and red frames. Focus, typing, keyboard interaction, visibility changes and Motion off cancel decoration immediately. Panel changes settle over 180ms with an 8px move and opacity, canceling any previous transition on that panel. Dynamic selections refresh the assembly registry; detached roots are removed.

## Deliberate choices
One verified portrait leads; no invented work screenshots or unrelated stock to satisfy an image quota. Full source copy lives in content/portfolio.json and is generated into semantic HTML, including all eleven projects and sixteen complete roles. The page remains useful without JavaScript. Source project is unchanged.

## Numbered chapters and delivery states
The user-requested chapter labels pair a red tabular number with a small uppercase section name. Six primary chapters keep their provided numbers; outcome, learning, collaboration and principle sections are subchapters. The original headings and all professional content remain in place. The floating rail retains its prior motion, keyboard handling and mobile inset. A 2px progress line scales with document progress without animating width.

QA exercise choices wrap on desktop and become a labeled native picker on phones. Samples use the existing paper product fragment; each local panel owns its result and correction. New controls meet the 44px target and inputs remain 16px on phones. Contact feedback uses one inline status panel, with complete retained input, no new dialog or automatic email-app redirect.

## Final profile refinement
The full rail orders each icon before its label. A neutral active surface and short red edge marker follow the supplied reference. The collapsed surface remains a narrow icon rail, with individual hover/focus names. The portrait caption keeps location and availability above a ruled signature row; italic Georgia sets “Alfred P.” opposite the three-line quality statement. The full professional position remains readable above the hero introduction.

About uses warm gray-white #e5e4e0 with dark body text, muted gray supporting text and soft gray rules; its illustrative booking fragment retains paper and dark ink. Credentials use #191719. Collaboration categories use #d7d4cf and dark ink, two independently sized disclosure columns on desktop and one on phones. The seven lists contain 93 brand entries. Credential IDs wrap and the two certificate actions remain separate 44px targets. About download links occupy separate rows.

The footer uses three columns on desktop: small 16px identity with a CV action, centered quality/copyright, and Back to top. Phones place identity and Back to top above the centered lines. Chapter number and label are two stable children, with a maximum width that allows enlarged text to wrap without affecting a neighboring heading or paragraph.
