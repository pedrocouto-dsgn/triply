# SPEC — Module 08: Documents

Version: 1.1  
Status: APPROVED
Module ID: `08-documents`  
Depends on: `spec/00-product.md`, `spec/01-auth-onboarding.md`, `spec/02-trips.md`, `spec/03-destinations-legs.md`, `spec/07-reservations-checklists.md`, `docs/adr/ADR-004-private-documents.md`, `AGENTS.md`  
Primary handoff: Module 09 — Dashboard  
Security milestone: REQUIRED after implementation

---

## 1. Purpose

Give travellers one private, reliable place to organize the documents and files needed for a Trip without turning Triply into an identity vault or document-management system.

The module must support two related concepts:

1. **Document records** — structured metadata such as type, title, owner/traveller label, issue/expiry dates, status, notes and associations.
2. **Private file attachments** — optional uploaded files such as PDFs or images stored securely and accessible only to the authenticated Trip owner.

The module must answer:

> Which documents do I need for this trip, which ones are ready, which are expiring or missing, and where can I access the relevant file safely?

Document metadata must remain useful even when no file is uploaded.

---

## 2. Product outcomes

When this module is complete, the authenticated Trip owner can:

1. create a document record without uploading a file;
2. optionally upload a private file to a document record;
3. classify a document by travel-relevant type;
4. associate a document with the whole Trip, a Stop, Reservation or Travel Leg when relevant;
5. record issue date and expiry date when applicable;
6. identify documents that are valid, expiring soon, expired, missing or not applicable;
7. distinguish personal identity documents from booking/voucher documents;
8. view/download their own private attachments through authorized short-lived access;
9. replace an attachment without silently losing the document record;
10. delete an attachment while keeping metadata when desired;
11. delete a document record explicitly;
12. organize documents for more than one traveller using a lightweight traveller label;
13. search/filter documents by type, status, traveller and destination;
14. receive clear warnings for expired or soon-to-expire documents without Triply making legal eligibility claims;
15. use the full flow comfortably on mobile.

---

## 3. Actors

### 3.1 Authenticated Trip owner

Can create, read, edit and delete document records and attachments belonging to Trips they own.

### 3.2 Authenticated non-owner

Cannot list, inspect, download, infer metadata about or mutate another user's documents or files.

### 3.3 Visitor

Cannot access private document metadata, files, signed URLs or storage paths.

---

## 4. Scope

### Included

- document metadata CRUD;
- optional private file upload;
- file replacement/removal;
- document type;
- lightweight traveller/holder label;
- issue date;
- expiry date;
- document status derived from available metadata where possible;
- custom title;
- notes;
- Trip-level documents;
- optional Stop association;
- optional Reservation association;
- optional Travel Leg association;
- filtering and basic search;
- expiry warnings;
- secure private download/view access;
- upload validation;
- storage cleanup when attachments or records are permanently deleted;
- mobile-compatible interaction;
- security audit milestone.

### Out of scope for MVP

- OCR;
- automatic extraction of passport/visa fields;
- passport or ID verification;
- biometric processing;
- visa eligibility determination;
- automated government/embassy checks;
- travel requirement databases;
- document sharing with other users;
- collaborative Trips;
- offline encrypted document wallet;
- end-to-end encryption managed by the user;
- digital signatures;
- password-protected document vault;
- scanning NFC passport chips;
- storing payment cards;
- auto-importing attachments from email;
- file version history beyond current attachment replacement;
- legal advice about immigration, entry or document validity.

---

## 5. Core concepts

### 5.1 Document Record

A Trip-owned structured record representing one travel document or travel-related file.

A Document Record MAY exist without an uploaded file.

Examples:

- Passport — Gabriele
- Travel insurance policy
- Hotel voucher — Paris
- Schengen visa
- Train ticket — Paris → Brussels

### 5.2 Attachment

The current private file optionally associated with a Document Record.

The attachment is storage data, not the source of truth for the document's metadata.

### 5.3 Holder / Traveller label

A lightweight text label identifying whose personal document it is, for example:

- Gabriele
- Pedro
- Traveller 2

This is intentionally **not** a full Traveller entity in the MVP.

### 5.4 Document Type

Default types:

- `passport`
- `national_id`
- `visa`
- `travel_insurance`
- `health_document`
- `ticket_or_boarding_pass`
- `accommodation_voucher`
- `reservation_voucher`
- `driver_document`
- `rental_document`
- `other`

The display copy may be localized; internal identifiers must remain stable.

---

