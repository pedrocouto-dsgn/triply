# SPEC — Module 07: Reservations & Checklists

Version: 1.1  
Status: APPROVED
Module ID: `07-reservations-checklists`  
Depends on: `spec/00-product.md`, `spec/02-trips.md`, `spec/03-destinations-legs.md`, `spec/04-budget-expenses.md`, `spec/06-itinerary.md`, `AGENTS.md`  
Primary handoff: Module 08 — Documents

---

## 1. Purpose

Give travellers one reliable place to track what must be booked, what is already confirmed, what has been paid, and what still needs to be done before or during a Trip.

The module has two related but distinct concepts:

1. **Reservations** — structured records for bookings/confirmations such as accommodation, restaurants, attractions, rentals and transfers.
2. **Checklist Items** — lightweight tasks such as "buy travel insurance", "check passport validity" or "download offline maps".

The module must answer:

> What have I booked, what still needs booking, what have I already paid for, and what tasks are still outstanding?

Reservations must not become a second source of truth for route, itinerary or financial data.

---

## 2. Product outcomes

When this module is complete, the authenticated Trip owner can:

1. create and manage reservations for a Trip;
2. classify reservations by type;
3. associate a reservation with a Stop when relevant;
4. optionally associate a reservation with an Itinerary Item;
5. record provider, confirmation/reference code, dates/times, location, notes and booking URL;
6. track reservation status independently from financial payment status;
7. identify bookings that still need action;
8. record cancellation without deleting history;
9. create general and destination-specific checklist items;
10. set optional due dates on checklist items;
11. mark checklist items complete/incomplete;
12. distinguish manually created checklist tasks from reservation records;
13. preserve reservation/checklist data safely when route or itinerary changes;
14. see overdue and upcoming actions without artificial blocking;
15. use the complete flow comfortably on mobile.

---

## 3. Actors

### 3.1 Authenticated Trip owner

Can create, read, edit, cancel, archive where applicable, delete where explicitly allowed, and restore mutable reservation/checklist records for Trips they own.

### 3.2 Authenticated non-owner

Cannot read or mutate another user's reservations or checklist items.

### 3.3 Visitor

Cannot access private reservation or checklist data.

---

## 4. Scope

### Included

- reservation CRUD;
- reservation categories/types;
- reservation lifecycle/status;
- provider/supplier name;
- confirmation/reference code;
- booking URL;
- optional contact information;
- reservation dates and local times;
- Stop association;
- optional Itinerary Item association;
- optional relation to an existing Travel Leg when transport-related metadata is useful;
- cancellation state and cancellation notes;
- reservation notes;
- checklist CRUD;
- general Trip checklist items;
- destination-specific checklist items;
- optional due dates;
- completion state and completed timestamp;
- checklist ordering;
- overdue/upcoming state;
- default checklist templates at Trip creation/onboarding boundary only if explicitly invoked by user or product flow;
- empty/loading/error/success states;
- mobile-first behaviour;
- accessibility requirements;
- QA acceptance scenarios.

### Explicitly out of scope

- automatic booking with airlines/hotels;
- live reservation availability;
- price comparison;
- booking marketplace integrations;
- email inbox parsing;
- automatic importing of Booking.com/Airbnb/airline confirmations;
- OCR of reservation documents;
- automatic cancellation/refund processing;
- loyalty programmes;
- seat selection;
- room/bed selection;
- restaurant table management;
- collaborative assignment of checklist items to travellers;
- recurring checklist tasks;
- push/email reminder infrastructure;
- document file upload itself (Module 08);
- automatic expense/payment creation;
- automatic itinerary creation from reservations;
- automatic Travel Leg creation from reservation records.

---

## 5. Canonical concepts

### 5.1 Reservation

A Reservation is a structured record representing an external booking, confirmation or planned booking the traveller wants to track.

Examples:

- hotel booking;
- hostel reservation;
- restaurant reservation;
- museum ticket;
- guided tour;
- rental car;
- airport transfer;
- luggage storage;
- event ticket.

A Reservation is not itself the authoritative financial transaction. Money remains owned by Module 04.

### 5.2 Checklist Item

A Checklist Item is a task to complete.

Examples:

