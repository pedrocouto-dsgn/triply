# SPEC — Module 03: Destinations & Travel Legs

Version: 1.2  
Status: APPROVED (v1.1 amendment approved by owner request, 2026-10-05)
Module ID: `03-destinations-legs`  
Depends on: `spec/00-product.md`, `spec/02-trips.md`, `AGENTS.md`, `docs/adr/ADR-003-time-and-route-model.md`  
Primary handoff: Module 04 — Budget & Expenses

---

## 1. Purpose

Allow the user to turn a Trip into an ordered multi-destination route.

This module introduces two core concepts:

1. **Stop** — a place where the traveller stays or intentionally spends time;
2. **Travel Leg** — the movement between two adjacent route points.

The model must support a journey such as:

`Lisboa [origin boundary] → Paris → Brussels → Amsterdam → Berlin → Prague → Lisboa [return boundary]`

without reducing the trip to a single origin/destination pair.

---

## 2. Product outcome

When this module is complete, the user can:

1. add one or more destinations to an existing Trip;
2. define city/place, country and stay dates for each destination;
3. see the destinations in chronological route order;
4. reorder destinations intentionally;
5. add the transport used between adjacent route points;
6. distinguish plane, train, bus, car, ferry and other transport;
7. add departure/arrival date and time, operator and booking reference to a leg;
8. optionally add the expected/known transport price without turning this module into the financial ledger;
9. mark whether the transport is planned, booked, paid, cancelled or completed;
10. edit or remove destinations and legs with conflict-safe behaviour;
11. see route gaps and inconsistencies clearly;
12. preserve existing booking/financial information when route order changes instead of silently deleting it;
13. continue to Module 04 with a structurally valid route.

---

## 3. Actors

### 3.1 Authenticated user — owner of the Trip

Can create, read, edit, reorder and remove Stops and Travel Legs belonging to their Trip.

### 3.2 Authenticated user — not owner

Has no access to the Trip, Stops or Travel Legs.

### 3.3 Visitor

Has no access to route data.

---

## 4. Scope

### Included

- destination/Stop creation;
- destination editing;
- destination removal;
- ordered route;
- arrival and departure dates per Stop;
- country + city/place labels;
- optional timezone metadata resolved from location when available;
- route reordering;
- route validation;
- Travel Leg creation;
- Travel Leg editing;
- Travel Leg deletion;
- origin-boundary → first Stop leg;
- Stop → Stop legs;
- last Stop → return-boundary leg;
- transport modes;
- departure/arrival dates and times;
- operator/provider;
- booking/reference identifier;
- optional notes;
- optional transport price snapshot;
- booking/payment state for the transport item;
- route gaps and conflict states;
- ownership / RLS requirements;
- empty, loading, error and success states;
- acceptance scenarios for QA.

### Explicitly out of scope

- interactive maps and route geometry;
- geolocation tracking;
- automatic flight/train/bus search;
- booking external transport;
- automatic schedules from transport providers;
- real-time delays;
- ticket PDF storage;
- generic reservations management;
- expense ledger transactions;
- currency conversion;
- itinerary activities inside a Stop;
- collaboration;
- AI route generation;
- visa/border advice;
- automatic country entry requirements.

Those belong to later modules or future product scope.

---

## 5. Canonical concepts

### 5.1 Stop

A Stop is a destination intentionally included in the Trip route.

Conceptual fields:

| Field | Requirement |
|---|---|
| `id` | Stable unique identifier |
| `trip_id` | Required parent Trip |
| `position` | Required route order |
| `place_name` | Required city/place label |
| `country_code` | Required ISO 3166-1 alpha-2 country code when resolvable |
| `country_name` | Required display value |
| `arrival_date` | Required calendar date |
| `departure_date` | Required calendar date |
| `timezone` | Optional IANA timezone; recommended when resolvable |
| `notes` | Optional |
| `created_at` | Required |
| `updated_at` | Required |

The Database/Architecture agents may normalize location fields but may not change the product meaning without a spec change.

### 5.2 Travel Leg

A Travel Leg represents one movement between **adjacent route points**.

A route point can be:
- the Trip origin boundary;
- a Stop;
- the Trip return boundary.

Conceptual fields:

