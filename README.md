Deutsche Version (English version down below)

# 🦉 Semantische Suche

Eine **Chrome-Erweiterung**, mit der du Inhalte auf Webseiten mithilfe **natürlicher Sprache** semantisch durchsuchen kannst.

Im Hintergrund wird ein **ML-Modell für Embeddings** verwendet, um eine semantische Ähnlichkeitssuche zwischen Vektoren zu ermöglichen.  
Die gesamte Verarbeitung findet **lokal in deinem Browser** statt – es werden **keine Daten nach außen gesendet**.  
Daher ist die Erweiterung auch sicher auf **privaten oder firmeneigenen Webseiten** nutzbar.

---

## Verwendung der Erweiterung

Wenn du die Erweiterung einfach nur **nutzen** möchtest:

1. Lade die ZIP-Datei **`semantic-search.zip`** aus dem Hauptordner dieses Repositories herunter.  
2. Entpacke die Datei.  
3. Folge den Anweisungen unter [Erweiterung im Browser importieren](#-erweiterung-im-browser-importieren), um den entpackten Ordner in deinen Browser zu laden.

---

## Projekt selbst bauen

Führe im Hauptordner folgenden Befehl aus:

```bash
npm run build
```

## Erweiterung im Browser importieren

Der **Build**-Ordner kann anschließend im Browser geladen und ausgeführt werden.
Gehe dazu wie folgt vor:

* Öffne die Seite chrome://extensions/ in deinem Chrome-Browser.
* Aktiviere den Entwicklermodus (oben rechts).
* Klicke auf „Entpackte Erweiterung laden“ (Load unpacked)
* Wähle den Build-Ordner aus.

Die Erweiterung erscheint anschließend in der Liste und ist einsatzbereit.
Öffne eine beliebige Webseite und klicke auf das Eulen-Symbol 🦉, um das Seitenpanel der Erweiterung zu öffnen.

English version

# 🦉 Semantic Search
Chrome extension which allows you to sematically search content on web pages using natural language queries. Under the hood, embeddings ML model is used to enable semantic similarity search between embedding vectors. Full processing is happening in
your browser locally, and not sent anywhere. So it's safe to run on a privte/proprietary webpages as well.

# If you just want to use the extension
* Dowload the single ZIP file called **semantic-search.zip** from the main folder in this repository.
* Unzip it
* Then follow instructions from **Importing extension in your browser** down below, and upload unzipped folder in you browser.

# Building the project
In the main folder execute:
```bash
npm run build
```
You need Node installed on your machine as a prerequsite.

# Importing extension in your browser
**Build** folder can then be loaded in browser and run. For this, just got to Chrome Extensions page, enable developer mode and **Load Unpacked**. Extension will appear in the list and ready for use. Go to a webpage and click on the owl extension button to 
open sidepanel with extension.