- check passport validity;
- buy travel insurance;
- reserve Louvre ticket;
- download boarding pass;
- activate eSIM;
- exchange currency;
- pack medication;
- download offline maps.

A checklist item may eventually result in a Reservation, Expense or Document, but Triply must not infer or create those records automatically in the MVP.

### 5.3 Reservation status

Canonical reservation status values:

```text
planned
booked
cancelled
completed
```

Meaning:

- `planned`: user intends/needs to make the booking but it is not confirmed;
- `booked`: external booking is confirmed;
- `cancelled`: reservation was cancelled; history is retained;
- `completed`: the reserved service/activity has occurred or been consumed, set manually in MVP.

Payment status is **not** encoded in this field.

### 5.4 Payment state

Financial payment state is derived from Module 04 relationships when they exist.

The UI may display labels such as:

```text
Unpaid
Partially paid
Paid
Refunded / adjusted
```

but Reservations must not maintain an independent authoritative `paid=true` flag that can disagree with Module 04.

If no financial record is linked, Triply may show payment state as `Not tracked`.

### 5.5 Due state

For checklist items with a due date:

```text
upcoming
 due today
overdue
completed
```

These are derived presentation states, not authoritative mutable statuses except `completed`.

---

## 6. Reservation types

MVP standard types:

1. `accommodation`
2. `restaurant`
3. `attraction_activity`
4. `event`
5. `rental`
6. `transfer`
7. `transport_reference`
8. `other`

`transport_reference` exists only when the user wants to attach booking/reference details to a canonical Module 03 Travel Leg. It must not duplicate route endpoints, schedule or mode as competing editable truth.

The UI may display friendly labels in the active locale.

---

## 7. Reservation fields

### 7.1 Required

Every Reservation requires:

- `trip_id`;
- `title`;
- `type`;
- `status`.

### 7.2 Optional

May include:

- `stop_id`;
- `itinerary_item_id`;
- `travel_leg_id` for transport reference/booking details;
- provider/supplier;
- confirmation/reference code;
- booking URL;
- provider phone/email as plain optional contact fields;
- start local date;
- start local time;
- end local date;
- end local time;
- timezone context when required;
- address/location text;
- cancellation deadline;
- free-cancellation indicator;
- cancellation notes;
- general notes;
- external reference metadata;
- linked Module 04 planned-cost/payment reference(s), using the architecture-approved relationship strategy.

### 7.3 Sensitive data boundary

Reservation notes must not encourage users to store payment-card numbers, CVV, passwords or other secrets.

If the UI presents helper copy, it should explicitly discourage storing such secrets.

---

## 8. Reservation lifecycle

### 8.1 Create as planned

A user may create a Reservation before booking anything externally.

Example:

```text
Louvre Museum
Status: planned
Date: 14 Sep
```

### 8.2 Mark booked

After an external booking is confirmed, the user may set:

```text
status = booked
confirmation_code = ABC123
provider = Louvre
```

No payment record is created automatically.

### 8.3 Mark completed

The user may manually mark a booked reservation as completed.

Passing its date/time does not automatically mark it completed in the MVP.

### 8.4 Cancel

Cancellation changes the Reservation to `cancelled` and preserves the record.

Cancellation must not automatically:

- delete linked payments;
- create a refund;
- remove an itinerary item;
- delete uploaded documents;
- change a Travel Leg status.

Those actions remain explicit in their owning modules.

### 8.5 Reopen cancelled reservation

MVP recommendation: a cancelled Reservation may be returned to `planned` or `booked` manually if the user made a mistake or reactivated the booking.

The cancellation history/audit timestamp should remain available if Architecture provides lightweight audit support, but a full event-sourcing system is not required.

---

## 9. Reservation dates and timezones

Reservation dates/times must follow the local-time principles from Module 03 and Module 06.

Examples:

- hotel check-in in Tokyo displays in Tokyo local time;
- dinner reservation in Paris remains 20:00 Paris time even if the user opens Triply from Portugal;
- a multi-day hotel reservation may have start and end dates;
- a reservation may have a date without a fixed clock time.

Device timezone must never silently shift a reservation's intended local clock time.

---

## 10. Stop association

A Reservation may optionally belong to a Stop.

Examples:

```text
Hotel in Paris → Paris Stop
Restaurant in Prague → Prague Stop
```

Stop association is optional because some reservations may be Trip-wide or route-bound.

A referenced Stop must belong to the same Trip.

---

## 11. Itinerary association

A Reservation may optionally be linked to an existing Itinerary Item.

Example:

```text
Itinerary Item: Louvre Museum — 09:30
Reservation: Louvre timed-entry ticket — ABC123
```

Rules:

- the Itinerary Item remains canonical owner of itinerary placement/time;
- Reservation remains canonical owner of booking/reference metadata;
- editing reservation details must not silently rewrite itinerary time;
- deleting one must not cascade-delete the other;
- broken relationships after deletion must be safely detached or flagged for review.

The user must also be able to create a Reservation without an Itinerary Item.

---

## 12. Travel Leg association

For transport bookings already represented by Module 03, Triply should not create a second transport object.

Instead, a Reservation may attach booking metadata to a Travel Leg, for example:

```text
Travel Leg:
Paris → Brussels
Train
10:30 → 12:00

Reservation metadata:
Provider: Eurostar
Reference: ZX81AB
Booking URL: ...
```

Route endpoints, transport mode and schedule remain owned by Module 03.

If a Travel Leg becomes `needs_review` because the route changes, its attached reservation metadata remains preserved and visible.

---

## 13. Financial relationship

Reservations and finances are deliberately separate.

### 13.1 No automatic cost creation

Creating a Reservation does not automatically create:

- a planned cost;
- a Payment;
- an Actual Expense.

### 13.2 Optional linking

The UI may allow the user to link an existing Module 04 cost/financial record or explicitly create one through a cross-module action.

Any explicit "Add cost" action must:

- clearly tell the user a financial record will be created;
- use Module 04 rules;
- avoid duplicate records on retries;
- preserve independent lifecycle after creation.

### 13.3 Payment display

When linked financial records exist, Reservations may surface their canonical payment summary.

Example:

```text
Hotel Paris
Booked
€276 committed
€100 paid
€176 remaining
```

Those values are computed/read from Module 04, not separately stored as Reservation truth.

---

## 14. Cancellation and refunds

Cancelling a Reservation is not the same as receiving money back.

Example:

```text
Hotel booking cancelled
Original payment: €300
Refund received later: €250
Cancellation fee: €50
```

Module 07 records the cancelled booking.
Module 04 records the financial reality.

Triply must never assume a full refund from a cancellation.

---

## 15. Reservation deletion

Because Reservations can contain historical confirmation and cancellation context:

- ordinary active/planned reservations may be deleted with confirmation;
- cancelled/completed reservations should prefer history-preserving deletion semantics if Architecture can provide soft deletion cheaply;
- any deletion must not cascade into financial records, itinerary items, Travel Legs or documents;
- linked records are detached safely.

For MVP UX, a clear confirmation is sufficient; typing the reservation name is not required.

---

## 16. Checklist model

Each Checklist Item includes:

### Required

- `trip_id`;
- `title`;
- completion state.

### Optional

- `stop_id`;
- due date;
- notes;
- category;
- sort order.

A checklist item does not require a destination.

---

## 17. Checklist categories

Standard categories:

- Booking
- Documents
- Money
- Packing
- Health & safety
- Connectivity
- Transport
- Accommodation
- Activities
- Other

The category is organizational only and does not create cross-module records.

Custom checklist categories are out of scope for MVP unless they can reuse the custom-category infrastructure from Module 04 without introducing coupling. Free-text `Other` remains available.

---

## 18. General vs destination-specific checklist

Checklist items may be:

### General Trip item

```text
Check passport validity
Buy insurance
Notify bank
```

### Stop-specific item

```text
Book Berlin museum
Check Prague public transport pass
```

Stop-specific items must reference a Stop belonging to the same Trip.

---

## 19. Checklist completion

When an item is completed:

- `is_completed = true`;
- `completed_at` is recorded;
- the original title, notes and due date remain;
- user may reopen it by marking incomplete;
- reopening clears or supersedes the current completion timestamp according to Architecture's chosen simple implementation.

Completion does not trigger any automatic Reservation, Expense, Document or Itinerary changes.

---

## 20. Due dates and overdue behavior