| Field | Requirement |
|---|---|
| `id` | Stable unique identifier |
| `trip_id` | Required |
| `from_type` / `from_id` | Must resolve to current adjacent source route point |
| `to_type` / `to_id` | Must resolve to current adjacent destination route point |
| `mode` | Required transport mode |
| `status` | Required |
| `departure_date` | Optional until known |
| `departure_time` | Optional |
| `departure_timezone` | Optional but recommended when time exists |
| `arrival_date` | Optional until known |
| `arrival_time` | Optional |
| `arrival_timezone` | Optional but recommended when time exists |
| `operator` | Optional |
| `reference` | Optional |
| `price_amount` | Optional non-negative amount |
| `price_currency` | Required if a price exists |
| `notes` | Optional |
| `created_at` | Required |
| `updated_at` | Required |

The definitive financial treatment of the price is governed by Module 04. A price stored here is route/booking context and must not independently create an expense transaction unless Module 04 explicitly defines that behaviour.

---

## 6. Route model

### 6.1 Canonical sequence

A Trip route is derived from:

`[optional origin boundary] + ordered Stops + [optional return boundary]`

Examples:

**One Stop**  
`Lisboa → Madrid → Lisboa`

**Multiple Stops**  
`Lisboa → Paris → Brussels → Amsterdam → Berlin → Prague → Lisboa`

**No route boundaries**  
`Paris → Brussels → Amsterdam`

The absence of origin or return boundaries must not prevent multi-destination planning.

### 6.2 Stops are not route boundaries

Origin and final return labels from Module 02 remain Trip properties and must never be duplicated as Stops automatically.

If the traveller actually stays in the origin city during the journey, the user may deliberately add that city as a Stop as well.

### 6.3 Unlimited product model

The product must not impose a business-rule maximum number of Stops in the MVP.

Technical abuse-protection limits may exist if necessary but must not alter normal product behaviour or create a low arbitrary cap.

---

## 7. Stop business rules

### RN-03-01 — Required destination identity

A Stop requires:
- place/city name;
- country;
- arrival date;
- departure date.

The system must not require a street address.

### RN-03-02 — Stop dates

For each Stop:
- `departure_date >= arrival_date`;
- same-day Stops are allowed;
- Stop dates must fall within the parent Trip's date range;
- no child record may be silently deleted when dates change.

### RN-03-03 — Chronological order

The route position and dates must agree.

For adjacent Stops A and B:
- B cannot arrive before A arrives;
- normally B arrival should be on or after A departure;
- overlapping destination stays are not allowed in the MVP.

This means:

`A.departure_date <= B.arrival_date`

A same-day transition is valid.

### RN-03-04 — Gaps are allowed

A date gap between Stop A departure and Stop B arrival is allowed because overnight transport, unplanned time or transit may exist.

The UI should flag a gap as informational when no matching Travel Leg explains it, but it must not block the route solely because a gap exists.

### RN-03-05 — Duplicate destinations

The same city or country may appear multiple times in the same Trip.

Example:

`Lisboa → Madrid → Paris → Madrid → Lisboa`

No uniqueness constraint may prevent this.

### RN-03-06 — Editing Stop dates

Editing a Stop must validate:
- Trip boundaries;
- previous Stop;
- next Stop;
- attached Travel Legs;
- future itinerary records once Module 06 exists.

If an edit creates conflicts, the system must present the conflict and require resolution. It must not silently move neighbouring Stops or delete dependent data.

### RN-03-07 — Deleting a Stop

Deleting a Stop is destructive because it changes route adjacency.

Before deletion, the user must see:
- Stop being removed;
- dependent Travel Legs affected;
- dependent data count when later modules add itinerary/reservations/expenses/documents.

In this module, deletion must not automatically delete unrelated route data.

If removing B from `A → B → C`, any legs `A → B` and `B → C` become affected and must be handled through the route reconciliation rules below.

---

## 8. Ordering and reordering

### RN-03-08 — Explicit position

Stop order must be represented explicitly and persistently. It must not rely only on creation timestamp.

### RN-03-09 — Reorder operation

The user may reorder Stops.

The operation must:
1. calculate the proposed new sequence;
2. validate Stop date chronology;
3. identify affected Travel Legs;
4. show conflicts before committing destructive changes;
5. preserve unaffected Legs;
6. never silently reinterpret a booked Leg as transportation between different cities.

### RN-03-10 — Reordering with date conflicts

If the new position conflicts with existing dates, the route must not be silently saved as valid.

