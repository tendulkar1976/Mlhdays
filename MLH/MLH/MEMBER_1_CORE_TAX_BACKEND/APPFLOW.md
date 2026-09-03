# APPFLOW.md — Core Tax, Backend & Database

## Core flow
Onboarding → Tax Profile → Tax Twin v1 → calculation → explanation → action.

## Reconciliation
Upload → extraction → confidence → compare → conflict/confirmation → verification state → new Tax Twin version → recalculate.

## What-If
Baseline Tax Twin → isolated scenario → deterministic calculation → compare → Apply or Discard. Apply creates a new version; Discard leaves baseline unchanged.

## Your focus
Own database, immutable Tax Twin versioning, deterministic tax engine, statutory rule versioning, calculation APIs, validation, auditability and automated tests.
