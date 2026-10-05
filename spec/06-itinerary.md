# SPEC — Module 06: Daily Itinerary

Version: 1.1  
Status: APPROVED
Module ID: `06-itinerary`  
Depends on: `spec/00-product.md`, `spec/02-trips.md`, `spec/03-destinations-legs.md`, `spec/04-budget-expenses.md`, `AGENTS.md`, `docs/adr/ADR-003-timezones-and-multidestination.md`  
Primary handoff: Module 07 — Reservations & Checklists

---

## 1. Purpose

Give the traveller a reliable day-by-day plan for a multi-destination Trip without forcing the itinerary to behave like a calendar app.

The module must answer:

> What am I doing on each day of the Trip, where does it happen, in what local time, and what still has no fixed time?

The itinerary is operational planning. It does not replace the canonical Trip route, Travel Legs, financial ledger or reservation records.

---

## 2. Product outcome

When this module is complete, the authenticated Trip owner can:

1. see every calendar day between Trip start and end dates;
2. understand which Stop or transition each day belongs to;
3. add itinerary items to a valid Trip day;
4. create timed and untimed items;
5. give an item a title, place, notes, optional start/end time and optional Stop association;
6. order items within a day;
7. move an item to another valid Trip day;
8. edit and delete itinerary items;
9. see activities in the correct local timezone of the associated Stop;
10. plan transition days that involve two destinations or a Travel Leg;
11. see warnings for overlapping timed activities without being hard-blocked;
12. preserve itinerary information when the route changes wherever it remains valid;
13. identify itinerary items that require review after destination/date changes;
14. distinguish itinerary planning from reservations and expenses;
15. use the itinerary comfortably on mobile.

---

## 3. Actors

### 3.1 Authenticated Trip owner

Can create, view, edit, reorder, move and delete itinerary items for Trips they own.

### 3.2 Authenticated non-owner

Cannot read or mutate another user's itinerary.

### 3.3 Visitor

Cannot access private itinerary data.

---

## 4. Scope

### Included

- generated Trip-day timeline;
- day-by-day itinerary view;
- timed activities;
- untimed/flexible activities;
- item ordering;
- item moving between valid dates;
- Stop association;
- place/name field;
- free-text notes;
- local start/end time;
- optional duration through start/end times;
- transition-day support;
- timezone-safe display;
- overlap warnings;
- orphan/review states after route changes;
- loading, empty, error and success states;
- mobile interaction requirements;
- QA acceptance scenarios.

### Explicitly out of scope

- AI itinerary generation;
- automatic attraction recommendations;
- live opening-hours validation;
- route optimization between activities;
- turn-by-turn navigation;
- map-based drag-and-drop planning;
- live traffic information;
- weather forecasts;
- collaborative itinerary editing;
- comments between travellers;
- recurring calendar events;
- syncing with Google Calendar / Apple Calendar;
- automatic reservation creation from itinerary items;
- automatic expense creation from itinerary items;
- automatic Travel Leg creation from itinerary items;
- location tracking;
- public/shareable itinerary links;
- offline-first synchronization.

---

## 5. Canonical concepts

### 5.1 Trip Day

A Trip Day is each civil calendar date from the Trip `start_date` through `end_date`, inclusive.

Example:

```text
Trip: 10 Sep → 12 Sep

Trip Days:
10 Sep
11 Sep
12 Sep
```

Trip Days are derived from the Trip date range. They are not independent user-created database entities unless Architecture proves a technical need.

### 5.2 Itinerary Item

An Itinerary Item is a user-created plan attached to one Trip Day.

Examples:

- Louvre Museum;
- Breakfast;
- Walk through Montmartre;
- Check in at hotel;
- Free afternoon;
- Meet local guide;
- Dinner reservation reminder.

An itinerary item is not automatically a Reservation, Expense or Travel Leg.

### 5.3 Timed item

A timed item has a local start time.

It may optionally have an end time.