The interface must offer a resolution path, such as:
- cancel reordering;
- edit affected dates;
- save only after the sequence is chronologically valid.

Automatic bulk date shifting is out of scope for the MVP.

### RN-03-11 — Travel Leg reconciliation

When adjacency changes, a Travel Leg may fall into one of three states:

**Unaffected** — endpoints remain adjacent; preserve unchanged.

**Orphaned/Needs review** — one or both endpoints still exist but are no longer adjacent; preserve the record temporarily and mark it for user review rather than silently deleting or retargeting it.

**Deleted endpoint** — an endpoint Stop was deleted; require explicit handling of the dependent Leg during the destructive flow.

The implementation may model this with a technical state, reconciliation table or transaction flow, but the user-facing behaviour above is mandatory.

---

## 9. Travel Leg rules

### RN-03-12 — Adjacency

A normal active Travel Leg may only connect adjacent route points.

Examples:
- origin → first Stop;
- Stop 1 → Stop 2;
- Stop N → return boundary.

A Leg from Stop 1 directly to Stop 3 while Stop 2 remains between them cannot be considered the active route Leg.

### RN-03-13 — Optional Legs

The user is not required to create a Travel Leg for every adjacency immediately.

Missing Legs create a visible **route gap / transport not planned** state but do not invalidate the Trip.

### RN-03-14 — Transport modes

MVP modes:
- `plane`;
- `train`;
- `bus`;
- `car`;
- `ferry`;
- `other`.

Walking and local urban transport are not primary inter-destination modes in this module; they can be represented as `other` if genuinely used between Stops.

### RN-03-15 — Leg status

MVP statuses:
- `planned`;
- `booked`;
- `paid`;
- `cancelled`;
- `completed`.

`paid` means the transport booking is recorded as paid from a logistical point of view. Module 04 defines how/if that state connects to actual financial transactions.

Status transitions must not manufacture financial data.

### RN-03-16 — Date and time fields

A Leg can initially be created without exact times.

If both departure and arrival are known:
- arrival instant must not be before departure instant after considering their local timezones;
- overnight and multi-day journeys are allowed;
- the UI must display local times for each endpoint.

### RN-03-17 — Timezones

Travel times must preserve local context.

Example:
- departure `09:00 Europe/Lisbon`;
- arrival `12:20 Europe/Paris`.

The system must not assume that every Stop shares one timezone and must not display all itinerary/transport times in the Trip owner's home timezone.

If timezone cannot be resolved automatically, the architecture must provide a safe explicit fallback rather than guessing silently.

### RN-03-18 — Operator/reference

Operator and reference are optional.

Examples:
- TAP Air Portugal / `ABC123`;
- Eurostar / booking code;
- FlixBus / ticket reference;
- rental-car company.

### RN-03-19 — Price snapshot

A Leg may store an optional amount and currency representing the expected/booked transport price.

Rules:
- amount cannot be negative;
- currency required when amount exists;
- do not automatically convert or overwrite the original amount;
- Module 04 owns aggregation, FX and actual-expense behaviour.

### RN-03-20 — Cancelled Legs

Cancelled Legs should remain recoverable as historical booking context unless the user explicitly deletes them.

A cancelled Leg does not satisfy the active transport requirement for an adjacency.

### RN-03-21 — Multiple candidate Legs

The MVP may retain more than one historical/cancelled Leg for the same adjacency, but only one non-cancelled Leg should be treated as the primary active route transportation unless a later spec introduces multi-segment journeys.

Complex multi-segment ticket modelling is outside the MVP.

---

## 10. Primary user flows

### Flow A — Add first destination

1. User opens a newly created Trip.
2. Empty route state explains that destinations build the journey.
3. User chooses `Adicionar destino`.
4. User enters place/city, country, arrival and departure dates.
5. System validates dates against Trip dates.
6. Stop is created at position 1.
7. If Trip has an origin boundary, UI can now prompt for transport from origin → Stop 1.
8. User sees next action to add another destination.

### Flow B — Build a backpacking route

1. Existing Stop 1 is present.
2. User adds Stop 2, Stop 3, etc.
3. Each new Stop is appended to route order by default.
4. Dates are validated against the preceding Stop and Trip dates.
5. UI displays the ordered route as one continuous journey.
6. Missing transport between adjacent Stops is visibly indicated.

### Flow C — Add transportation

