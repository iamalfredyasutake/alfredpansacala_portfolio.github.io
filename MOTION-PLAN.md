# Repeatable writing and placement

| Surface | Treatment | Replay and interruption |
| --- | --- | --- |
| Heading and identity | Grapheme typing with a red I-beam caret; full accessible heading name retained. | On entry, on return in either direction, and on completed visible content after a 48px direction reversal. |
| Paragraphs, labels, numbers and lists | Words appear in order without changing the reserved layout. Numeric values are revealed intact, never counted up. | Same replay rules. First writing timeline max 1,400ms, later timelines max 1,050ms; 80ms opacity per token. |
| Portrait | Image settles with transform/opacity over 600ms, with a local placement pointer and four-handle red selection frame. | Replays on upward and downward visits. Error fallback remains hidden unless the image fails. |
| Red placement frames | Frames scale subtly and fade around their own content group. They do not change box dimensions. | Bounded to each writing timeline plus 420ms; no idle loops. |
| Controls and forms | Functional buttons stay immediately readable. Focus and input cancel the active group; a focused group is skipped before it starts. | Field values and current focus remain untouched. |
| Case sheets, career roles and story chapters | New information settles over 180ms with 8px translation and opacity, then joins the typing/frame system. | A replacement cancels the previous panel transition. Each case owns its layout; other records remain hidden without shared expansion state. |
| Quality lab | Tab selection reveals the relevant product fragment; workflow text types in place. Stage rules, selection color and sample corrections give immediate feedback. | Every sample owns its language/answer/correction state. No idle animation, fake loading or actual checkout action. |
| Guided brief | Each fieldset gets a short panel transition and local red placement frame. Progress segments reflect the current step. | Focus and input cancel writing; Back/Next retain values. Native validation blocks missing required fields. |
| Navigation | Existing icon rail, individual hover/focus names and compact mobile control. | Keyboard operation remains immediate. |

The registered groups include each independent QA exercise, with dynamic roots registered as selections change and detached roots unobserved. At most four run on desktop or two on mobile. One IntersectionObserver tracks viewport visits; a lightweight scroll callback tracks direction. No per-frame text layout writes or measurements, scroll locking, replacement of the real pointer, or pasting cursor remains. Easing uses cubic-bezier(.23,1,.32,1) and cubic-bezier(.77,0,.175,1); the writing timeline is linear. Reduced motion and Motion off keep the complete static page. Functional controls are never delayed for the decoration.

Contact delivery feedback remains immediately readable and excluded from writing-token decoration. The real Sending state lasts only while the network request is pending. Keyboard-driven tab/exercise changes bypass the panel movement. The reading-progress line updates its transform from scroll position and document size; it introduces no scroll locking or width animation.

## Independent label frames
Each numbered label is its own writing root with stable number and label children. Heading and introduction text are separate roots; the two-column heading container has no assembly frame. The fixed 4px reading-progress track owns a frame root and keeps its 2px transform-based fill. It participates in replay directly, without a viewport intersection margin excluding it at the top edge.

Direct text in flex/grid parents gets one temporary flow wrapper during typing, preserving the original anonymous text item and its gap behavior. The wrapper inherits its parent’s typography and is removed with all temporary tokens when complete or interrupted. Brand summaries and lists animate independently. Footer identity, center copy and Back to top each own their frame instead of framing the full footer grid. Existing concurrency limits, reduced-motion behavior and interruption rules are retained.
