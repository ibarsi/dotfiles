# llama

A local OpenAI-compatible inference endpoint on `127.0.0.1:1234`, served by
llama.cpp in router mode on the Omen's RTX 5090.

Two tracked files define the configuration. There is no environment file, no
drop-in, no `~/.config` entry:

| File | Installed to | Privileges |
|------|--------------|------------|
| `presets.ini` | `~/models/presets.ini` | none |
| `llama-server.service` | Root-owned copy at `/etc/systemd/system/llama-server.service` | root |

`install.sh` links the presets and copies the unit, and is called from `bootstrap-omarchy.sh`. It backs up existing regular files before replacement and only updates the unit when its contents drift or it is an old symlink. It skips on macOS.

Installing the unit needs root, and the script picks how to ask: `sudo` when
there's a terminal to type into, and `pkexec`'s graphical dialog when there
isn't — run from an agent, a hook or a menu entry, where `sudo` has nowhere to
prompt and simply fails. Either way it's one prompt for the whole job, not one
per command. If neither route is available the script prints the equivalent
`sudo` commands and leaves the unit alone rather than half-applying.

## Applying changes

The presets are symlinked and read at server startup. After editing them:

```bash
sudo systemctl restart llama-server
```

The systemd unit is a root-owned copy. After editing its tracked source, re-run `bash llama/install.sh`; when it detects drift, it installs the new copy, runs `systemctl daemon-reload`, and restarts the server. A manual copy must likewise be followed by daemon-reload and restart. Restart alone does not apply edits to the repository’s unit file.

## Why a system unit and not the packaged one

`llama-cpp` ships `/usr/lib/systemd/user/llama-server.service`, which is
heavily sandboxed — including `ProtectHome=tmpfs`. That makes `~/models`
invisible to the process, so the packaged unit cannot serve models stored in
the home directory. This unit replaces it: no sandboxing, `User=ibarsi`, and
the model directory passed explicitly.

The packaged user unit stays installed but disabled. Don't enable both — they
would both bind port 1234.

The unit is copied into `/etc/systemd/system` so PID 1 can resolve it before the home directory is mounted, and unprivileged edits to the checkout cannot rewrite the installed unit. Re-running the installer migrates an old symlink to this layout.

## Setting it up on another machine

Assumes the same hardware (RTX 5090, 32 GB VRAM). The tuning below is sized
for that card; on anything else the context and cache numbers need redoing.

```bash
sudo pacman -S llama-cpp ggml-cuda
mkdir -p ~/models/muse-glimmer        # then add the weights, see "Model files"
bash ~/dotfiles/llama/install.sh
sudo systemctl enable --now llama-server
curl -s localhost:1234/v1/models | jq -r '.data[].id'   # expect: muse-glimmer
```

**If your username isn't `ibarsi`,** the tracked configuration has a catch: the
paths are baked into the tracked files, and editing them dirties the working
tree. `/home/ibarsi` appears five times across the two files. Either keep a
local commit rewriting them:

```bash
sed -i "s|/home/ibarsi|$HOME|g; s|User=ibarsi|User=$USER|" \
	~/dotfiles/llama/llama-server.service ~/dotfiles/llama/presets.ini
```

…or keep machine-local copies of the presets and unit instead, which keeps the repo clean at the cost of manual syncing. The installer already copies the unit but links the presets.

## Model files

Not in this repo and not reproducible from it — roughly 17 GB of GGUF, pulled
from Hugging Face:

| File | Size | Role |
|------|------|------|
| `Muse-Glimmer-30B-UD-Q4_K_XL.gguf` | 15.9 GB | main model |
| `dflash-kquant.gguf` | 1.6 GB | speculative decoding draft model |

Both go in `~/models/muse-glimmer/`. The pair is not interchangeable:
`spec-type = draft-dflash` requires this draft model against this main model.
Copy them from a machine that already has them, or re-download the same
quants — `~/models/muse-glimmer/.cache/huggingface/` records the exact repo
revision they came from.

## Tuning notes

`ctx-size = 524288` (512K) fits in 32 GB of VRAM only because
`cache-type-k`/`cache-type-v = q8_0` halves the KV cache. Drop that and the
context has to come down.

`cache-ram = 4096` caps the prompt cache, which holds the saved KV state of idle
slots so a returning conversation can skip reprocessing. It lives in anonymous
system RAM, survives `sleep-idle-seconds`, and can only go to swap under memory
pressure. At 16 GB it sat in zram for days alongside the k8s stack. Raising the
cap means more cache hits on long contexts and more swap.

`sleep-idle-seconds = 900` unloads the model from VRAM after 15 minutes idle,
which matters on a laptop that also runs a desktop. First request after a
sleep pays the reload.

## Multimodal is off

`mmproj-Muse-Glimmer-30B-Q8_0.gguf` (2 GB) lives in `~/models-disabled/`,
deliberately moved out on 2026-09-08. Vision is therefore unavailable. To
re-enable, move it back into `~/models/muse-glimmer/` and restore the line
that was removed from the preset:

```ini
mmproj = /home/ibarsi/models/muse-glimmer/mmproj-Muse-Glimmer-30B-Q8_0.gguf
```

## Security

The unit binds `127.0.0.1` and sets no `--api-key`. That is only safe because
of the loopback bind.

**If you change `--host` to `0.0.0.0`, add `--api-key`.** Otherwise the result
is an unauthenticated inference endpoint reachable by anything on the network,
which will happily burn the GPU for strangers.

Nothing in these two files is a secret, which is why they're in a public repo.
Keep it that way: no API keys, no glossary terms, no internal hostnames. The
gitignored `system/.extra` is where host- and work-specific values belong.

## Known consumer

`voice-to-text/voxtype-glossary-correct.sh` targets this endpoint via
`VOXTYPE_LLM_ENDPOINT`, but that pass is currently disabled — see
`voice-to-text/README.md` for why (muse-glimmer reasons unconditionally and
cannot be told not to). Nothing else on the machine depends on the server.

[Omarchy bootstrap](../omarchy/README.md) · [Repository index](../README.md)