Example:

```text
09:30 — Louvre Museum
```

or:

```text
09:30–12:30 — Louvre Museum
```

### 5.4 Untimed item

An untimed item belongs to a Trip Day but has no fixed clock time.

Examples:

```text
• Buy SIM card
• Explore neighbourhood
• Try local pastry
```

Untimed items are first-class itinerary items, not invalid/incomplete timed items.

### 5.5 Stop association

An itinerary item may be associated with a specific Stop when the activity belongs to that destination.

Example:

```text
Trip Day: 14 Sep
Stop: Paris
Item: Louvre Museum
```

A Stop association is optional because transition days may include:

- activities before leaving Stop A;
- travel itself;
- activities after arriving at Stop B;
- generic Trip tasks not tied to one destination.

### 5.6 Transition day

A transition day is a Trip Day on which the traveller moves between route points or where two Stop windows touch the same calendar date.

The UI must support a day such as:

```text
08:00  Breakfast — Paris
10:30  Train Paris → Brussels
13:00  Hotel check-in — Brussels
15:00  Grand Place
```

The Triply data model must not force the entire day to belong to only one Stop.

---

## 6. Day generation and boundaries

### 6.1 Canonical day range

The itinerary displays every date from Trip `start_date` through Trip `end_date`, inclusive.

No itinerary item may be created outside that date range in the MVP.

### 6.2 Changing Trip dates

If Trip dates are extended:

- new Trip Days appear automatically;
- existing itinerary items remain unchanged.

If Trip dates are shortened:

- items that now fall outside the valid Trip range must **not be silently deleted**;
- the date change flow must surface the number of affected itinerary items before confirmation;
- after confirmation, affected items must enter a recoverable `needs_review`/out-of-range state or another Architecture-approved preservation mechanism;
- QA must verify no silent data loss.

The exact persistence implementation is owned by Architecture/Database, but the product invariant is preservation.

---

## 7. Itinerary item model

Conceptual fields:

| Field | Requirement |
|---|---|
| `id` | Required unique identifier |
| `trip_id` | Required |
| `trip_date` | Required; must be inside Trip date range while item is active |
| `stop_id` | Optional |
| `title` | Required |
| `place_name` | Optional |
| `start_local_time` | Optional |
| `end_local_time` | Optional |
| `timezone` | Required for timed items when determinable from Stop; nullable for truly timezone-neutral untimed items |
| `notes` | Optional |
| `sort_order` | Required deterministic order within the day/group |
| `status` | Required; active or needs-review semantics |
| `created_at` | Required |
| `updated_at` | Required |

Architecture may normalize fields differently but cannot change the product semantics without a Product Gate.

---

## 8. Creation rules

### 8.1 Required fields

To create an itinerary item:

- Trip Day is required;
- title is required after trimming whitespace.

Everything else is optional unless another selected field creates a dependency.

### 8.2 Title

Recommended product limit: 120 characters.

The UI must prevent blank/whitespace-only titles.

### 8.3 Place

`place_name` is free text in the MVP.

No Google Places, geocoding or address API is required.

### 8.4 Notes

Notes are plain text.

No rich text editor is required in the MVP.

### 8.5 Timed vs untimed

If no start time is provided, the item is untimed.

If a start time exists:

- item becomes timed;
- timezone rules apply.

An end time cannot exist without a start time.

### 8.6 End time

If start and end are both defined on the same local day:

```text
end_time >= start_time
```

An equal start and end time is allowed for zero-duration markers such as reminders.

Activities spanning midnight are not represented as one same-day itinerary item in the MVP. Travel spanning dates belongs canonically to `Travel Legs`.

### 8.7 Stop association validation

If `stop_id` is selected:

- the Stop must belong to the same Trip;
- the selected `trip_date` should fall within that Stop's valid stay window or an Architecture-approved transition boundary;
- if it does not, the UI must warn or reject according to the canonical Stop-date rule from Module 03;
- a user may remove the Stop association and keep the item as Trip-level if appropriate.

