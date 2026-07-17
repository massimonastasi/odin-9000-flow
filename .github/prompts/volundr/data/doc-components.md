# Volundr Doc-Kit — `doc-components.md`

Spec canonica degli **atomi del doc-kit** usati da Volundr per costruire la
documentazione visiva di un componente Figma. Scritta durante la **Fase 1**
di [istruzioni.md](istruzioni.md), analizzando via MCP Figma il set reale già
esistente nel file di riferimento.

> **Fonte**: file Figma `RNbMGKPqYRz2vkANBdSJWx`, sezione `components`
> (node `120:1984`). **La sezione `components` stessa non è un atomo** — è solo
> il contenitore/organizzatore usato in quel file per raggruppare gli 8
> componenti reali sotto. Volundr istanzia i componenti elencati sotto, mai il
> contenitore.
>
> **Decisione presa con l'utente (2026-07-17)**: questo set (`design-system-label`,
> `component-title`, `description`, `description--bullet-points`,
> `section-title`, `section-title--control-props`, `control-props--header`,
> `control-props--row`) è **canonico** e sostituisce la nomenclatura
> `Page Header` / `Section` usata finora in `page-template.md` (che nello stesso
> file esisteva in parallelo con nomi duplicati `control-props--header/row` ma
> spec diverse — collisione ora risolta a favore di questo set).
> I colori del set sorgente sono **hardcoded** (rgba); vanno **ri-tokenizzati**
> sulle variabili FDS equivalenti prima/durante la pubblicazione in un file
> nuovo (vedi colonna "Token proposto" in ogni tabella — da confermare con
> l'utente/team design **prima di bindare**, non ancora applicato).

---

## 1. `design-system-label`

**Node sorgente**: `105:229` (166×42, hug content, `flex-col items-start`)

- **a. Scopo**: eyebrow/etichetta in alto a sinistra dell'header che identifica
  il design system e la categoria di libreria a cui appartiene il componente
  documentato (es. "Fabric Foundations / Components").
- **b. Struttura**: frame con due nodi TEXT impilati, nessun contenitore extra.
- **c. Allineamento**: verticale, `items-start` (allineato a sinistra).
- **d. Ordinamento**: riga 1 = nome design system (uppercase), riga 2 = nome
  categoria/libreria.
- **e. Dimensioni**: larghezza hug (166px nel sorgente, non fissa — si adatta al
  testo); nessuna altezza fissa.
- **f. Padding/margine**: nessun padding interno; gap 0 tra le due righe (i due
  `<p>` sono adiacenti, non un frame con `gap`).
- **g. Elementi interni**:
  | Riga | Font | Size | Tracking | Case | Colore hardcoded | Token proposto |
  |---|---|---|---|---|---|---|
  | 1 — nome design system | Open Sans Bold | 15px | -0.15px | UPPERCASE | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |
  | 2 — nome libreria | Open Sans Regular | 16px | -0.16px | normale | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |

---

## 2. `component-title`

**Node sorgente**: `105:230` (352×49, hug, `items-center`)

- **a. Scopo**: titolo principale della pagina di documentazione — il nome del
  componente nel **formato `{prefix:nome-componente}`**.
- **b. Struttura**: un solo nodo TEXT.
- **c. Allineamento**: `items-center` (nel proprio frame, che è comunque hug).
- **d. Ordinamento**: n/a (singolo elemento).
- **e. Dimensioni**: hug orizzontale, `whitespace-nowrap` (non va a capo — se il
  nome è molto lungo il frame si allarga).
- **f. Padding/margine**: nessuno.
- **g. Elementi interni**:
  | Font | Size | Tracking | Colore hardcoded | Token proposto |
  |---|---|---|---|---|
  | Open Sans Bold | 36px | -0.36px | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |

  **Formato titolo** (confermato dal riferimento reale `Button-Control`):
  `{prefix:nome-componente}` — es. il componente `fds-sb-odds-button` diventa
  `{fds-sb:odds-button}`, `fds-button` diventa `{fds:button}`. Il prefisso è la
  parte prima del secondo trattino significativo (`fds` / `fds-sb` / altri
  namespace del design system); il resto del nome va dopo i due punti.

---

## 3. `description`

**Node sorgente**: `105:231` (550×25 nel kit — **550px è la larghezza del kit
di anteprima, non un valore fisso da riusare**: nell'uso reale dentro una
colonna di documentazione la larghezza segue il contenuto della colonna, es.
920/937px in `Button-Control`, il riferimento hand-made originale)

- **a. Scopo**: paragrafo di testo libero — usato per abstract, Usage,
  Behaviour, Best Practices, Animation, Examples: qualunque sezione a
  prosa semplice.
- **b. Struttura**: un solo nodo TEXT, `flex-[1_0_0]` (si allarga a riempire il
  contenitore).
- **c. Allineamento**: `items-center` verticale nel proprio frame (testo non
  centrato orizzontalmente, solo il blocco è centrato verticalmente se il
  frame è più alto del testo).
- **d. Ordinamento**: n/a.
- **e. Dimensioni**: **fill** orizzontale (segue la larghezza della colonna
  ospitante), altezza hug.
- **f. Padding/margine**: nessuno nel nodo stesso (il padding è dato dal
  contenitore che lo ospita, es. `Doc Column N` con padding 40).
- **g. Elementi interni**:
  | Font | Size | Tracking | Colore hardcoded | Token proposto |
  |---|---|---|---|---|
  | Open Sans Regular | 18px | -0.18px | `black` (`#000`) | `var/fds/fds-on-surface-hi` |

---

## 4. `description--bullet-points`

**Node sorgente**: `108:2843` (550×25 nel kit, stessa nota sulla larghezza di
`description`)

- **a. Scopo**: variante di `description` per contenuti a **elenco puntato**
  (es. "Dependencies" — istanze/nomi di sotto-componenti; "Icons" — elenco
  icone). Corrisponde a `content-bullet-point` in `istruzioni.md`.
- **b. Struttura**: `<ul>` con uno o più `<li class="list-disc">`; ogni bullet
  è uno `<span>` di testo.
- **c. Allineamento**: `items-center` verticale nel frame ospitante,
  `flex-[1_0_0]` orizzontale.
- **d. Ordinamento**: un `<li>` per riga, nell'ordine in cui gli elementi
  (istanze/icone) sono elencati.
- **e. Dimensioni**: fill orizzontale (stessa nota di `description`).
- **f. Padding/margine**: indentazione bullet `ms-[27px]` (margin-start della
  lista); nessun padding esterno.
- **g. Elementi interni**:
  | Font | Size | Tracking | Colore hardcoded | Token proposto |
  |---|---|---|---|---|
  | Open Sans Bold Italic | 18px | -0.18px | `black` (`#000`) | `var/fds/fds-on-surface-hi` |

  **Regola di duplicazione**: se la sezione (es. Dependencies) ha più di
  un'istanza da elencare, duplicare il `<li>` all'interno dello stesso blocco
  — non creare più istanze separate del componente.

---

## 5. `section-title`

**Node sorgente**: `108:2812` (142×33, hug, `items-center`)

- **a. Scopo**: titolo generico di una sotto-sezione (Usage, Behaviour, Best
  Practices, Animation, Icons, Composition, Examples, ecc.) — il testo
  segnaposto nel kit è `section-title`, va sostituito col nome reale.
- **b. Struttura**: un solo nodo TEXT.
- **c. Allineamento**: `items-center`.
- **d. Ordinamento**: n/a.
- **e. Dimensioni**: hug, `whitespace-nowrap`.
- **f. Padding/margine**: nessuno.
- **g. Elementi interni**:
  | Font | Size | Tracking | Colore hardcoded | Token proposto |
  |---|---|---|---|---|
  | Open Sans Bold | 24px | -0.24px | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |

---

## 6. `section-title--control-props`

**Node sorgente**: `105:232` (537×33, `flex items-center gap-[8px]`)

- **a. Scopo**: titolo speciale per la sezione **Control Props** — combina il
  nome fisso "Control Props" con un suffisso tra parentesi che indica il
  **ruolo/nome del (sotto)componente** a cui la tabella si riferisce (es. "Main
  Wrapper / Composition Host" per il componente principale). Per un
  sotto-componente il suffisso diventa il suo nome (pattern di rilevamento:
  `[nome-componente].[nome-blocco/subcomponente]`, confermato dall'utente il
  2026-07-17 — vedi tabella sotto).
- **b. Struttura**: due nodi TEXT affiancati con gap 8px: label fissa +
  suffisso descrittivo.
- **c. Allineamento**: `items-center`, orizzontale.
- **d. Ordinamento**: label "Control Props" **prima**, suffisso tra parentesi
  **dopo**.
- **e. Dimensioni**: hug, `whitespace-nowrap`.
- **f. Padding/margine**: gap 8px tra i due nodi, nessun padding esterno.
- **g. Elementi interni**:
  | Parte | Font | Colore hardcoded | Token proposto |
  |---|---|---|---|
  | "Control Props" (fisso) | Open Sans Bold, 24px | `rgba(0,0,0,0.87)` | `var/fds/fds-on-surface-hi` |
  | "(ruolo/nome sotto-componente)" | Open Sans Italic, 24px | `rgba(0,0,0,0.6)` | `var/fds/fds-on-surface-m` |

  **Regola di duplicazione (da `istruzioni.md`, pattern confermato 2026-07-17)**:
  se nella pagina esistono altri componenti usati **dentro** il componente
  principale — nominati `[nome-componente].[nome-blocco/subcomponente]` (es.
  `fds-sb-odds-button.chain`: nome del componente padre, un punto letterale,
  poi il nome del blocco/sotto-componente) — duplicare l'intero blocco Control
  Props (questo titolo + `control-props--header` + una `control-props--row`
  per proprietà) una volta per ciascun sotto-componente, con il suffisso
  aggiornato al suo nome.

---

## 7. `control-props--header`

**Node sorgente**: `105:233` (larghezza 550px nel kit — vedi nota su
`description`: nell'uso reale segue la larghezza della colonna/tabella, es.
920–937px)

- **a. Scopo**: riga di intestazione della tabella Control Props — colonne
  "Name" / "Control".
- **b. Struttura**: frame flex orizzontale, due celle `flex-[1_0_0]`.
- **c. Allineamento**: `items-center`, orizzontale, celle equamente divise.
- **d. Ordinamento**: "Name" a sinistra, "Control" a destra.
- **e. Dimensioni**: fill orizzontale (larghezza della tabella), altezza
  minima 32px.
- **f. Padding/margine**: `padding-y: 12px`; bordo **solo inferiore** 1px
  solid (`strokeBottomWeight = 1`, `strokeTopWeight/Left/Right = 0`,
  `strokeAlign = 'INSIDE'` — non un bordo su tutti e 4 i lati).
- **g. Elementi interni**:
  | Elemento | Font | Size | Tracking | Case | Colore hardcoded | Token |
  |---|---|---|---|---|---|---|
  | "Name" / "Control" | Open Sans Bold | 14px | -0.14px | UPPERCASE | `black`, opacity 80%, bordo `rgba(0,0,0,0.24)` | testo → `var/fds/fds-on-surface-hi`; bordo → **`var/fds/fds-on-surface-ulow`** (confermato e bindato con successo il 2026-07-17 sul file di test) |

---

## 8. `control-props--row`

**Node sorgente**: `105:234` (larghezza 550px nel kit, stessa nota su
`control-props--header`)

- **a. Scopo**: una riga della tabella Control Props — una proprietà (Name) e i
  suoi valori possibili (Control), separati da virgola.
- **b. Struttura**: frame flex orizzontale, due celle `flex-[1_0_0]`; cella
  sinistra = testo singolo (nome prop), cella destra = testo singolo
  (valori comma-separated).
- **c. Allineamento**: `items-start`, orizzontale.
- **d. Ordinamento**: nome proprietà a sinistra, valori a destra — **una riga
  per ogni Control Prop** rilevata (vedi `variant-parsing-rules.md`).
- **e. Dimensioni**: fill orizzontale, altezza minima 32px.
- **f. Padding/margine**: `padding-y: 12px`; bordo **solo inferiore** 1px
  solid, stessa implementazione di `control-props--header`
  (`strokeBottomWeight = 1`, altri lati a 0), così le righe si impilano con un
  separatore continuo.
- **g. Elementi interni**:
  | Elemento | Font | Size | Tracking | Colore hardcoded | Token |
  |---|---|---|---|---|---|
  | Nome prop (es. "Count") | Open Sans Bold | 16px | -0.16px | `black`, opacity 80% | `var/fds/fds-on-surface-hi` |
  | Valori (es. "1,2,3") | Open Sans Regular | 16px | -0.16px | `black`, opacity 80% | `var/fds/fds-on-surface-hi` |
  | Bordo inferiore | — | — | — | `rgba(0,0,0,0.24)` | **`var/fds/fds-on-surface-ulow`** (confermato e bindato con successo il 2026-07-17 sul file di test) |

---

## 9. `Anatomy--item`

**Node sorgente**: `105:219` (340px, `flex gap-[10px] items-start`) — **trovato
il 2026-07-17**, esiste già come componente reale altrove nella stessa pagina
del file `RNbMGKPqYRz2vkANBdSJWx` (fuori dalla sezione `components` che
raggruppa gli altri 8). Corregge quanto scritto finora in `page-template.md`
e `anatomy-rules.md` (che lo davano per mancante/hand-built) — va **istanziato**
come gli altri atomi.

- **a. Scopo**: una riga numerata della legenda Anatomy — abbina il pin
  numerato sul diagramma al nome del nodo e alle sue proprietà token-bound (o
  al flag "nessun token" quando non è bindato).
- **b. Struttura**: frame orizzontale (`num` + `txt`), gap 10.
  - `num`: cerchio 22×22, `rounded-[11px]` (50%), contenuto centrato = numero.
  - `txt`: colonna (gap 2) con due righe: nome nodo + tipo, poi una riga
    proprietà/flag.
- **c. Allineamento**: `items-start` orizzontale (root), `items-center`
  all'interno di `num`, `items-start` in `txt`.
- **d. Ordinamento**: `num` a sinistra, `txt` a destra; dentro `txt`, nome nodo
  sopra, riga proprietà/flag sotto.
- **e. Dimensioni**: larghezza 340px nel kit (hug/adattabile al testo, non un
  valore rigido — verificare contro un nodo canonico se disponibile); `num`
  fisso 22×22.
- **f. Padding/margine**: gap 10 tra `num` e `txt`; gap 2 tra le due righe di
  `txt`; nessun padding esterno.
- **g. Elementi interni**:
  | Elemento | Font | Size | Colore hardcoded | Token proposto |
  |---|---|---|---|---|
  | Numero dentro `num` | Open Sans Bold | 12px | `white` su sfondo `#d93326` (rosso, hardcoded) | testo → invariato (bianco su accento); sfondo → **da verificare** (nessun token FDS "pin/accento" ancora identificato — proporre `var/fds/fds-*-accent` o simile e confermare con il team design prima di bindare) |
  | Nome nodo + tipo (es. "root (COMPONENT)") | Inter Semi Bold | 14px | `#17171c` | `var/fds/fds-on-surface-hi` |
  | Riga proprietà / flag (es. "⚑ no bound token") | Open Sans Regular | 12px | **già tokenizzato**: `var/on-surface-m` (`rgba(0,0,0,0.6)` fallback) | invariato — è l'unico testo del set già legato a una variabile nel file sorgente |

  Segue esattamente il formato già descritto in `anatomy-rules.md` (numero +
  nome nodo + una riga per proprietà risolta, o il flag quando non c'è alcun
  token) — quel file resta autorevole per **quali** proprietà mostrare e come
  risolverle; questo atomo è solo il suo contenitore visivo, ora reale.

---

## Atomi ancora mancanti dal kit (aggiornato 2026-07-17)

`Anatomy--item` **non è più mancante** (vedi §9 sopra). Restano da chiudere:
`variants--cell`, `surfaces--row`, `Banner` — ma questi tre sono **deprecati**
dopo la riscrittura di `page-template.md` v2 (il componente originale viene
spostato as-is dentro `section--component`, non più mostrato tramite una
grid curata) e **non vanno più cercati né ricostruiti**, salvo richiesta
esplicita dell'utente per una vetrina curata in un caso specifico.

`section--component` (la sezione in fondo pagina che ospita il componente
originale) resta un **frame composto da Volundr**, non un componente a sé —
riusa l'atomo `section-title--control-props` per il suo titolo (vedi
`page-template.md`).

---

## Estensione del kit — rilevamento di pattern ripetuti (aggiunto 2026-07-17)

Regola valida sia in **Fase 1** (analisi/costruzione di `doc-components.md`)
sia a **runtime** (Volundr che genera/aggiorna una documentazione, Fase 3):

> Se durante l'analisi di un componente, o durante la costruzione della
> documentazione visiva, Volundr nota **uno o più moduli che seguono un
> pattern ripetuto** (una struttura ricorrente non ancora coperta da un atomo
> esistente — es. un blocco che si ripete identico in più sezioni o in più
> componenti diversi) — **non lo hand-build silenziosamente e non lo ignora**.
> Deve **chiedere all'utente** se preferisce:
> 1. **promuoverlo a nuovo atomo del doc-kit** — in tal caso: aggiungere la
>    sua spec completa (stesso formato delle sezioni 1–9 sopra: scopo,
>    struttura, allineamento, ordinamento, dimensioni, padding/margine,
>    elementi interni con token proposti) a **questo file**, poi pubblicarlo
>    come componente reale sulla pagina **`volundr-components-doc`** in
>    Figma — **sempre chiedendo conferma prima di pubblicare**, mai in
>    automatico (regola già confermata per gli atomi mancanti); oppure
> 2. **lasciarlo com'è** (hand-built una tantum, senza promuoverlo).
>
> Non decidere da solo quale delle due opzioni scegliere — è sempre
> una domanda da porre, non un'euristica automatica.

Esempi di "pattern ripetuto" da segnalare: una struttura di
riga/cella/badge che ricorre identica in più `section--*` di uno stesso
componente; un blocco che si ripete identico documentando più
componenti/widget diversi (candidato forte a diventare un atomo condiviso,
come è successo storicamente con `control-props--row` o `Anatomy--item`).

## Prossimo passo

Con questi 9 atomi documentati, la Fase 2 di `istruzioni.md` ha già aggiornato
`page-template.md` e `anatomy-rules.md` (v2) — restano da allineare i
riferimenti ad `Anatomy--item` come "mancante/hand-built" in quei due file
(vedi sezione "Aggiornamento" in `istruzioni.md`).