## 6. Document metadata

A Document Record may contain:

- `id`;
- `trip_id`;
- `type`;
- `title`;
- optional `holder_label`;
- optional `stop_id`;
- optional `reservation_id`;
- optional `travel_leg_id`;
- optional `issue_date`;
- optional `expiry_date`;
- optional `notes`;
- optional attachment metadata;
- timestamps.

### 6.1 Sensitive-field minimization

Triply must not require users to type the full passport number, national ID number, visa number or other government identifier in structured fields for the MVP.

If users voluntarily put sensitive identifiers in free-text notes, the UI should discourage this and remind them that the file itself can be stored privately instead.

No full payment-card data, passwords, PINs or authentication secrets may be stored in this module.

---

## 7. Creating a document

A document can be created from:

1. the Trip Documents page;
2. a contextual action from a Reservation;
3. a contextual action from a Travel Leg;
4. a contextual action from a Stop, where supported by the UI.

Minimum required data:

- Trip;
- Document Type;
- Title.

File upload is optional.

Creating a record must not require an expiry date because many travel documents and vouchers do not have one.

---

## 8. File upload rules

### 8.1 Allowed MVP file formats

Recommended allowlist:

- PDF;
- JPEG/JPG;
- PNG;
- WEBP.

The architecture/security implementation may use MIME inspection in addition to extension validation.

### 8.2 Maximum file size

Recommended MVP maximum: **10 MB per attachment**.

The limit must be enforced server-side/storage-side, not only in the browser.

### 8.3 One active attachment per Document Record

For the MVP, a Document Record has at most one active file attachment.

Replacing a file replaces the attachment, not the Document Record.

A future version may introduce multiple attachments/versioning.

### 8.4 Upload failures

A failed upload must never create a state that falsely indicates a file exists.

If metadata was successfully created before the upload failed, the user must see the record as `No file attached` and be able to retry.

### 8.5 Malware and content safety

The architecture/security agents must define the production-grade upload validation path. At minimum:

- private bucket/container;
- MIME/type validation;
- size validation;
- generated storage names rather than trusting user file names;
- safe Content-Disposition behavior;
- no executable rendering;
- security review before production.

If malware scanning is unavailable in the first implementation, this limitation must be documented as a production-readiness risk rather than silently ignored.

---

## 9. Private storage and access

All uploaded documents are **private by default and permanently non-public** in the MVP.

Rules:

1. storage bucket/container must not permit anonymous public reads;
2. authorization must be based on authenticated ownership, not obscurity of the URL;
3. storage paths must not contain sensitive document values;
4. permanent public URLs are forbidden;
5. file access uses authenticated download/streaming or short-lived signed URLs;
6. signed URLs must have a short expiry chosen by Architecture/Security;
7. a user cannot request a signed URL for another user's document;
8. frontend code must never receive service-role credentials;
9. document metadata must be protected by database RLS/authorization;
10. deleting an attachment must eventually remove its storage object;
11. orphaned upload cleanup must be considered by Architecture.

---

## 10. Document validity and derived status

Document status is not a freely editable duplicate field when it can be derived from metadata.

Recommended derived states:

- `missing_file` — record exists and a file is expected by user context but no attachment exists; UI-level indicator, not necessarily persisted;
- `valid` — expiry exists and is after the warning window, or no expiry applies;
- `expiring_soon` — expiry is within the configured warning window;
- `expired` — expiry date is before today's date in the user's display timezone;
- `no_expiry` — no expiry date is provided/applicable.

### 10.1 Default expiry warning

MVP recommendation: warn **90 days before expiry**.

This warning is informational only.

Triply must say, in effect:

> This document expires soon.

Triply must NOT say:

> You cannot enter Country X with this passport.

because entry requirements vary and require current authoritative information outside this module.

### 10.2 Trip-date awareness

When an expiry date exists, the UI may additionally warn when a document expires before the end of the Trip.

Example:

- Trip: 1–15 September
- Passport expiry: 10 September

Result: strong warning that the document expires during the Trip.

This remains an organizational warning, not a legal eligibility judgment.

---

## 11. Associations

### 11.1 Trip

Every document belongs to exactly one Trip.

### 11.2 Stop

Optional. Useful for visa documents, city-specific vouchers or local activities.

A document may have at most one direct Stop association in the MVP.

### 11.3 Reservation

Optional. Useful for hotel confirmations, attraction vouchers and restaurant confirmations.

A reservation may have zero or more Document Records associated with it.

Deleting/cancelling a Reservation must **not** silently delete a Document Record or attachment.