---

## 9. Timezone rules

Timezone correctness is a product invariant.

### 9.1 Associated Stop

For a timed item associated with a Stop:

- store/interpret the clock time in that Stop's IANA timezone;
- display the clock time in that local timezone;
- do not reinterpret it using the user's current device timezone.

Example:

```text
Tokyo item: 09:00 Asia/Tokyo
User opens Triply in Lisbon
Display remains: 09:00
```

### 9.2 Item without Stop

For a timed item with no Stop association:

- the UI must require or derive a valid itinerary timezone from the relevant Trip-day context;
- it must never silently assume the browser timezone if that could change the intended travel time.

Architecture must define the deterministic fallback before implementation.

### 9.3 Daylight-saving changes

IANA timezone rules must be used rather than fixed UTC offsets.

The same stored local intent must survive DST boundaries correctly.

### 9.4 Display

The primary itinerary view displays local times.

UTC does not need to be exposed to the user.

---

## 10. Ordering rules

### 10.1 Default order

Within a Trip Day:

1. timed items ordered by local start time;
2. when two timed items share the same start time, `sort_order` breaks ties;
3. untimed items appear in a dedicated flexible/any-time section or another clearly separated UI region;
4. untimed items respect manual `sort_order`.

The Design Agent may choose the visual treatment but cannot make untimed items appear accidentally scheduled at midnight.

### 10.2 Manual reorder

The user can manually reorder items that share the same ordering context.

For timed items, manual ordering cannot falsify the visible chronological time order. If times differ, chronological order wins.

For untimed items, manual reorder is authoritative.

### 10.3 Moving between days

An item may be moved to another valid Trip Day.

When moved:

- title, notes and place remain;
- Stop association must be revalidated;
- timezone must be revalidated;
- linked reservation/cost references, when later supported, must not be silently mutated;
- any invalid association becomes an explicit review state.

---

## 11. Overlap and conflict behaviour

### 11.1 Timed overlap

Triply should detect obvious overlaps among timed itinerary items on the same date.

Example:

```text
10:00–12:00 Museum
11:30–13:00 Lunch
```

Result:

- show a non-blocking conflict warning;
- allow save;
- never automatically move either activity.

Travel planning often intentionally contains provisional overlaps, so this is advisory rather than a hard validation error.

### 11.2 Items without end time

A start-only item does not create a deterministic overlap interval.

Triply may warn only when a clearly defined conflict exists.

### 11.3 Travel Leg conflicts

If Module 03 provides a Travel Leg whose schedule obviously conflicts with a timed itinerary item:

- the UI should surface a warning when feasible;
- Travel Leg remains the canonical transport record;
- the itinerary item is not automatically changed or deleted.

This cross-module warning must not create a second editable copy of Travel Leg timing inside the itinerary.

---

## 12. Relationship with Travel Legs

Travel Legs belong to Module 03 and remain canonical for inter-destination transport.

The Daily Itinerary may display Travel Legs as read-only timeline events/cards on the appropriate Trip Day(s).

Rules:

- a Travel Leg is not duplicated as an Itinerary Item merely to display it;
- editing the transport opens/uses the Module 03 flow;
- deleting an itinerary item cannot delete a Travel Leg;
- a Travel Leg spanning midnight may appear on both relevant day views if Design/Architecture choose, but it still represents one canonical Travel Leg;
- the itinerary may visually interleave itinerary items and Travel Legs chronologically.

---

## 13. Relationship with Reservations

Module 07 owns Reservations.

For Module 06 approval:

- an itinerary item can exist with no reservation;
- a reservation can later be linked to an itinerary item;
- itinerary deletion must never silently delete a reservation;
- reservation deletion must never silently delete an itinerary item;
- links are associations, not ownership.

No reservation UI needs to be implemented inside Module 06 before Module 07 exists.

---