Due dates are optional civil calendar dates.

If an incomplete checklist item's due date is before the current local date for the user's product context, display it as overdue.

Rules:

- overdue is advisory;
- overdue does not block the Trip;
- completed items are never displayed as overdue;
- no notification infrastructure is required in MVP;
- changing Trip dates does not automatically rewrite checklist due dates.

---

## 21. Checklist ordering

Users can manually order checklist items.

Requirements:

- ordering must be deterministic;
- completion must not destroy manual order;
- UI may group completed items separately while retaining canonical order metadata;
- drag-and-drop may exist but cannot be the only accessible reorder method;
- concurrency/retry must not corrupt sort positions.

---

## 22. Suggested checklist templates

MVP may offer a small optional starter checklist when creating a Trip or opening an empty checklist for the first time.

Recommended starter items:

```text
Check passport/ID validity
Check visa/entry requirements
Buy travel insurance
Confirm accommodation
Confirm transport bookings
Check mobile data/eSIM
Prepare payment methods
Download important reservations/documents
```

Rules:

- templates are suggestions, not mandatory requirements;
- user chooses to add them or explicitly accepts an onboarding default;
- Triply must not claim a generic checklist proves legal entry eligibility;
- visa/passport guidance must not be presented as authoritative immigration/legal advice;
- duplicate template insertion must be idempotent.

---

## 23. Route-change behavior

Route changes must preserve user data wherever possible.

### 23.1 Stop deleted

If a checklist item or reservation references a deleted Stop:

- do not silently delete the record;
- detach or preserve a tombstoned reference according to Architecture;
- mark the record `needs_review` when its destination context is no longer valid.

### 23.2 Stop reordered

Reservation/checklist associations follow the Stop identity, not its old ordinal position.

No data should change merely because a Stop moved from position 2 to position 4.

### 23.3 Stop dates changed

If reservation dates now fall outside the Stop window:

- preserve the reservation;
- show a review warning;
- do not automatically move its date.

Checklists are not automatically changed.

---

## 24. Trip-date behavior

If Trip dates contract and a Reservation falls outside the new Trip range:

- preserve the Reservation;
- mark it for review;
- do not silently delete or move it.

Checklist items with due dates outside the Trip range remain valid because many preparation tasks naturally occur before the Trip.

---

## 25. Search, filter and grouping

MVP reservation view should support at least lightweight filtering/grouping by:

- status;
- type;
- Stop;
- upcoming date.

Checklist view should support at least:

- all;
- open;
- completed;
- overdue;
- Stop/general context.

Full-text search is optional for MVP and must not block approval if lists remain usable at realistic Trip scale.

---

## 26. Empty states

### No reservations

Explain the value and provide primary action:

> Keep hotels, restaurants, tickets and booking references together.

CTA: **Add reservation**

### No checklist items

CTA options:

- **Add task**
- **Use starter checklist**

### No open tasks

Celebrate completion lightly without claiming the traveller is legally or operationally guaranteed ready to travel.

---

## 27. Loading, success and failure behavior

All mutations must include:

- visible pending state;
- prevention of accidental duplicate submission;
- recoverable error feedback;
- preservation of unsaved form values on recoverable failure;
- explicit retry where useful;
- no optimistic deletion unless rollback is guaranteed.

Network failure must never produce duplicate reservations/checklist items after retry.

---

## 28. Mobile requirements

The module is expected to be heavily used on mobile during travel.

Requirements:

- core reservation information readable without horizontal scrolling;
- confirmation code easy to copy;
- booking URL easy to open;
- status change reachable with one-handed interaction where practical;
- checklist completion tap targets meet accessibility sizing;
- filters usable on narrow screens;
- forms tolerate mobile keyboard and long provider/reference values;
- no core action depends on hover.

---

## 29. Accessibility requirements

- status must not rely on color alone;
- checklist controls have accessible labels;
- completion state announced to assistive technology;
- keyboard operation for desktop;
- confirmation codes remain selectable/copyable;
- form validation tied programmatically to fields;
- focus is managed after modal/dialog actions;
- drag-and-drop is not the sole ordering mechanism.

---

## 30. Security and privacy requirements

Reservations may contain sensitive travel context.

The implementation must:

- enforce ownership server-side and through RLS where applicable;
- prevent cross-user access by guessed IDs;
- sanitize/escape notes and provider fields;
- validate booking URLs before rendering as actionable links;
- never execute user-provided HTML/scripts;
- avoid logging confirmation codes unnecessarily;
- never log secrets or document content;
- discourage storage of payment-card credentials/passwords;
- keep private booking details unavailable to unauthenticated users.

A cross-user reservation/checklist data leak is release-blocking.

---

## 31. Derived summary metrics

The module may expose canonical derived counts for Dashboard consumption:

```text
reservations_planned
reservations_booked
reservations_cancelled
open_checklist_count
overdue_checklist_count
completed_checklist_count
```

These may be computed server-side/query-side. They must not become independently mutable counters that can drift from source records.

---

## 32. Acceptance criteria — Reservations

### AC-07-01 — Create planned reservation

**GIVEN** an authenticated owner has a Trip  
**WHEN** they create a reservation with a valid title/type  
**THEN** it is stored as `planned` and visible only to that owner.

### AC-07-02 — Booked reservation

**GIVEN** a planned reservation exists  
**WHEN** the owner marks it booked and supplies a confirmation code  
**THEN** the status changes without creating any Payment automatically.

### AC-07-03 — Reservation without Stop

**GIVEN** a Trip exists  
**WHEN** a general Trip reservation is created without `stop_id`  
**THEN** creation succeeds.

### AC-07-04 — Reservation with Stop

**GIVEN** a Stop belongs to the Trip  
**WHEN** a Reservation references it  
**THEN** the relationship is accepted.

### AC-07-05 — Foreign Stop rejected

**GIVEN** a Stop belongs to another Trip  
**WHEN** a Reservation attempts to reference it  
**THEN** the server rejects the mutation.

### AC-07-06 — Local time stability

**GIVEN** a dinner reservation is 20:00 in Paris  
**WHEN** the user opens Triply in another device timezone  
**THEN** the reservation remains 20:00 Paris local time.

### AC-07-07 — Date-only reservation

**GIVEN** a museum ticket has a date but no fixed time  
**WHEN** it is saved  
**THEN** Triply does not invent midnight as a visible appointment time.

### AC-07-08 — Multi-day accommodation

**GIVEN** a hotel booking spans 10–13 September  
**WHEN** saved  
**THEN** both dates are preserved without forcing itinerary duplication.

### AC-07-09 — Itinerary link

**GIVEN** an Itinerary Item belongs to the same Trip  
**WHEN** linked to a Reservation  
**THEN** the booking metadata and itinerary placement remain separately editable.

### AC-07-10 — Deleted itinerary item

**GIVEN** a Reservation is linked to an Itinerary Item  
**WHEN** the Itinerary Item is deleted  
**THEN** the Reservation remains and its broken association is safely detached/reviewable.

### AC-07-11 — Travel Leg booking reference

**GIVEN** a canonical Travel Leg exists  
**WHEN** a train booking reference is attached  
**THEN** no second route/schedule record is created.

### AC-07-12 — Travel Leg route change

**GIVEN** a linked Travel Leg enters `needs_review` after reorder  
**WHEN** Reservations are viewed  
**THEN** its booking metadata remains preserved with a review warning.

### AC-07-13 — No automatic cost

**GIVEN** the user creates a hotel reservation  
**WHEN** it is saved  
**THEN** no financial record exists unless the user explicitly creates/links one.

### AC-07-14 — Linked payment summary

**GIVEN** a Reservation is linked to Module 04 records  
**WHEN** €100 of €276 is paid  
**THEN** Reservation UI can show canonical `€100 paid / €176 remaining` without storing a competing paid amount.

### AC-07-15 — Cancellation

**GIVEN** a booked Reservation exists  
**WHEN** the user cancels it  
**THEN** it becomes `cancelled` and remains in history.

### AC-07-16 — Cancellation does not refund

**GIVEN** a paid Reservation is cancelled  
**WHEN** cancellation completes  
**THEN** Triply does not create a refund automatically.

### AC-07-17 — Cancellation does not delete itinerary

**GIVEN** a Reservation is linked to an Itinerary Item  
**WHEN** the reservation is cancelled  
**THEN** the Itinerary Item remains unchanged.