If an associated Reservation is deleted, the Document becomes unlinked and the user is informed where appropriate.

### 11.4 Travel Leg

Optional. Useful for flight/train/bus/ferry tickets or boarding documents.

Deleting or changing a Travel Leg must not silently delete the document.

### 11.5 Cross-Trip associations

Forbidden. A document owned by Trip A cannot be linked to entities belonging to Trip B.

This must be enforced server-side/database-side, not only by UI filtering.

---

## 12. Traveller / holder behavior

The MVP does not introduce a separate traveller-management module.

`holder_label` is optional free text scoped to the document.

The UI should allow filtering by holder label when multiple labels exist.

No automatic synchronization with `trip.traveller_count` is required.

Example:

A Trip with `traveller_count = 3` does not automatically create three passport records.

---

## 13. Document list and organization

The Documents area should support:

- all documents;
- type filter;
- holder filter when relevant;
- Stop/destination filter;
- status filter;
- text search on safe metadata such as title/provider-facing names;
- expired/expiring indicators;
- attachment-present indicator.

Default ordering recommendation:

1. urgent validity issues;
2. documents associated with upcoming route/reservation chronology;
3. remaining documents by most recently updated.

Exact presentation belongs to Design, but urgency must not be conveyed by color alone.

---

## 14. Viewing and downloading files

A user may request to open/download an attachment they own.

Required behavior:

1. authorization is checked at request time;
2. the backend/storage layer returns authorized access only;
3. access expires automatically if signed URLs are used;
4. browser caching and response headers must be reviewed for sensitive-file exposure;
5. errors must not leak bucket paths, internal IDs beyond what is necessary, or existence of another user's file.

On mobile, the user must have an explicit download/open action; hover-only controls are forbidden.

---

## 15. Replacing an attachment

When replacing a file:

1. validate the new file;
2. upload the new private object;
3. atomically or safely update attachment metadata;
4. only then remove/schedule deletion of the old object;
5. on failure, preserve access to the previous working attachment.

The system must not delete the old file first and risk leaving the user with no document if the new upload fails.

---

## 16. Deletion

### 16.1 Remove file only

User can remove the attachment while retaining the Document Record metadata.

Requires confirmation if the action is destructive and irreversible.

### 16.2 Delete Document Record

Deleting the Document Record must:

- require explicit confirmation;
- remove/unlink the private attachment safely;
- not delete associated Reservation, Stop, Travel Leg or financial records;
- leave no publicly accessible file URL behind.

### 16.3 Trip deletion

When a Trip is permanently deleted under Module 02 rules, its document metadata and private storage objects must be cleaned up according to the architecture's deletion/retention strategy.

Temporary archive of a Trip must not delete its documents.

---

## 17. Empty, loading, success and error states

### Empty state

Explain what Documents is for and offer `Add document`.

Optional examples may include:

- Passport
- Insurance
- Visa
- Booking voucher

Do not imply every traveller requires every listed document.

### Uploading state

Show clear progress/state and prevent duplicate submission where possible.

### Upload success

Show the document record and attachment as available.

### Upload error

Explain the actionable cause when safe:

- unsupported format;
- file too large;
- network error;
- upload failed;
- authorization/session expired.

Do not expose internal storage errors verbatim.

### Download/access error

Distinguish between retryable failure and lack of access without revealing another user's resource existence.

---

## 18. Security and privacy requirements

This module has a mandatory Security Agent review after QA.

Security review must specifically inspect:

1. private storage configuration;
2. RLS/authorization on metadata;
3. signed URL generation and expiry;
4. IDOR/BOLA attempts against document IDs and storage paths;
5. MIME/content-type validation;
6. upload size limits;
7. file-name sanitization and generated object keys;
8. cross-Trip relation validation;
9. XSS in title/notes/holder fields;
10. response headers when viewing/downloading;
11. deletion/orphan cleanup;
12. secrets/service role exposure;
13. logging — no sensitive file content or signed URLs in ordinary logs;
14. backup/retention implications documented for production;
15. rate limiting/abuse controls for upload endpoints where appropriate.

### Logging prohibition

Do not log:

- file contents;
- base64 payloads;
- signed URLs containing access tokens;
- government ID numbers entered in notes;
- authentication credentials.

---

## 19. Accessibility and mobile requirements