1. User selects a route gap between adjacent points.
2. User chooses transport mode.
3. User may add dates/times, operator, reference, price/currency and notes.
4. Status defaults to `planned` unless user explicitly selects another valid state.
5. Leg is linked only to the selected adjacent points.
6. Route overview updates to show transportation information.

### Flow D — Reorder destinations safely

1. User initiates reorder.
2. User moves a Stop.
3. System previews new sequence.
4. System validates date chronology.
5. System identifies Legs whose adjacency would change.
6. If conflicts exist, user sees them before save.
7. User resolves conflicts or cancels.
8. Valid reorder commits atomically.
9. Unaffected Legs remain unchanged.
10. Affected non-destructively preserved Legs are marked as needing review where appropriate.

### Flow E — Remove a destination

1. User chooses to delete a Stop.
2. System displays impacted route connections and dependent records.
3. User confirms deletion.
4. System removes the Stop and handles affected Legs according to explicit reconciliation rules.
5. New adjacency is shown as transport not planned until the user creates/reuses a valid Leg.

### Flow F — Edit destination dates

1. User changes arrival/departure dates.
2. System validates Trip boundaries and neighbouring Stops.
3. Attached transport dates are checked.
4. If incompatible, save is blocked with an actionable conflict message.
5. No neighbouring dates are silently changed.

---

## 11. Route overview requirements

The route view must communicate at minimum:
- ordered Stops;
- arrival and departure dates;
- nights/days derived for display where appropriate;
- country;
- transport between adjacent points;
- missing transport;
- booking status;
- route conflicts;
- origin/return boundaries when defined.

The product must work without a map. A map may be added later, but the route must remain fully usable in a list/timeline representation.

---

## 12. Empty, loading and error states

### Empty route

Must explain:
- the Trip currently has no destinations;
- a Trip may contain one or many destinations;
- the user should add the first Stop.

Primary CTA: `Adicionar destino`.

### Missing transport

Must not be presented as a fatal error.

Use an informational state such as `Transporte por planear`.

### Validation errors

Must clearly identify the field and the conflict, for example:
- destination outside Trip dates;
- departure before arrival;
- overlap with previous destination;
- overlap with next destination;
- travel arrival before travel departure;
- route reorder conflicts with dates.

### Persistence errors

Failed create/edit/reorder/delete actions must:
- preserve user input where safe;
- avoid partial route mutation;
- present retry behaviour;
- avoid duplicated Stops/Legs on retry.

---

## 13. Data integrity and transaction requirements

Architecture and Database must ensure:

1. Stops cannot reference a Trip the authenticated owner cannot access.
2. Leg endpoints belong to the same Trip.
3. Active Leg endpoint relationships reflect adjacent route points.
4. Reordering updates positions atomically.
5. Position values remain deterministic after insert/delete/reorder.
6. Partial failures cannot leave duplicate positions or half-rewired Legs.
7. Deleting a Trip continues to follow Module 02 cascade semantics.
8. RLS isolates all Stop and Leg records by Trip owner.
9. Money is stored using safe decimal/minor-unit strategy from ADR-002.
10. time/date storage follows ADR-003.

---

## 14. Cross-module contracts

### Module 02 — Trips

Consumes:
- Trip ownership;
- Trip date boundaries;
- base currency;
- optional origin boundary;
- optional return boundary.

Must not redefine these values.

### Module 04 — Budget & Expenses

Exposes:
- Stops as optional cost scopes;
- Travel Legs as cost-bearing/logistics entities;
- original Leg price + currency when present.

Module 04 decides whether/how a Leg produces linked planned/committed/paid/actual financial records.

### Module 06 — Daily Itinerary

Exposes:
- Stop date ranges;
- Stop timezone;
- route chronology.

### Module 07 — Reservations & Checklists

Travel Legs can later be associated with reservation/checklist context, but Module 03 must not implement the generic reservation system itself.

### Module 09 — Dashboard

Exposes route summary:
- Stop count;
- country count derived from Stops;
- route completeness;
- next Stop/Leg when relevant.

---

## 15. Acceptance scenarios

### AC-03-01 — First Stop

**DADO** que o utilizador possui uma Trip sem destinos  
**QUANDO** adiciona Paris, França, com datas válidas  
**ENTÃO** Paris é criada como Stop na posição 1.

### AC-03-02 — Multi-country route

