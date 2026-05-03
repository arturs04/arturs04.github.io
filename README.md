# Yange

Browser extension (Manifest V3) pre hladanie najlepsich svetelnych okien na fotenie na Slovensku.

## Co robi
- po kliknuti na ikonu rozsirrenia zobrazi panel na pravej tretine stranky,
- pri otvorenom paneli stmavi pozadie stranky (overlay),
- ponukne kuratorovane lokality + stovky dalsich lokalit z OpenStreetMap,
- dovoli pridat vlastne lokality podla nazvu, adresy alebo suradnic,
- zobrazi zakladnu mapu vybranej lokality,
- ukaze vychod a zapad slnka,
- vypocita rannu/vecernu golden hour a blue hour,
- vyhodnoti podmienky podla aktualnej oblacnosti,
- ukaze tipy na najlepsie miesta pre kazdu lokalitu.

## API
- `https://api.sunrise-sunset.org` (vychod/zapad slnka)
- `https://api.open-meteo.com` (aktualna oblacnost)
- `https://overpass-api.de` (fotolokacie z OpenStreetMap)
- `https://www.openstreetmap.org` (mapa lokality)
- `https://nominatim.openstreetmap.org` (vyhladanie suradnic podla nazvu/adresy)

## Spustenie (Chrome/Edge)
1. Otvor `chrome://extensions` alebo `edge://extensions`.
2. Zapni **Developer mode**.
3. Klikni **Load unpacked** a vyber tento priecinok.
4. Otvor lubovolnu `http`/`https` stranku.
5. Klikni na ikonu rozsirrenia a potom na **Otvorit panel**.
6. Na `http`/`https` stranke sa panel zobrazi priamo na stranke. Na internych strankach prehliadaca sa Yange otvori vo vlastnej karte.

## Poznamka
- Browser stranky typu `chrome://` a `edge://` nepodporuju content skripty, preto sa Yange na nich otvara ako samostatna karta rozsirrenia.