## 14. Relationship with Budget & Expenses

Module 04 owns financial truth.

Rules:

- an itinerary item may optionally reference a cost/expense later;
- entering an itinerary title does not create a forecast cost;
- entering a place does not create a cost;
- deleting an itinerary item cannot delete financial records;
- financial amounts must not be duplicated as independent editable fields in the itinerary.

The Design Agent may show linked cost information read-only after integration.

---

## 15. Route-change integrity

Route edits from Module 03 can invalidate itinerary associations.

### 15.1 Stop deleted

If a Stop referenced by itinerary items is deleted:

- affected itinerary items must not be silently deleted;
- the deletion flow must warn about affected itinerary items;
- affected items become Trip-level/unassigned or `needs_review` according to Architecture's approved preservation model;
- historical text, notes and times remain preserved.

### 15.2 Stop dates changed

If a Stop's dates change and itinerary items no longer fall inside its valid window:

- affected items are flagged for review;
- Triply must not silently move their dates.

### 15.3 Stops reordered

Reordering Stops does not automatically reorder itinerary items by itself.

The itinerary is date-based. If route reordering also changes dates, the date-change rules apply.

---

## 16. Day states

Each displayed Trip Day may communicate contextual state.

Examples:

- destination day;
- transition day;
- day without itinerary items;
- current day while travelling;
- past day;
- future day;
- day containing warnings.

These are derived display states, not necessarily database statuses.

The MVP does not automatically complete activities merely because their scheduled time has passed.

---

## 17. Item status

The MVP does not require task-style completion (`done/not done`) for itinerary activities.

Canonical item lifecycle:

```text
active
needs_review
```

Deletion may be hard-delete or soft-delete according to the project's global retention architecture, but cross-module references must remain safe.

A future module may introduce `visited`, `skipped` or completion tracking; these are outside MVP unless separately approved.

---

## 18. Deletion

### 18.1 Itinerary item

Deleting a normal itinerary item requires confirmation only when the item has downstream links or data-loss risk identified by the UI.

For a simple unlinked item, a lightweight undo interaction is preferred over a heavy destructive confirmation.

### 18.2 No cascading deletion

Deleting an itinerary item must never cascade-delete:

- Reservation;
- Expense;
- Payment;
- Travel Leg;
- Stop;
- Document.

---

## 19. Empty states

### 19.1 Trip has no Stops

The itinerary still shows the Trip-day range.

Message direction:

> Start planning your days now, or add destinations first to organize activities by place.

The user is allowed to create Trip-level itinerary items before adding Stops.

### 19.2 Day has no items

Show a lightweight empty state and primary action:

`Add activity`

### 19.3 Trip has no valid dates

This state should be impossible after Module 02 validation. If encountered because of corrupted/stale data, fail safely and do not render invented dates.

---

## 20. UX requirements

The Design Agent must provide at minimum:

1. itinerary overview across Trip days;
2. single-day/expanded day experience suitable for mobile;
3. add-item flow;
4. edit-item flow;
5. timed vs untimed treatment;
6. transition-day treatment;
7. Travel Leg read-only treatment;
8. overlap-warning treatment;
9. needs-review treatment;
10. empty/loading/error states;
11. moving item between days;
12. accessible non-drag fallback for reordering.

### 20.1 Mobile first

A 15-day backpacking itinerary must be practical on a phone.

The interface must not require horizontal desktop calendar grids to perform core actions.

### 20.2 Drag and drop

Drag-and-drop may be used as an enhancement but must not be the only interaction.

Keyboard/touch-accessible controls such as `Move up`, `Move down` and `Move to day` must exist where required.

### 20.3 No fake precision

An untimed item must visually look untimed.

Never assign `00:00` merely to obtain sorting behaviour.

---

## 21. Validation and errors

At minimum handle:

- blank title;
- date outside Trip;
- invalid Stop ownership;
- Stop from another Trip;
- end time without start time;
- end before start on same-day items;
- missing/invalid timezone for timed item;
- stale item after concurrent route/date change;
- item moved to invalid date;
- failed save;
- failed delete;
- failed reorder;
- retry after temporary network failure;
- unauthorized access;
- RLS rejection.

Errors must not silently discard user-entered notes or form values when a retry is possible.

---

## 22. Security and privacy

The Database Agent must guarantee owner isolation with RLS or the project's approved equivalent.

Requirements:

- users cannot enumerate itinerary items for other Trips;
- `trip_id` ownership is validated server-side/database-side;
- `stop_id` must belong to the same owned Trip;
- cross-user IDs supplied manually must fail safely;
- notes are private Trip content;
- place text must be rendered safely and never treated as trusted HTML;
- logs must not unnecessarily dump itinerary notes.

---

## 23. Performance expectations

The module must comfortably support realistic long Trips.

MVP target assumptions for testing:

- 90-day Trip;
- 20+ Stops;
- 20 itinerary items per day in stress fixtures;
- hundreds to low-thousands of itinerary items per Trip without broken ordering or unusable UI.

No artificial user-facing limit lower than these assumptions should be introduced without a Product Gate.

---

## 24. Analytics events

Analytics are non-blocking for MVP readiness.

If analytics infrastructure exists, recommended events:

- `itinerary_viewed`;
- `itinerary_item_created`;
- `itinerary_item_updated`;
- `itinerary_item_deleted`;
- `itinerary_item_moved`;
- `itinerary_overlap_warning_shown`;
- `itinerary_item_needs_review`.

Never send private notes or free-text place contents as analytics payloads.

---

## 25. Acceptance scenarios — DADO / QUANDO / ENTÃO

### AC-01 — Generate all Trip days

**DADO** uma viagem de 1 a 15 de setembro  
**QUANDO** o utilizador abre o itinerário  
**ENTÃO** são apresentados os 15 dias civis, inclusive início e fim.

### AC-02 — Single-day Trip

**DADO** uma viagem cuja data inicial e final são iguais  
**QUANDO** o itinerário é aberto  
**ENTÃO** existe exatamente um Trip Day utilizável.

### AC-03 — Create untimed activity

**DADO** um Trip Day válido  
**QUANDO** o utilizador cria `Explorar Montmartre` sem horário  
**ENTÃO** o item é guardado como untimed e não como `00:00`.

### AC-04 — Create timed activity

**DADO** Paris associado ao dia  
**QUANDO** o utilizador cria `Louvre` às 09:30  
**ENTÃO** o item é exibido às 09:30 no timezone local de Paris.

### AC-05 — Timed item does not shift with device timezone

**DADO** um item em Tóquio às 09:00 `Asia/Tokyo`  
**QUANDO** o utilizador abre o Triply num dispositivo em Lisboa  
**ENTÃO** o itinerário continua a mostrar 09:00 para o compromisso local.

### AC-06 — Optional end time

**DADO** um item com início às 10:00  
**QUANDO** nenhum fim é informado  
**ENTÃO** o item é válido.

### AC-07 — Reject end without start

**DADO** um novo item untimed  
**QUANDO** o utilizador tenta informar apenas 12:00 como fim  
**ENTÃO** a gravação é rejeitada com mensagem compreensível.

### AC-08 — Reject end before start

**DADO** um item às 14:00  
**QUANDO** o utilizador informa fim às 13:00 no mesmo dia  
**ENTÃO** a gravação é rejeitada.

### AC-09 — Equal start/end allowed

**DADO** um marcador às 12:00  
**QUANDO** início e fim são 12:00  
**ENTÃO** o item pode ser guardado.

### AC-10 — Blank title rejected

**DADO** o formulário de nova atividade  
**QUANDO** o título contém apenas espaços  
**ENTÃO** o item não é criado.

### AC-11 — Free-text place