### AC-07-18 — Manual completion

**GIVEN** a booked Reservation date has passed  
**WHEN** no manual action occurred  
**THEN** it is not silently marked completed.

### AC-07-19 — Reopen cancelled reservation

**GIVEN** a Reservation was cancelled by mistake  
**WHEN** owner changes it back to `planned` or `booked`  
**THEN** the record is usable again without recreating linked records.

### AC-07-20 — Safe deletion

**GIVEN** a Reservation has linked financial/itinerary/document relationships  
**WHEN** it is deleted through an allowed delete flow  
**THEN** linked canonical records are not cascade-deleted.

### AC-07-21 — Stop deletion preservation

**GIVEN** a Reservation references Paris  
**WHEN** the Paris Stop is deleted  
**THEN** Reservation data remains preserved and becomes reviewable/detached.

### AC-07-22 — Stop reorder stability

**GIVEN** a Reservation references Stop identity `S2`  
**WHEN** S2 changes route position  
**THEN** the Reservation continues referencing S2, not the old ordinal slot.

### AC-07-23 — Stop date conflict

**GIVEN** reservation date falls inside a Stop window  
**WHEN** Stop dates change and no longer contain it  
**THEN** reservation remains with a non-destructive warning.

### AC-07-24 — Trip contraction

**GIVEN** a Reservation falls on the old final Trip day  
**WHEN** Trip end date moves earlier  
**THEN** reservation remains and is flagged for review.

---

## 33. Acceptance criteria — Checklist

### AC-07-25 — Create general task

**GIVEN** a Trip exists  
**WHEN** owner creates `Buy travel insurance` without Stop  
**THEN** it appears as an open general task.

### AC-07-26 — Create destination task

**GIVEN** Berlin Stop belongs to the Trip  
**WHEN** owner creates `Book museum` linked to Berlin  
**THEN** it appears in Berlin context.

### AC-07-27 — Complete task

**GIVEN** an open checklist item exists  
**WHEN** user marks it complete  
**THEN** completion state and completion timestamp are recorded.

### AC-07-28 — Reopen task

**GIVEN** a completed task exists  
**WHEN** user marks it incomplete  
**THEN** it returns to the open list without being duplicated.

### AC-07-29 — Overdue task

**GIVEN** an incomplete item has a due date before today  
**WHEN** checklist loads  
**THEN** it is displayed as overdue but remains editable/completable.

### AC-07-30 — Completed task not overdue

**GIVEN** a completed item has a past due date  
**WHEN** checklist loads  
**THEN** it is shown completed, not overdue.

### AC-07-31 — Future due date

**GIVEN** a task is due in three days  
**WHEN** checklist loads  
**THEN** it is shown as upcoming without being treated as overdue.

### AC-07-32 — Due date before Trip allowed

**GIVEN** Trip starts 15 September  
**WHEN** a passport task is due 1 September  
**THEN** the due date is accepted.

### AC-07-33 — Route change does not change due date

**GIVEN** a checklist item has a due date  
**WHEN** Stop or Trip dates change  
**THEN** the due date is preserved unless user edits it.

### AC-07-34 — Stop deletion preserves task

**GIVEN** a checklist item references a Stop  
**WHEN** Stop is deleted  
**THEN** checklist item is preserved and detached/reviewable.

### AC-07-35 — Ordering

**GIVEN** five checklist items exist  
**WHEN** owner moves item 5 to position 1  
**THEN** the order persists deterministically after reload.

### AC-07-36 — Completion does not corrupt order

**GIVEN** manually ordered tasks exist  
**WHEN** one is completed and later reopened  
**THEN** its canonical order remains stable.

### AC-07-37 — Starter checklist opt-in

**GIVEN** the Trip checklist is empty  
**WHEN** user explicitly chooses `Use starter checklist`  
**THEN** suggested items are added once without duplicates.

### AC-07-38 — Starter checklist retry idempotency

**GIVEN** starter insertion succeeds server-side but response is lost  
**WHEN** user retries  
**THEN** the same template items are not duplicated.

### AC-07-39 — No automatic cross-module records

**GIVEN** checklist item says `Book Louvre`  
**WHEN** user completes it  
**THEN** no Reservation, Expense or Itinerary Item is created automatically.