- upload/select controls must have accessible labels;
- document status cannot rely only on color;
- expiry warnings must be understandable by screen readers;
- keyboard users can add/edit/remove/open documents;
- confirmation dialogs must manage focus correctly;
- touch targets meet the project minimum;
- long filenames must truncate/wrap safely without breaking layout;
- mobile users can access documents without desktop-only interactions.

---

## 20. Performance and limits

The MVP should remain usable with at least:

- 100 Document Records in one Trip;
- common smartphone-uploaded images within the file-size limit;
- filters/search without requiring all file bytes to be downloaded.

Document list endpoints must return metadata only, never attachment bytes.

Images/PDFs must only be loaded when the user explicitly opens them.

---

## 21. Acceptance scenarios

### A. Metadata-only document

**DADO** uma viagem existente  
**QUANDO** o utilizador cria `Passport — Gabriele` sem ficheiro  
**ENTÃO** o Document Record é criado  
**E** permanece possível adicionar um ficheiro depois.

### B. Upload PDF

**DADO** um Document Record próprio  
**QUANDO** o utilizador envia um PDF válido dentro do limite  
**ENTÃO** o ficheiro é armazenado de forma privada  
**E** o documento passa a indicar que possui attachment.

### C. Upload image

**DADO** um Document Record próprio  
**QUANDO** é enviada uma imagem JPEG/PNG/WEBP válida  
**ENTÃO** a imagem é aceite  
**E** permanece privada.

### D. Unsupported format

**DADO** um ficheiro executável ou formato não permitido  
**QUANDO** o utilizador tenta enviar  
**ENTÃO** o upload é rejeitado  
**E** nenhum ficheiro fica marcado como disponível.

### E. Oversized file

**DADO** um ficheiro acima do limite  
**QUANDO** é enviado  
**ENTÃO** o upload é rejeitado server-side  
**E** a mensagem informa que o ficheiro excede o limite.

### F. Upload failure after metadata creation

**DADO** que o registo foi criado  
**E** o upload falha  
**ENTÃO** o Document Record continua válido sem attachment  
**E** o utilizador pode tentar novamente.

### G. Replace attachment safely

**DADO** um documento com ficheiro funcional  
**QUANDO** o utilizador tenta substituí-lo e o novo upload falha  
**ENTÃO** o ficheiro anterior continua disponível.

### H. Successful replacement

**DADO** um documento com attachment  
**QUANDO** um novo ficheiro é carregado com sucesso  
**ENTÃO** o novo attachment torna-se o ativo  
**E** o antigo é removido/agendado para cleanup seguro.

### I. Remove attachment only

**DADO** um documento com ficheiro  
**QUANDO** o utilizador remove apenas o attachment  
**ENTÃO** o Document Record permanece  
**E** o objeto privado deixa de estar acessível.

### J. Delete document

**DADO** um Document Record  
**QUANDO** o utilizador confirma a eliminação  
**ENTÃO** metadata e attachment são removidos de acordo com a política  
**E** entidades relacionadas não são eliminadas.

### K. Expiring soon

**DADO** um passaporte que expira dentro de 90 dias  
**QUANDO** a lista de documentos é aberta  
**ENTÃO** o documento é indicado como `expiring soon`  
**E** a mensagem não faz afirmações legais sobre entrada num país.

### L. Expired

**DADO** expiry_date anterior à data atual  
**QUANDO** o documento é apresentado  
**ENTÃO** aparece como expirado.

### M. Expires during Trip

**DADO** uma viagem que termina depois da validade do documento  
**QUANDO** o documento é avaliado  
**ENTÃO** aparece uma advertência forte de que expira durante a viagem.

### N. No expiry

**DADO** um voucher sem expiry_date  
**ENTÃO** o sistema não inventa validade nem mostra erro de dados incompletos.

### O. Reservation association

**DADO** uma reserva da mesma viagem  
**QUANDO** o utilizador associa um voucher  
**ENTÃO** o documento aponta para essa Reservation  
**SEM** duplicar dados de reserva.

### P. Travel Leg association

**DADO** um Travel Leg da mesma viagem  
**QUANDO** um bilhete é associado  
**ENTÃO** o documento fica acessível no contexto dessa deslocação.

### Q. Stop association

**DADO** um Stop da mesma viagem  
**QUANDO** um documento é associado ao Stop  
**ENTÃO** pode ser filtrado por esse destino.

### R. Cross-Trip association blocked

**DADO** um documento da Trip A  
**E** uma Reservation da Trip B  
**QUANDO** uma associação é tentada  
**ENTÃO** a operação é recusada no backend/database.

### S. Reservation deletion