**DADO** um item válido  
**QUANDO** o utilizador escreve `Museu do Louvre` no campo de local  
**ENTÃO** Triply guarda o texto sem exigir uma API externa de lugares.

### AC-12 — Notes preserved

**DADO** um item com notas  
**QUANDO** o item é editado sem alterar as notas  
**ENTÃO** as notas permanecem intactas.

### AC-13 — Stop association

**DADO** uma atividade num dia válido de Paris  
**QUANDO** Paris é escolhido como Stop  
**ENTÃO** a associação é aceite.

### AC-14 — Cross-Trip Stop rejected

**DADO** um ID de Stop pertencente a outra viagem  
**QUANDO** é submetido manualmente para um item  
**ENTÃO** a operação falha, mesmo que o frontend tenha sido contornado.

### AC-15 — Transition day supports two Stops

**DADO** saída de Paris e chegada a Bruxelas no mesmo dia  
**QUANDO** o utilizador planeia uma atividade matinal em Paris e outra à tarde em Bruxelas  
**ENTÃO** ambas podem coexistir no mesmo Trip Day com associações distintas.

### AC-16 — Travel Leg displayed without duplication

**DADO** um Travel Leg Paris → Bruxelas já existente  
**QUANDO** o dia de transição é aberto  
**ENTÃO** o transporte pode aparecer na timeline sem criar um segundo Itinerary Item editável.

### AC-17 — Edit Travel Leg from canonical source

**DADO** um Travel Leg apresentado no itinerário  
**QUANDO** o utilizador escolhe editar o transporte  
**ENTÃO** Triply encaminha para o fluxo canónico do Module 03.

### AC-18 — Timed ordering

**DADO** itens às 18:00, 09:00 e 13:00  
**QUANDO** o dia é apresentado  
**ENTÃO** aparecem cronologicamente 09:00, 13:00, 18:00.

### AC-19 — Untimed manual order

**DADO** três itens sem horário  
**QUANDO** o utilizador os reordena  
**ENTÃO** a nova ordem é persistida deterministicamente.

### AC-20 — Accessible reorder

**DADO** um utilizador que não usa drag-and-drop  
**QUANDO** quer mudar a ordem de itens untimed  
**ENTÃO** existe um controlo alternativo acessível.

### AC-21 — Move item to another day

**DADO** uma atividade de 5 de setembro  
**QUANDO** o utilizador a move para 6 de setembro, ainda dentro da viagem  
**ENTÃO** o item mantém conteúdo e a associação de Stop/timezone é revalidada.

### AC-22 — Move outside Trip rejected

**DADO** uma viagem até 15 de setembro  
**QUANDO** é tentada a mudança de item para 16 de setembro  
**ENTÃO** a operação é rejeitada no MVP.

### AC-23 — Overlap warning

**DADO** Museu 10:00–12:00  
**QUANDO** o utilizador adiciona Almoço 11:30–13:00  
**ENTÃO** Triply mostra conflito, mas permite guardar.

### AC-24 — No false overlap for start-only item

**DADO** um item apenas com início às 10:00  
**QUANDO** outro item é criado às 11:00  
**ENTÃO** Triply não inventa uma duração para bloquear a criação.

### AC-25 — Stop deletion preserves itinerary data

**DADO** atividades associadas a um Stop  
**QUANDO** o Stop é eliminado  
**ENTÃO** as atividades não são silenciosamente apagadas e ficam preservadas para revisão/desassociação.

### AC-26 — Stop date shrink flags invalid items

**DADO** Paris originalmente de 1 a 5 setembro com atividade no dia 5  
**QUANDO** Paris passa a terminar dia 4  
**ENTÃO** a atividade do dia 5 não é movida automaticamente e é marcada para revisão.

### AC-27 — Reordering Stops alone does not move dated activities

**DADO** atividades datadas existentes  
**QUANDO** Stops são reordenados sem alteração das datas  
**ENTÃO** as datas dos itens permanecem iguais.