**DADO** uma Trip existente  
**QUANDO** o utilizador adiciona Stops em França, Bélgica, Países Baixos, Alemanha e República Checa  
**ENTÃO** a Trip preserva todos os Stops numa sequência ordenada sem limite de origem/destino único.

### AC-03-03 — Duplicate city

**DADO** que Madrid já aparece num Stop  
**QUANDO** o utilizador adiciona Madrid novamente em outra posição e datas  
**ENTÃO** a operação é permitida.

### AC-03-04 — Stop outside Trip dates

**DADO** uma Trip de 1 a 15 de novembro  
**QUANDO** o utilizador tenta criar um Stop de 16 a 18 de novembro  
**ENTÃO** a criação é bloqueada com erro claro.

### AC-03-05 — Invalid Stop range

**DADO** o formulário de destino  
**QUANDO** departure_date é anterior a arrival_date  
**ENTÃO** o Stop não é guardado.

### AC-03-06 — Same-day Stop

**DADO** datas válidas da Trip  
**QUANDO** arrival_date e departure_date são iguais  
**ENTÃO** o Stop pode ser guardado.

### AC-03-07 — Overlapping Stops

**DADO** Paris de 2–5 novembro  
**QUANDO** Brussels é colocado de 4–7 novembro como Stop adjacente  
**ENTÃO** a rota é rejeitada até o conflito de datas ser resolvido.

### AC-03-08 — Date gap

**DADO** Paris termina dia 5  
**QUANDO** Brussels começa dia 6  
**ENTÃO** a rota é válida e pode indicar transporte/gap ainda por planear.

### AC-03-09 — Add Travel Leg

**DADO** Paris e Brussels adjacentes  
**QUANDO** o utilizador adiciona um comboio entre ambos  
**ENTÃO** o Leg liga exatamente esses dois route points.

### AC-03-10 — Missing exact times

**DADO** um Travel Leg planeado  
**QUANDO** o utilizador conhece apenas a data e o modo  
**ENTÃO** pode guardar o Leg sem horário exato.

### AC-03-11 — Cross-timezone journey

**DADO** departure e arrival em timezones distintos  
**QUANDO** ambos os horários são guardados  
**ENTÃO** a validação usa os instantes corretos e a interface preserva os horários locais.

### AC-03-12 — Impossible travel time

**DADO** departure e arrival completos  
**QUANDO** o instante de chegada é anterior ao instante de partida  
**ENTÃO** o Leg não pode ser guardado como válido.

### AC-03-13 — Origin boundary leg

**DADO** uma Trip com origem Lisboa e primeiro Stop Paris  
**QUANDO** o utilizador adiciona o primeiro transporte  
**ENTÃO** pode criar Lisboa boundary → Paris sem criar Lisboa como Stop.

### AC-03-14 — Return boundary leg

**DADO** último Stop Prague e regresso Lisboa  
**QUANDO** o utilizador adiciona o transporte final  
**ENTÃO** pode criar Prague → Lisboa boundary.

### AC-03-15 — No origin boundary

**DADO** uma Trip sem origem definida  
**QUANDO** possui Paris → Brussels  
**ENTÃO** a rota continua válida e começa em Paris.

### AC-03-16 — Reorder without conflicts

**DADO** uma rota cujas datas continuam coerentes após mudança de posição  
**QUANDO** o utilizador reordena Stops  
**ENTÃO** posições são atualizadas atomicamente e Legs não afetados são preservados.

### AC-03-17 — Reorder with date conflict

**DADO** uma rota existente  
**QUANDO** o utilizador move um Stop para posição incompatível com as datas  
**ENTÃO** a alteração não é silenciosamente confirmada e o conflito é apresentado.

### AC-03-18 — Reorder with booked Leg

**DADO** A → B possui transporte reservado  
**QUANDO** a nova rota deixa A e B não adjacentes  
**ENTÃO** o sistema não retargeta a reserva para outro destino e exige revisão do Leg afetado.

### AC-03-19 — Delete middle Stop

**DADO** A → B → C  
**QUANDO** B é eliminado  
**ENTÃO** A → B e B → C são tratados explicitamente como dependências afetadas e a nova ligação A → C fica por planear até resolução.

### AC-03-20 — Cancellation history

**DADO** um Leg reservado  
**QUANDO** é marcado como cancelled  
**ENTÃO** permanece como histórico e deixa de satisfazer o transporte ativo daquela adjacency.

### AC-03-21 — Price preserves original currency