### AC-07-40 — User isolation

**GIVEN** User A and User B both have Trips  
**WHEN** User B guesses a Reservation or Checklist ID owned by User A  
**THEN** access is denied without leaking private metadata.

---

## 34. Acceptance criteria — Reliability, security and UX

### AC-07-41 — Duplicate submission protection

**GIVEN** a slow network  
**WHEN** user taps Save twice rapidly  
**THEN** at most one intended Reservation/Checklist record is created.

### AC-07-42 — Failed save preserves input

**GIVEN** user filled a long reservation form  
**WHEN** a recoverable network error occurs  
**THEN** entered values remain available for retry.

### AC-07-43 — Unsafe booking URL

**GIVEN** a malicious URL scheme is entered  
**WHEN** Reservation is displayed  
**THEN** Triply does not render it as an executable unsafe link.

### AC-07-44 — Script content in notes

**GIVEN** notes contain script-like markup  
**WHEN** rendered  
**THEN** it is displayed safely and not executed.

### AC-07-45 — Confirmation code privacy

**GIVEN** a Reservation contains a booking code  
**WHEN** normal application logs are inspected  
**THEN** the code is not unnecessarily present in logs.

### AC-07-46 — Mobile copy action

**GIVEN** a user opens a booking on a narrow mobile screen  
**WHEN** they need the confirmation code  
**THEN** they can easily select/copy it without horizontal layout failure.

### AC-07-47 — Accessible checklist completion

**GIVEN** a keyboard or assistive-technology user  
**WHEN** they toggle task completion  
**THEN** the state change is operable and announced without relying on color.

### AC-07-48 — Realistic scale

**GIVEN** a 30-day Trip with 100 reservations and 200 checklist items  
**WHEN** the module is used  
**THEN** filtering, ordering and primary interactions remain usable without data corruption.

---

## 35. Architecture Agent requirements

Architecture must define:

1. Reservation entity and lifecycle representation;
2. Checklist entity and completion representation;
3. relationship strategy with Stop, Itinerary Item, Travel Leg and Module 04 finance;
4. strategy for preserving links when parent contextual records are removed;
5. timezone/local-date storage strategy consistent with ADR-003;
6. deterministic checklist ordering;
7. soft-delete vs hard-delete decision for Reservation history;
8. idempotency strategy for creates/template insertion;
9. derived summary query/API contract for Dashboard;
10. URL validation boundary;
11. safe handling of confirmation codes and sensitive booking metadata;
12. query/index strategy for realistic Trip scale.

Architecture may not redefine financial truth, route truth or itinerary truth.

---

## 36. Database Agent requirements

Database must ensure:

- owner/RLS isolation;
- same-Trip foreign relationship integrity;
- valid reservation statuses;
- safe nullable date/time fields;
- valid URL storage boundary or server validation contract;
- deterministic checklist ordering support;
- completion timestamps;
- no cascade deletion into canonical financial, itinerary, route or document records;
- indexes for Trip/status/type/date/Stop queries;
- non-destructive migrations unless separately approved;
- optional review/orphan state representation when relationships become invalid.

---

## 37. Backend Agent requirements

Backend/server logic must:

- validate ownership independently of client state;
- validate all same-Trip relationships;
- enforce reservation lifecycle rules;
- avoid automatic Payment/refund/Expense creation;
- surface Module 04 financial summaries only from canonical sources;
- implement checklist completion atomically;
- implement deterministic reorder atomically;
- make starter-template insertion idempotent;
- validate/normalize actionable booking URLs;
- avoid sensitive confirmation-code logging;
- return review warnings for route/date inconsistencies;
- make create/update retries safe against duplication.

---

## 38. Frontend Agent requirements

Frontend must:

- distinguish reservation status from payment state visually and semantically;
- never show `paid` as reservation lifecycle status;
- make booking code copyable;
- make booking URLs safe/actionable only when validated;
- clearly display Stop/date context;
- show review warnings without silently fixing records;
- provide lightweight filters;
- provide open/completed/overdue checklist views;
- preserve unsaved values after recoverable errors;
- provide non-drag checklist reordering;
- implement loading, empty, success and error states;
- be mobile-first and accessible.

---