**DADO** um documento ligado a uma Reservation  
**QUANDO** a Reservation é removida  
**ENTÃO** o documento não é apagado  
**E** a associação é removida/invalidada de forma segura.

### T. Travel Leg changed/deleted

**DADO** um bilhete ligado a um Travel Leg  
**QUANDO** a rota muda ou o Travel Leg é removido  
**ENTÃO** o documento é preservado  
**E** nunca é eliminado silenciosamente.

### U. Multiple travellers

**DADO** uma viagem com vários viajantes  
**QUANDO** são criados passaportes com holder labels diferentes  
**ENTÃO** podem ser distinguidos e filtrados  
**SEM** exigir uma entidade Traveller completa.

### V. Traveller count changes

**DADO** documentos com holder labels existentes  
**QUANDO** `traveller_count` muda  
**ENTÃO** documentos não são criados nem apagados automaticamente.

### W. Owner file access

**DADO** um utilizador autenticado  
**QUANDO** pede acesso ao próprio attachment  
**ENTÃO** recebe acesso autorizado temporário/streaming.

### X. Non-owner metadata access

**DADO** User B  
**QUANDO** tenta consultar o Document ID de User A  
**ENTÃO** o acesso é negado  
**E** dados privados não são retornados.

### Y. Non-owner signed URL attempt

**DADO** User B  
**QUANDO** tenta gerar acesso ao ficheiro de User A  
**ENTÃO** nenhuma signed URL é emitida.

### Z. Expired signed URL

**DADO** uma URL temporária expirada  
**QUANDO** é usada  
**ENTÃO** o ficheiro não é servido  
**E** o utilizador autenticado pode solicitar novo acesso.

### AA. Public access blocked

**DADO** o storage object path  
**QUANDO** uma pessoa não autenticada tenta aceder diretamente  
**ENTÃO** o ficheiro não é público.

### AB. Malicious filename

**DADO** um nome de ficheiro com caracteres/path traversal suspeitos  
**QUANDO** é enviado  
**ENTÃO** o sistema usa uma chave segura gerada internamente  
**E** o nome não controla o caminho real de storage.

### AC. XSS metadata

**DADO** HTML/script em title, notes ou holder_label  
**QUANDO** o valor é mostrado  
**ENTÃO** não executa código.

### AD. Sensitive data in logs

**DADO** upload/download de documento  
**QUANDO** logs são gerados  
**ENTÃO** conteúdo do ficheiro e signed URLs não aparecem nos logs comuns.

### AE. Session expiry during upload

**DADO** sessão expirada  
**QUANDO** o upload é submetido  
**ENTÃO** falha de forma segura  
**E** não cria acesso público/orphan autorizado incorretamente.

### AF. Retry upload

**DADO** falha transitória de rede  
**QUANDO** o utilizador tenta novamente  
**ENTÃO** o sistema não cria múltiplos attachments ativos acidentalmente.

### AG. Filter by type

**DADO** documentos de tipos diferentes  
**QUANDO** o utilizador filtra por `passport`  
**ENTÃO** apenas documentos correspondentes são apresentados.

### AH. Filter by holder

**DADO** vários holder labels  
**QUANDO** um holder é selecionado  
**ENTÃO** apenas os documentos desse label são apresentados.

### AI. Filter by Stop

**DADO** documentos ligados a diferentes Stops  
**QUANDO** o utilizador filtra um destino  
**ENTÃO** o resultado corresponde à associação.

### AJ. Search

**DADO** vários documentos  
**QUANDO** o utilizador pesquisa pelo título  
**ENTÃO** resultados relevantes aparecem sem procurar no conteúdo binário dos ficheiros.

### AK. Archive Trip

**DADO** uma viagem arquivada  
**QUANDO** é arquivada  
**ENTÃO** documentos permanecem armazenados e associados  
**E** não são apagados por causa do archive.

### AL. Permanent Trip deletion

**DADO** eliminação permanente autorizada de uma Trip  
**QUANDO** o processo termina  
**ENTÃO** metadata e attachments daquela Trip são incluídos no cleanup definido pela arquitetura.

### AM. Mobile access

**DADO** viewport móvel  
**QUANDO** o utilizador adiciona, filtra, abre ou remove documentos  
**ENTÃO** todas as ações essenciais são utilizáveis sem hover.

### AN. Keyboard access

**DADO** utilização apenas por teclado  
**QUANDO** o utilizador percorre a área de documentos  
**ENTÃO** consegue executar todos os fluxos críticos.

### AO. Empty state

