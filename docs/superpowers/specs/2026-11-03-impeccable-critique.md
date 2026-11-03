# Impeccable critique — 2026-11-03

Method: dual-agent (A: live-site design review of matchoji.vercel.app at 375px and desktop, light and
dark, plus source review for signed-in surfaces; B: `impeccable detect` over `src/app`,
`src/features`, `src/components/widgets`). Live catalogue at review time: 18 teas, none rated.

## Design health: 26/40 (Good)

| #   | Heuristic                       | Score | Key issue                                                            |
| --- | ------------------------------- | ----- | -------------------------------------------------------------------- |
| 1   | Visibility of system status     | 3     | "Top rated" labels give no hint nothing is rated                     |
| 2   | Match system / real world       | 2     | "Top-rated" over unrated teas; "tight" supply jargon on region cards |
| 3   | User control and freedom        | 3     | Clear filters and Back to search exist                               |
| 4   | Consistency and standards       | 2     | h1 sizes split across pages; two rate UIs on the tea page            |
| 5   | Error prevention                | 3     |                                                                      |
| 6   | Recognition rather than recall  | 3     | Mobile Filters sits above search                                     |
| 7   | Flexibility and efficiency      | 2     | Log dialog has no progressive disclosure                             |
| 8   | Aesthetic and minimalist design | 2     | 9+ decisions in the product hero; empty sections with big headers    |
| 9   | Error recovery                  | 3     |                                                                      |
| 10  | Help and documentation          | 3     |                                                                      |

Detector: one advisory (`text-[10px]` in the notification badge, off the type ramp). Pills, fonts,
flat surfaces and tokens all clean.

Strengths: the tin-on-tile system makes a photo-less catalogue look intentional; category colour
discipline holds in both themes; empty copy is honest and Learn is well ordered.

## Findings, ranked by impact

| #   | Impact | Surface             | Issue                                                                                    | Fix                                                                   | Status                              |
| --- | ------ | ------------------- | ---------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| 1   | High   | Tea page            | Two rating UIs: hero "Rate it" and a lone "Add your rating" card beside "No reviews yet" | Show the card only when the tea has reviews                           | Done                                |
| 2   | High   | Home, Explore       | "Top-rated" shelves and score dashes with 0 of 18 rated                                  | Shelf title "… to try" while all unrated; hide the dash on phone rows | Done                                |
| 3   | High   | Log dialog          | ~20 fields at once, Save far below the fold on phones                                    | Collapse taste/prep/harvest under "Add taste details"; sticky Save    | Not done (see below)                |
| 4   | High   | Tea page, phone     | Hero ~1.7 screens tall                                                                   | Smaller image, tighter gaps and padding                               | Done (stock panel kept in the band) |
| 5   | Medium | Stock panel         | "Checked it lately?" with In stock / Sold out pills reads as unexplained controls        | Reword to the question it asks                                        | Done                                |
| 6   | Medium | Explore rows, phone | "Mid-range" wraps mid-word; score column squeezes names                                  | `whitespace-nowrap`; no dash column when unrated                      | Done                                |
| 7   | Medium | Dark tins           | `brightness-150` whitens cream labels, oversaturates hojicha                             | `brightness-125 saturate-90`                                          | Done                                |
| 8   | Medium | Regions             | Prefecture eyebrow repeats the title; bare "Matcha tight"                                | Hide duplicate eyebrow; "Supply:" prefix                              | Done                                |
| 9   | Medium | Journal, Account    | h1 one step larger than every other page                                                 | `text-3xl sm:text-4xl`                                                | Done                                |
| 10  | Medium | Footer              | Right-aligned links far from tagline; take-down line on every page                       | Re-layout footer                                                      | Not done (see below)                |
| 11  | Low    | Journal             | Tall empty panel on phones                                                               | `py-10 sm:py-16`, side padding                                        | Done                                |
| 12  | Low    | Home hero, phone    | No tea above the fold                                                                    | Tighter circle and section spacing                                    | Done                                |
| 13  | Low    | Learn cards         | Brand-green tint breaks "green is for actions"                                           | Neutral tile                                                          | Done                                |
| 14  | Low    | Tea page            | Empty sections each carry a 64px gap                                                     | Tighter stack on phones                                               | Done (stack only)                   |
| 15  | Low    | Notification badge  | 10px type off the ramp                                                                   | 11px                                                                  | Done                                |

## Not done

- **Log dialog disclosure and sticky Save (#3):** `rate-product-form.tsx` and the dialog are being
  edited by the label-scanning builder, and hiding fields changes the logging flow and its tests.
  Worth a separate pass once scanning lands.
- **Footer re-layout (#10):** touches a tested layout shared by every page for a modest gain; the
  take-down line is also a content/legal call.
- **Explore "none rated yet" count suffix, mobile Filters/Sort row (#15 in A's list):** low impact.
- **Hiding "Where to buy" when empty:** it is a deliberate empty state; left as is.
- **Stock panel moved out of the hero:** a layout change to the page's information order.
- **"Check Aiya's shop" link colour:** low, mixed intent with the stock panel.