## 39. QA Agent requirements

QA must verify every AC-07 scenario plus:

- cross-user RLS;
- malformed/unsafe URLs;
- XSS-safe notes/provider rendering;
- confirmation-code log leakage checks where testable;
- no financial double-source fields;
- no route duplication for Travel Leg-associated bookings;
- local-time correctness across materially different timezones;
- route deletion/reorder/date-change preservation;
- checklist ordering/reopen stability;
- starter-template idempotency;
- slow-network duplicate-submit behavior;
- mobile flows;
- realistic-scale fixtures.

Any cross-user data leak, silent deletion of booking history, duplicated financial truth or unsafe URL/script execution is release-blocking.

---

## 40. Definition of Done

Module 07 can be marked implementation-complete only when:

- this spec is APPROVED;
- Architecture plan passes its gate;
- Design covers all mandatory states;
- Database relationships, constraints and RLS pass;
- Backend lifecycle/idempotency behavior passes automated tests;
- Frontend clearly separates reservation/payment/checklist concepts;
- all AC-07 scenarios pass or have approved test mappings;
- QA verdict is APPROVED;
- no open P0/P1 security or correctness defect exists;
- Module 08 can attach documents without redefining Reservation ownership;
- Module 09 can consume derived reservation/checklist summaries without rebuilding their business rules.

---

## 41. Product decisions proposed for owner approval

### P07-01 — Reservation lifecycle is separate from payment state

Use `planned`, `booked`, `cancelled`, `completed`; payment truth comes from Module 04.

**Recommendation: APPROVE.**

### P07-02 — No automatic financial records

Creating/cancelling a Reservation never silently creates costs, payments or refunds.

**Recommendation: APPROVE.**

### P07-03 — Travel Leg remains canonical for inter-destination transport

Transport Reservation data attaches booking metadata to a Travel Leg rather than duplicating route/schedule truth.

**Recommendation: APPROVE.**

### P07-04 — Itinerary link is optional and non-owning

Reservation metadata and itinerary placement remain independently editable.

**Recommendation: APPROVE.**

### P07-05 — Cancelled reservations remain in history

Cancellation is a state transition, not silent deletion.

**Recommendation: APPROVE.**

### P07-06 — Completion is manual in MVP

Passing a reservation date/time does not automatically mark it completed.

**Recommendation: APPROVE.**

### P07-07 — Checklist supports Trip-wide and Stop-specific tasks

Stop association remains optional.

**Recommendation: APPROVE.**

### P07-08 — Checklist due dates may be before the Trip

Preparation tasks naturally occur before departure.

**Recommendation: APPROVE.**

### P07-09 — Overdue is advisory

An overdue task warns the user but never blocks the Trip.

**Recommendation: APPROVE.**

### P07-10 — Starter checklist is opt-in/idempotent

Triply may suggest a useful starter list but must not impose or duplicate it.

**Recommendation: APPROVE.**

### P07-11 — Route/date changes preserve records

Invalidated associations produce review states rather than silent deletion or auto-moving.

**Recommendation: APPROVE.**

### P07-12 — No secrets in reservation notes

Product copy discourages storing card credentials, passwords and similar secrets.

**Recommendation: APPROVE.**

### P07-13 — Deletion must not cascade across modules

Deleting a Reservation never deletes canonical finance, itinerary, route or document data.

**Recommendation: APPROVE.**

### P07-14 — Custom checklist categories are not required for MVP

Use standard categories plus `Other`; revisit custom categories after core usage is validated.

**Recommendation: APPROVE.**

---

## 42. Approval gate

This spec may change from `REVIEW` to `APPROVED` only after the Product Owner approves the P07 decisions above or explicitly overrides them.

Until then:

- Architecture may inspect the spec;
- autonomous implementation must not start;
- agents must not invent alternative product rules.


## Amendment v1.1 — Task priority and deletion; optional timezone (owner request, 2026-10-05)

- Checklist tasks have a **priority**: Alta, Média or Baixa. Default is **Alta**. Lists (planning page and dashboard) are ordered by priority (Alta first), then by manual order. Each task shows its priority.
- Tasks can be **deleted** from the list (bin icon with inline confirmation) and from the edit page.
- A reservation time no longer requires a timezone.