**DADO** um comboio comprado por 45 GBP  
**QUANDO** o Leg é guardado  
**ENTÃO** `45 GBP` é preservado e não substituído silenciosamente pelo valor convertido para a moeda base.

### AC-03-22 — Ownership

**DADO** dois utilizadores diferentes  
**QUANDO** um tenta consultar Stops ou Legs da Trip do outro  
**ENTÃO** o acesso é negado no servidor/base de dados, não apenas ocultado na UI.

### AC-03-23 — Atomic reorder failure

**DADO** uma operação de reorder em andamento  
**QUANDO** ocorre uma falha de persistência  
**ENTÃO** a rota permanece no estado consistente anterior, sem posições duplicadas/parciais.

### AC-03-24 — Retry safety

**DADO** uma criação que recebeu erro de rede após submissão  
**QUANDO** o utilizador tenta novamente  
**ENTÃO** o sistema deve evitar duplicação acidental sempre que a arquitetura suportar idempotência segura.

---

## 16. Design requirements

The Design Agent must define:
- route overview/timeline;
- Add Destination flow;
- Add Transport flow;
- Stop card/item states;
- Leg states;
- drag/reorder or accessible equivalent;
- keyboard-accessible reorder behaviour;
- mobile reorder behaviour;
- conflict review UI;
- deletion-impact UI;
- empty route state;
- route gap state;
- cancelled transport state;
- loading/error/success feedback.

A map is not required for approval of this module.

---

## 17. Architecture requirements

The Architecture Agent must explicitly decide and document:
- persistent ordering strategy;
- atomic reorder transaction design;
- route-point representation for boundaries vs Stops;
- how Legs retain identity during route changes;
- orphan/needs-review handling;
- timezone resolution/fallback;
- idempotency strategy for mutations where relevant;
- cross-module linking strategy for future expenses/reservations;
- cascade/restrict semantics.

No architecture decision may silently weaken the product invariants in this spec.

---

## 18. Database requirements

Database implementation must include:
- owner isolation through parent Trip;
- deterministic Stop ordering;
- indexes for Trip + position queries;
- integrity constraints where safely enforceable;
- RLS for Stops and Legs;
- no float money storage;
- safe date/time types;
- non-destructive migration strategy;
- tests for cross-user access denial;
- tests for endpoint/Trip integrity.

---

## 19. QA requirements

QA must test at minimum:
- zero/one/many Stops;
- duplicate destinations;
- trip-boundary dates;
- same-day Stops;
- overlaps;
- date gaps;
- reordering;
- failed reordering rollback;
- middle Stop deletion;
- boundary Legs;
- missing Legs;
- cancelled Legs;
- multiple currencies on Leg prices;
- cross-timezone Legs;
- overnight Legs;
- ownership/RLS;
- mobile route editing;
- accessible reorder alternative;
- retries/double-submit behaviour.

QA must not approve solely from happy-path screenshots.

---

## 20. Security & privacy requirements

Route information is private user data.

Requirements:
- authorization must be enforced server-side/database-side;
- IDs must not allow horizontal privilege escalation;
- operator references/booking codes must not appear in public logs or analytics payloads;
- error messages must not expose another user's Trip existence;
- destructive operations must verify ownership again at mutation time.

---

## 21. Product metrics hooks

Analytics implementation is non-blocking, but architecture should make these events possible without storing sensitive booking references:
- destination_added;
- destination_removed;
- route_reordered;
- travel_leg_added;
- travel_leg_booked;
- route_completed_planning.

Do not include raw place notes, ticket references or document data in analytics events.

---

## 22. MVP exclusions / future opportunities

Not part of approval:
- map-first route planning;
- autocomplete provider dependency as a requirement;
- route optimization;
- AI itinerary generation;
- automatic transport suggestions;
- live timetable integrations;
- multi-segment/multi-ticket Leg composition;
- seat assignments;
- loyalty programmes;
- carbon calculations;
- border/visa recommendations.

---

## 23. Product decisions proposed for approval

### P03-D01
A Trip may contain any practical number of Stops; no low product cap is imposed.

### P03-D02
Stops require place, country, arrival date and departure date; exact address is not required.

### P03-D03
Overlapping adjacent destination stays are not allowed in the MVP; date gaps are allowed.

### P03-D04
The same destination may appear more than once in a Trip.

### P03-D05
A Travel Leg is optional for each adjacency; missing transport is a planning gap, not an invalid Trip.

