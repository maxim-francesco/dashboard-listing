De închis: #6 („cifre contradictorii") — nu e bug, e vocabular. Se rescrie ca datorie de definiții, nu de query. #11 (/settings feed) rămâne deschis, netestat.

De adăugat:

Payload XSS stocat în Message.message, importat prin ETL, vizibil în /messages. Formular public acceptă HTML nesanitizat.
purchasePrice copiat din preț pe 6 din 7 anunțuri vândute → raport de profitabilitate cu profit total −7.000 EUR. Problemă de intrare, nu de calcul.
Message nu are updatedAt → lifecycle-ul de lead e nemonitorizabil prin construcție.
/api/reports/profitability orfan, în timp ce frontendul recalculează în browser.
soldThisMonth numără Contract.saleDate; Contract = 0 rânduri global → „0 vândute luna asta" garantat pe vecie.
14 locuri numără client-side din fetch complet de tabel → blochează paginarea (leagă #10 de faza asta).

De corectat: nota „toate cele 387 de mesaje sunt NEW" — 387 e suma pe toți tenanții, niciodată afișată. Dealerul vede 185.