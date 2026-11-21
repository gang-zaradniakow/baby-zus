# Nakładka na tasks.py dla Linux/macOS (i dla Windows z zainstalowanym make).
# Cała logika jest w tasks.py – na Windows bez make: `python tasks.py <komenda>`.
ifeq ($(OS),Windows_NT)
PY ?= python
else
PY ?= python3
endif

COMMANDS := venv install lint format typecheck test test-live test-e2e schemas check pre-commit clean
.PHONY: help $(COMMANDS)
.DEFAULT_GOAL := help

help:
	@$(PY) tasks.py help

$(COMMANDS):
	@$(PY) tasks.py $@
