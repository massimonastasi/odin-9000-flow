#### Istruzioni per la nuova versione di Volundr
Analizza i file di questa repo relativi alla skill Volundr. Analizza e apprendi in modo dettagliato i file presenti nella cartella .github\prompts\volundr\data

### pipeline iniziale
    ## 1. Creare il file doc-components.md che contiene le informazioni per costruire i componenti che utilizzerà successivamente come istanze per creare la documentazione.
    
    # Istruzioni per la creazione del file doc-components.md
    Il file conterrà le informazioni per la creazione dei componenti che verranno utilizzati in serie per la creazione della documentazione della pagina del componente.
    Iniziamo con una fase di apprendimento dove mi chiedi gli url dei componenti e li definisci usando anche l'MCP Figma.
    Per ogni componente bisogna definire tutte le spefiche possibili, ad esempio:
        a. Scopo e informazioni sull'utilizzo del componente.
        b. Struttura
        c. Allineamento
        d. Ordinamento
        e. dimensioni (larghezza)
        f. padding e margine
        g. elementi interni con relative informazioni su tipografia, dimensioni e colore.

    Dopo aver completato il file chiedi l'url di una pagina Figma dove verificherò che i componenti vengono creati correttamente.


    ## 2. Creare il file page-template.md che contiene le informazioni per construire il design della documentazione del componente, costruito in modalità ibrida combinando le istanze dei componenti definiti dentro doc-components.md. Per creare il file chiedi il percorso del design Figma di esempio per definire la struttura.
    Usa inoltre le informazioni dei file e aggiorna i file:
        .github\prompts\volundr\data\page-template.md
        .github\prompts\volundr\data\anatomy-rules.md
        .github\prompts\volundr\data\variant-parsing-rules.md
    
    Dai sempre priorità all'uso delle istanze dei componenti rispetto alla costruzione diretta. 

    # Istruzioni per i vari elementi che compongono il template
        Template
        il titolo del template da generare è doc_[nome del componente Figma selezionato]. il template base ha sfondo bianco, 64px di padding, 96px di gap, con autolayout applicato verticalmente e allineamento verticale, 32px di corner radius.

        Header
        - Contiene le informazioni da inserire nella parte superiore del template.
            - design-system-label: il nome del design system di riferimento
            - component-title: il nome del componente elaborato dentro parentesi graffa. Ad esempio se il componente si chiama fds-sb-odds-button il titolo sarà {fds-sb:odds-button}. Se il componente si chiama fds-button, il titolo sarà {fds:button}.
            - description: Un abstract che contiene le informazioni relative al componente. Puoi trovare le informazioni di cosa inserire nei file md menzionati sopra.
        
        doc-columns
        - Contiene le colonne relative alle informazioni strutturate del documento, nominate in modo progressivo.
            - doc-column-1
            - doc-column-2
            - doc-column-3
            eccetera
        
            doc-column-1
            
            - da definire utilizzando lo stesso gap e stessa larghezza (fill) del componente. Contiene le informazioni principali con un gap tra le varie sezioni di 96px (analizzalo per il double check):

                purpose
                    - selection-title
                    - description
                        contiene le informazioni generali del componente. Prendi le informazioni dal componente o cerca online e chiedi conferma se il testo è corretto.
                
                behavior (optionale)
                    - selection-title
                    - description
                        informazioni relative all`utilizzo e i limiti del componente, usa l'approccio applicato per purpose.
                
                dependencies
                    utilizza una variante per il content.
                    - selection-title
                    - content-bullet-point
                        contiene l'stanza dei compoenti utilizzati all'interno del componente, ad esclusione delle icone. Se ci sono più istanze, duplica l'istanza
                
                icons
                    come dependencies ma fa riferminento alle icone utilizzate nel componente
                
                control Props
                    contiente una sezione speciale per mostrare le proprietà del componente. Se esistono altri componenti nella stessa pagina che vengono utilizzati all'nterno del componente principale (spesso definiti come block.[nome-componente], [nome-componente].block, block.[nome-subcomponente] oppure [nome-subcomponente].block) duplica il control Props e adattalo al sottocomponente.
                    - section-title--control-props
                        contiene il titolo control props e il nome del componente (o sottocompoennte)
                    - content--control-props
                        contiene le istanze dei componenti control-props--header da inserire in alto e control-props--row per ogni proprietà del componente (o sottocomponente relativo)

            doc-column-2 (opzionale)
            - specifiche definite come doc-column-1

                Composition
                    contiente le informazioni relative al componente
                    - selection-title
                    - description

                Usage
                    contiente le informazioni relative all'uso componente
                    - selection-title
                    - description

                Animation
                    contiente le informazioni relative alle animazioni presenti in una o più varianti del componente
                    - selection-title
                    - description

            doc-column-3 (opzionale)
            - specifiche definite come doc-column-1. Contiene la sezione chiamata section--anatomy, creata per definire nel dettaglio gli elementi che compongono una o più varianti del componente al fine di facilitarne la comprensione. Le informazioni relative a questa sezione posso essere usate solo come riferimento in questa url:
            .github\prompts\volundr\data\anatomy-rules.md

                flag-optional (opzionale)
                    contiene informazioni relative sull'anatomia che non sono mostrate
                
                Diagram + [variante]
                    contiente uno schema dettagliato del componente con relativi dettagli e punti di interessi.
                    Lo sfondo assegnato per lo schema va realizzato in modo che il componente sia sempre visibile,
                    vedi .github\prompts\volundr\data\anatomy-rules.md per maggiori informazioni.
                
                Legend
                    contiene la legenda dei dettagli del componente con relative informazioni di stile.
                    utilizza .github\prompts\volundr\data\anatomy-rules.md per la loro definizione.

        section--component
            si trova nella parte bassa della documentazione visiva, sotto doc-colums.
            Se esistono altri componenti in questa pagina (ad esempio dei componenti block o subcomponenti), si può decidere se includerli sotto o creare un altra documentazione visiva accanto
                section-title--control-props contiente il tipo di elemento (componente o widget) e il nome.
                componente originale spostato dentro la documentazione visiva..



## Cosa deve fare Volundr se attivato
    3. Tramite i comandi di Figma MCP, controllare che esista nel file Figma relativo una pagina chiamata volundr-components-doc.
    Se non esiste, genererà tramite i comandi di Figma MCP i componenti che sono stati definiti nel file .md definito nel punto 1. sopra

    4. Analizza il componente e definisci un file md che includerai in una cartella (component oppure widget). Utilizzerai questo file md per definire meglio le informazioni del componente e per velocizzare le le future modifiche della documentazione.

    5. Crea la documentazione visiva del componente spostando il componente stesso allínterno come descritto nelle istruzioni superiori. Non fare supposizioni e chiedi sempre passo passo come procedere.

    6. Alla conferma della corretta creazione della documentazione visiva, utilizzare le informazioni apprese per migliorare ulteriormente i file creati.

## Cosa fare una volta che Volundr è stato aggiornato
    7. Aggiornare anche le altre skill e la relativa documentazione del repo in merito a Volundr e controllare che Odin funzioni nel modo corretto.

    8. Correggere e pulire i file superflui relativi al progetto Volundr.

    9. merge del branch in quello principale.