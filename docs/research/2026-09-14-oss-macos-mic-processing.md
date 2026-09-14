# OSS macOS microphone processing alternatives to Krisp

## Recommendation

Try [NoNoise Mac](https://github.com/ivalsaraj/NoNoise-Mac) first. It is the
closest currently practical open-source replacement for the *microphone*
portion of Krisp on an Apple-silicon Mac: an MIT-licensed menu-bar app that
runs speech enhancement locally and presents a processed `NoNoise Mic` virtual
input to calling apps. It supports macOS 13+ on Apple Silicon and offers
Meeting/Podcast/Tutorial presets, adjustable suppression and reduction, plus
output-gain controls. [Project README](https://github.com/ivalsaraj/NoNoise-Mac#readme)

For a distant Razer Seiren, start with **Meeting**, then raise *Output Gain*
only enough to make ordinary speech audible. In Zoom, Discord, Meet, Slack,
etc., select **NoNoise Mic** as that app's microphone. Do **not** make it the
global macOS default input: the project's instructions warn that doing so can
create an audio loop/echo. Record a short local before/after sample before
using it in an important call.

This is an improvement path, not a cure for distance. AI suppression and a
small amount of gain can reduce fan/room noise and improve perceived speech
clarity, but they cannot restore the direct-to-room ratio lost when a
supercardioid desktop mic is two feet away. Aggressive suppression can also
produce artifacts. A closer capsule (boom, headset, or lav) remains the
reliable fix.

### Installation caveat

The current NoNoise package is ad-hoc signed rather than notarized, so macOS
will require a one-time **Privacy & Security -> Open Anyway** approval. Its
installer restarts Core Audio briefly. Review/build the source if that trust
model is not acceptable. [Install instructions](https://github.com/ivalsaraj/NoNoise-Mac#-install)

## Other OSS pieces

| Tool | What it provides | Fit for live calls |
| --- | --- | --- |
| [BlackHole](https://github.com/ExistentialAudio/BlackHole) (GPL-3.0) | macOS virtual loopback driver with no added driver latency | Useful routing plumbing for a DIY chain, but **not** mic processing: it has no denoiser, EQ, or compressor. The project documents passing one app's output into another app's input. |
| [OBS Studio](https://github.com/obsproject/obs-studio) (GPL-2.0-or-later) | Gain, compressor, expander, limiter, and RNNoise/Speex noise-suppression filters | Excellent for recordings/streams. Its audio filters process OBS sources, not a system-wide call microphone, so a separate virtual-audio route (for example BlackHole) is required before Zoom/Discord can consume it. [Noise suppression](https://obsproject.com/kb/noise-suppression-filter) and [compressor](https://obsproject.com/kb/compressor-filter) docs. |

The DIY OBS + BlackHole route is worthwhile only when you also record or
stream. It adds setup and failure modes, and it does not make room echo or a
distant source disappear. If using an Aggregate/Multi-Output device with
AirPods, BlackHole advises against using the AirPods microphone as the primary
clock because of its lower sample rate. [BlackHole FAQ](https://github.com/ExistentialAudio/BlackHole#faq)

## Excluded from the macOS shortlist

Linux audio effects stacks (for example EasyEffects) and Windows-focused
voice suites are not substitutes for a macOS virtual microphone. `RNNoise` by
itself is a signal-processing library, not a ready-to-select macOS input;
use it through NoNoise Mac or OBS instead. Razer Synapse is likewise not a
useful macOS processing path for the Seiren: an implementation-design note for
a separate open-source Seiren utility records that Synapse has no Razer
microphone support on macOS, and that utility's planned processing is
monitor-only rather than a call-app virtual input. [Design note](https://github.com/yterry/razer-seiren-macos/blob/main/docs/CREATOR_DESIGN.md)

## Decision

1. Install and A/B-test NoNoise Mac with the Seiren as its real input and
   `NoNoise Mic` selected **per calling app**.
2. Use modest output gain; stop increasing it if room tone becomes obvious.
3. If the remaining issue is chiefly quietness rather than noise, choose a
   nearer microphone format rather than assembling an OBS routing chain.
