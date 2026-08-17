---
trigger: always_on
---

# EVIDENCE DISCIPLINE

## Coincidental matches
When verifying a client-side predicate against SQL, the SQL must be a literal
translation of the JS, including branches that are currently unreachable.
If a branch is dead on current data, say so and label the result
"coincidental match on current data" — never "MATCHES EXACTLY".

## Vacuous evidence
A count over an empty table proves nothing. Before reporting
`count(*) WHERE <predicate>` as evidence, report the table's total row count.
Zero-of-zero is not a finding.

## ETL artifacts look like activity
`updatedAt > createdAt` is worthless as an activity signal when an import sets
createdAt explicitly and lets @updatedAt default to import time.
Check the ratio first: if ALL rows match, it is an import artifact.
State the ratio, never just the count.

## Absent columns are findings
If a field needed to answer a question does not exist in the schema, the answer
is "structurally undecidable", not "insufficient evidence". Say which column
would make it decidable.

## Source-of-data provenance
Before concluding anything about a column's meaning, check whether the ETL
source schema has that column. A column the source lacks holds defaults, not data.
A column the source has holds statements about the OLD system.