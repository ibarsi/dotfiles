.PHONY: bootstrap install check lint-shell fmt-shell fmt-check verify ai-doctor doctor precommit-install precommit-run

bootstrap:
	./bootstrap.sh

install:
	mise run mise-install

check:
	mise run check

lint-shell:
	mise run lint-shell

fmt-shell:
	mise run fmt-shell

fmt-check:
	mise run fmt-check

verify:
	mise run verify

ai-doctor:
	mise run ai-doctor

doctor:
	mise run doctor

precommit-install:
	mise run precommit-install

precommit-run:
	mise run precommit-run