### AC-28 — Extending Trip dates preserves and adds days

**DADO** uma viagem de 1 a 10 setembro  
**QUANDO** o fim passa para 12 setembro  
**ENTÃO** dias 11 e 12 aparecem vazios e os itens existentes permanecem intactos.

### AC-29 — Shortening Trip dates warns before orphaning

**DADO** atividades nos dias 11 e 12  
**QUANDO** a viagem é encurtada para terminar no dia 10  
**ENTÃO** Triply informa quantos itens serão afetados antes de confirmar.

### AC-30 — Delete simple item

**DADO** um item sem dependências  
**QUANDO** o utilizador o elimina  
**ENTÃO** ele desaparece com mecanismo de undo ou equivalente aprovado.

### AC-31 — Delete itinerary does not delete finance

**DADO** um item ligado futuramente a uma despesa  
**QUANDO** o item é eliminado  
**ENTÃO** a despesa permanece.

### AC-32 — Delete itinerary does not delete reservation

**DADO** um item ligado futuramente a uma reserva  
**QUANDO** o item é eliminado  
**ENTÃO** a reserva permanece.

### AC-33 — No Stops required

**DADO** uma Trip válida sem destinos  
**QUANDO** o utilizador abre o itinerário  
**ENTÃO** os Trip Days aparecem e atividades Trip-level podem ser criadas.

### AC-34 — Empty day

**DADO** um dia sem atividades  
**QUANDO** é aberto  
**ENTÃO** aparece um estado vazio com ação `Add activity`.

### AC-35 — Failed save preserves draft

**DADO** uma nova atividade preenchida  
**QUANDO** ocorre falha temporária de rede ao guardar  
**ENTÃO** o texto preenchido não é silenciosamente perdido e o utilizador pode tentar novamente.

### AC-36 — Failed reorder rolls back visually

**DADO** uma ordem persistida  
**QUANDO** uma tentativa de reorder falha no servidor  
**ENTÃO** a interface restaura/recupera a ordem canónica e informa a falha.

### AC-37 — Owner isolation

**DADO** utilizador A e utilizador B  
**QUANDO** B tenta aceder diretamente ao ID de um itinerary item de A  
**ENTÃO** o acesso é negado.

### AC-38 — XSS-safe text

**DADO** texto malicioso num título, lugar ou notas  
**QUANDO** o item é apresentado  
**ENTÃO** o conteúdo é tratado como texto não confiável e não executa script.

### AC-39 — Long backpacking Trip

**DADO** uma viagem de 60 dias por vários países  
**QUANDO** o itinerário é utilizado diariamente  
**ENTÃO** a experiência continua navegável e não depende de uma grelha horizontal impraticável.

### AC-40 — DST-safe local time

**DADO** uma atividade numa região que muda para horário de verão durante a viagem  
**QUANDO** o dia é apresentado  
**ENTÃO** Triply usa a regra IANA correta e preserva a hora local pretendida.

---

## 26. Architecture Agent requirements

Before implementation, Architecture must define:

1. canonical storage strategy for local date/time + IANA timezone;
2. whether Trip Days remain fully derived or use any persisted projection;
3. `sort_order` strategy that avoids unstable mass renumbering where practical;
4. preservation strategy for itinerary items invalidated by Trip/Stop changes;
5. transaction boundaries for move/reorder operations;
6. mechanism for Travel Leg timeline projection without duplicating records;
7. deterministic timezone fallback for timed Trip-level items with no Stop;
8. index/query strategy for retrieving one Trip's itinerary efficiently;
9. optimistic-update/rollback contract for frontend;
10. cross-module association strategy that prevents cascade deletion.

Architecture may propose technical implementation but may not change the product rules in this spec.

---

## 27. Database Agent requirements

Database must ensure:

- owner isolation/RLS;
- same-Trip integrity for `stop_id`;
- valid date storage;
- safe nullable timed fields;
- deterministic sort support;
- no cascade from itinerary item deletion into canonical Reservation/Expense/Travel Leg records;
- appropriate indexes for `trip_id + trip_date` and ordering;
- preservation of items requiring review;
- migrations are non-destructive unless separately approved.

---

## 28. Backend Agent requirements

Backend/server logic must:

- validate ownership independently from frontend;
- validate Trip date range;
- validate Stop-to-Trip relationship;
- validate time combinations;
- preserve local timezone semantics;
- provide atomic move/reorder behaviour;
- return conflict/warning information without converting advisory warnings into hard errors;
- avoid creating duplicate Travel Leg/financial/reservation records.

---

## 29. Frontend Agent requirements

Frontend must:

- be mobile-first;
- display day/date context clearly;
- distinguish timed and untimed items;
- display local timezone context where ambiguity exists;
- preserve form values across recoverable errors;
- support non-drag reorder/move interactions;
- show overlap and needs-review warnings clearly but calmly;
- never fake unscheduled times;
- not duplicate editable Travel Leg fields;
- provide skeleton/loading, empty, success and error states.

---

## 30. QA Agent requirements

QA must verify at minimum:

- every AC-01 through AC-40;
- timezone behaviour with at least three materially different zones;
- DST boundary fixture;
- transition day with two Stops;
- multi-country Trip;
- Stop deletion/date-change preservation;
- Trip date contraction preservation;
- reorder rollback;
- unauthorized cross-user access;
- XSS-safe rendering;
- mobile navigation for a 15-day and 60-day fixture;
- hundreds of itinerary items without ordering corruption.

A failure involving silent itinerary loss, cross-user access or timezone corruption is release-blocking.

---

## 31. Product decisions proposed for approval

### P06-01 — Trip Days are derived from Trip dates

No manual creation/deletion of calendar days in the MVP.

**Recommendation: APPROVE.**

### P06-02 — Timed and untimed activities are both first-class

Untimed activities are never stored/displayed as midnight events.

**Recommendation: APPROVE.**

### P06-03 — Stop association is optional

Required to support transition days and planning before destinations are finalized.

**Recommendation: APPROVE.**

### P06-04 — One day may contain activities from multiple Stops

Critical for multi-destination transition days.

**Recommendation: APPROVE.**

### P06-05 — Travel Legs appear in itinerary without duplication

Module 03 remains canonical owner of transport.

**Recommendation: APPROVE.**

### P06-06 — Overlaps warn but do not block

Trip plans are often provisional.

**Recommendation: APPROVE.**

### P06-07 — Local time follows destination timezone

Device timezone must not shift a planned local activity.

**Recommendation: APPROVE.**

### P06-08 — No cross-midnight activity object in MVP

Cross-date transport belongs to Travel Legs; ordinary activities should be split when necessary.

**Recommendation: APPROVE.**

### P06-09 — Route/date changes preserve invalidated itinerary data

Affected items become reviewable rather than being silently deleted or moved.

**Recommendation: APPROVE.**

### P06-10 — No automatic activity completion

Passing time does not mark an activity done/skipped in the MVP.

**Recommendation: APPROVE.**

### P06-11 — Itinerary does not create costs or reservations automatically

Associations may exist later, but financial/reservation truth remains in its owning module.

**Recommendation: APPROVE.**

### P06-12 — Drag-and-drop is optional enhancement, never the sole control

Core itinerary interactions remain accessible on mobile and keyboard.

**Recommendation: APPROVE.**

---

## 32. Approval gate

Product Owner approval recorded. The P06 decisions above are authoritative for MVP implementation.

Architecture and downstream agents may now consume this spec, subject to the orchestration gates in `CLAUDE.md` and `AGENTS.md`.


## Amendment v1.1 — Optional timezone (owner request, 2026-10-05)

A timed activity no longer requires a timezone. If none is chosen the destination's timezone is used when it exists; otherwise the time is stored as local time without timezone.
