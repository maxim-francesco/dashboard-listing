## Contractul metricilor

Orice număr afișat în UI declară patru lucruri, altfel e un defect:

1. **Unitate** — rânduri sau entități? („185 mesaje" ≠ „159 persoane")
2. **Scope** — tenant sau global?
3. **Fereastră** — tot istoricul, sau o perioadă? „Nou" fără fereastră e o minciună.
4. **Sursă** — server (`count()`) sau client (`.filter().length` pe fetch complet)?

Aceeași metrică nu are voie să existe în două implementări. Dacă serverul
returnează `actionNeeded`, clientul nu-l recalculează.

Eticheta trebuie să conțină unitatea și fereastra: nu „159 de sunat", ci
„159 persoane cu lead deschis".