**DADO** viagem sem documentos  
**QUANDO** a área é aberta  
**ENTÃO** existe orientação clara e ação para adicionar documento  
**SEM** afirmar que uma lista genérica de documentos é legalmente obrigatória.

### AP. Large document list

**DADO** 100 Document Records  
**QUANDO** a lista é aberta  
**ENTÃO** os ficheiros binários não são carregados automaticamente  
**E** a interface continua utilizável.

---

## 22. Agent requirements

### Product Agent

- must not introduce legal/immigration eligibility claims without a separate approved product capability;
- must preserve data-minimization principles.

### Architecture Agent

Must explicitly define:

- private storage provider/bucket strategy;
- object-key convention;
- signed URL or authenticated streaming strategy;
- expiration policy;
- upload transaction/rollback strategy;
- orphan cleanup;
- deletion/retention behavior;
- production malware-scanning decision;
- limits and expected costs.

### Database Agent

Must enforce:

- ownership isolation;
- same-Trip relation integrity;
- metadata constraints;
- no public storage dependency;
- safe cascades / `SET NULL` behavior consistent with this spec.

### Backend Agent

Must:

- authorize every metadata/file operation;
- validate upload type and size server-side;
- avoid logging sensitive access data;
- prevent IDOR/BOLA;
- expose metadata separately from file bytes.

### Frontend Agent

Must:

- never construct permanent public storage URLs;
- show upload states clearly;
- distinguish no-file vs upload-failed;
- avoid requesting file bytes for list views;
- make privacy and destructive actions understandable.

### QA Agent

Must test all scenarios in Section 21 plus regression on Trip/Reservation/Travel Leg relationships.

### Security Agent

Mandatory after QA. Must produce an explicit `APPROVED` or `BLOCKED` security milestone result before this module can be considered production-ready.

---

## 23. Product decisions requiring owner approval

Recommended decisions for MVP:

**P08-01 — APPROVE**  
Document metadata can exist without a file attachment.

**P08-02 — APPROVE**  
Private file uploads are included in the MVP.

**P08-03 — APPROVE**  
Allowed formats: PDF, JPEG/JPG, PNG and WEBP.

**P08-04 — APPROVE**  
Maximum attachment size is 10 MB for MVP.

**P08-05 — APPROVE**  
One active file attachment per Document Record in MVP.

**P08-06 — APPROVE**  
Full government document identifiers are not required structured fields; minimize sensitive metadata.

**P08-07 — APPROVE**  
Use lightweight `holder_label` instead of introducing a full Traveller entity in MVP.

**P08-08 — APPROVE**  
Default expiry warning begins 90 days before expiry.

**P08-09 — APPROVE**  
Triply warns about expiry but does not determine country-entry/visa eligibility in MVP.

**P08-10 — APPROVE**  
All attachments are private; permanent public file URLs are forbidden.

**P08-11 — APPROVE**  
Deleting/changing Stops, Reservations or Travel Legs must preserve documents rather than cascade-delete them.

**P08-12 — APPROVE**  
Removing an attachment and deleting a Document Record are separate actions.

**P08-13 — APPROVE**  
Archive preserves documents; permanent Trip deletion triggers storage cleanup according to architecture policy.

**P08-14 — APPROVE**  
A dedicated Security Agent milestone is mandatory after QA for this module.

---

## 24. Approval gate

This spec may move from `REVIEW` to `APPROVED` only after the product owner approves or modifies P08-01 through P08-14.

No Architecture, Database, Backend, Frontend or autonomous implementation agent may invent conflicting document/security behavior while this spec remains in `REVIEW`.


## Amendment v1.1 — Document view page and direct upload (owner request, 2026-10-05)

- Each document has a **"Ver documento"** page showing all its information, an inline private preview of the attachment (image or PDF, via a 5-minute signed URL created after ownership checks) and a **Descarregar** button.
- The attachment can be chosen in the create form. Files are uploaded from the browser directly to the private `trip-documents` bucket under `{user}/{trip}/{document}/{random}.{ext}` (storage RLS unchanged), avoiding the 4.5 MB server-function request limit. The server then verifies the path prefix, downloads the object and checks real content type (magic bytes) and size (≤ 10 MB) before keeping it; invalid objects are deleted and the previous attachment restored.
- Validation errors keep the typed values; a retried create never duplicates the document.
- Storage: owners may read objects inside their own `{user_id}/` folder of `trip-documents` (needed because Storage uploads return the inserted row). The bucket stays private and no other user's objects become readable. (2026-10-06)