### P03-D06
Active Travel Legs connect adjacent route points only.

### P03-D07
Reordering never silently deletes, retargets or rewrites booked transport. Affected Legs require reconciliation/review.

### P03-D08
Automatic shifting of Stop dates during reorder is not part of MVP.

### P03-D09
Transport modes in MVP are plane, train, bus, car, ferry and other.

### P03-D10
Travel Leg statuses are planned, booked, paid, cancelled and completed.

### P03-D11
Leg times are optional, but when supplied they preserve each endpoint's local timezone context.

### P03-D12
A Leg may store its original price/currency as booking context, but Module 04 owns financial aggregation and expense creation.

### P03-D13
Cancelled Legs are preserved as history unless explicitly deleted.

### P03-D14
Maps, route optimization and provider search are not required for the MVP.

---

## 24. Gate to implementation

This module can become `APPROVED` when the product owner accepts the decisions in section 23 or records replacements.

After approval, the orchestrator may release the Architecture Agent for `03-destinations-legs` under the autonomous quality gates.

No implementation agent may infer alternative route semantics without an approved spec amendment.


---

## Amendment v1.1 — Destination cover image (owner request, 2026-10-05)

- Each Stop may have one optional cover image uploaded by its owner. It is shown in trip banners, the route carousel, the stop details pop-up, the route timeline and itinerary day headers.
- Upload happens on the edit-destination page. JPEG, PNG or WEBP, maximum 5 MB, validated on the server by file signature. The UI shows the recommended size of 1920 × 1080 px (16:9) and warns when a selected image is smaller than 1600 × 900 px.
- Replacing an image deletes the previous object only after the new one is associated. Removing an image keeps the Stop unchanged.
- Storage: private bucket `destination-images`, path `{user_id}/{trip_id}/{stop_id}/{uuid}.{ext}`, owner-only storage policies, short-lived signed URLs. Column `stops.image_path` is nullable (migration `202610050011_stop_images.sql`, additive).
- Without an upload, an automatic place photo is used: Unsplash when `UNSPLASH_ACCESS_KEY` is configured, otherwise the keyless Wikipedia lead image (or the first photo in the article), with attribution. Without either, an illustrated placeholder is shown. These services receive only the place and country name, never user or trip data.
- Selecting a destination card in the trip overview opens a details pop-up: image, dates, nights, timezone, arrival and departure transport, notes, and shortcuts to edit, itinerary and the full route.
- The full route and its management live on `/trips/{id}/route`. The trip overview keeps a summary carousel.

- **Insert between destinations (owner request, 2026-10-05):** the "+" between route cards and a final "+" card open a new destination pre-filled with the gap's dates. The destination is inserted at the chronological position (`create_route_stop_at`, migration `202610050012_insert_route_stop.sql`). Legs that stop being adjacent are flagged for review, as with reordering.
- **Route map:** the "Rota e destinos" banner shows a map with one numbered pin per destination and a dashed route line. Coordinates come from OpenStreetMap Nominatim (keyless, cached 30 days, only place and country names are sent). Tiles are OpenStreetMap standard tiles, darkened with CSS and attributed.
- **Trip cover:** the cover is the first destination's image. "Alterar capa" (overview banner, trips list and trip cards) opens that image upload.


## Amendment v1.2 — Ticket price, final destination, optional timezones (owner request, 2026-10-05)

- A travel leg's price is presented as **"Valor da passagem"** in the trip base currency. When set (and the leg is not cancelled) it is mirrored as one budget expense in category *Transportes*, scoped to the leg; editing the price updates that expense, removing the price or cancelling the leg archives it, and status *Pago* marks it fully paid. Editing the expense value in the budget updates the leg price. Deleting a leg (or a destination with legs) removes unpaid mirrored expenses and keeps paid ones as whole-trip expenses.
- Destination form has a **"Destino final"** checkbox. When checked no departure date is asked; the stay lasts until the trip end date, and the destination must be the last one in the route.
- **Timezones are optional everywhere.** A leg time requires only its date; when either timezone is missing, arrival-before-departure is checked on local date/time.
- Route banner map uses the tightest zoom that fits the route (closer view).
- Route page: clicking a transport card opens a pop-up with the ticket details (route, departure/arrival date, time and optional timezone, ticket price, operator, reference, notes) with shortcuts to edit it and to the budget. (2026-10-06)
